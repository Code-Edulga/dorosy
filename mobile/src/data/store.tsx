import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as M from './mock';
import { api, apiEnabled } from './api';
import type {
  AttendanceStatus,
  ChatMessage,
  Handoff,
  Invoice,
  PayMethod,
  Role,
  RosterStudent,
  Submission,
} from './types';

export type AlertSettings = {
  absence: boolean;
  weekly: boolean;
  payments: boolean;
  lowScore: boolean;
  lowScorePct: number;
  quietHours: boolean;
};

type State = {
  role: Role | null;
  childId: string;
  submissions: Submission[];
  invoices: Invoice[];
  roster: RosterStudent[];
  chats: Record<string, ChatMessage[]>; // by childId
  handoffs: Handoff[];
  attendance: Record<string, Record<string, AttendanceStatus>>; // sessionId -> rosterId -> status
  grades: Record<string, Record<string, number>>; // assessmentId -> rosterId -> score
  publishedGrades: string[]; // assessmentIds
  alertSettings: AlertSettings;
  extraEnrollments: { childId: string; groupId: string }[];
};

type Actions = {
  setRole: (r: Role | null) => void;
  setChild: (id: string) => void;
  submitWork: (assessmentId: string, childId: string, answer: string) => void;
  payInvoice: (invoiceId: string, method: PayMethod) => void;
  syncInvoices: () => Promise<void>;
  sendChat: (childId: string, text: string, reply: string) => void;
  replyHandoff: (id: string, text: string) => void;
  saveAttendance: (sessionId: string, marks: Record<string, AttendanceStatus>) => void;
  saveGrades: (assessmentId: string, scores: Record<string, number>, publish: boolean) => void;
  recordCash: (rosterId: string) => void;
  setAlertSettings: (s: Partial<AlertSettings>) => void;
  register: (childId: string, groupId: string) => void;
};

type Store = State & Actions;

const Ctx = createContext<Store | null>(null);

let seq = 0;
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${(seq++).toString(36)}`;

function initialAttendance(): State['attendance'] {
  // Past sessions of the instructor's groups already have attendance recorded.
  const out: State['attendance'] = {};
  const mine = new Set(M.groups.filter((g) => M.courses.find((c) => c.id === g.courseId)?.instructorId === M.ME_INSTRUCTOR).map((g) => g.id));
  for (const s of M.sessions) {
    if (!mine.has(s.groupId) || s.end > M.NOW) continue;
    const marks: Record<string, AttendanceStatus> = {};
    M.roster
      .filter((r) => r.groupId === s.groupId)
      .forEach((r, i) => {
        // Deterministic spread that roughly matches each student's attendance rate.
        const roll = ((s.start.getDate() * 7 + i * 13) % 100) / 100;
        marks[r.id] = roll < r.attendance ? (roll > r.attendance - 0.05 ? 'late' : 'present') : 'absent';
      });
    out[s.id] = marks;
  }
  return out;
}

function initialChats(): State['chats'] {
  const brief = (ar: string, en: string): ChatMessage => ({
    id: uid('m'),
    from: 'bot',
    text: { ar, en },
    at: new Date(M.NOW.getTime() - 26 * 3_600_000),
  });
  return {
    k1: [
      brief(
        'ملخص الأسبوع: حضر 3 من 4 حصص. أعلى درجة: كويز قانون أوم 17 من 20. مطلوب: ورقة مسائل كيرشوف قبل يوم التسليم.',
        "Weekly brief: attended 3 of 4 sessions. Best score: Ohm's law quiz, 17/20. Due: Kirchhoff problem sheet.",
      ),
    ],
    k2: [
      brief(
        'ملخص الأسبوع: حضرت كل الحصص. كويز الحركة 15 من 20. مطلوب: ورقة المتجهات.',
        'Weekly brief: attended every session. Motion quiz 15/20. Due: vectors sheet.',
      ),
    ],
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(() => ({
    role: null,
    childId: 'k1',
    submissions: M.submissions,
    invoices: M.invoices,
    roster: M.roster,
    chats: initialChats(),
    handoffs: M.handoffs,
    attendance: initialAttendance(),
    grades: {},
    publishedGrades: [],
    alertSettings: { absence: true, weekly: true, payments: true, lowScore: true, lowScorePct: 60, quietHours: true },
    extraEnrollments: [],
  }));

  const patch = useCallback((fn: (s: State) => Partial<State>) => setState((s) => ({ ...s, ...fn(s) })), []);

  const actions = useMemo<Actions>(
    () => ({
      setRole: (role) => patch((s) => ({ role, childId: role === 'student' ? 'k1' : s.childId })),
      setChild: (childId) => patch(() => ({ childId })),
      submitWork: (assessmentId, childId, answer) =>
        patch((s) => ({
          submissions: s.submissions.map((x) =>
            x.assessmentId === assessmentId && x.childId === childId
              ? { ...x, status: 'submitted', submittedAt: new Date(), answer }
              : x,
          ),
        })),
      payInvoice: (invoiceId, method) =>
        patch((s) => ({
          invoices: s.invoices.map((i) =>
            i.id === invoiceId ? { ...i, status: 'paid', paidVia: method, paidAt: new Date() } : i,
          ),
        })),
      // Paid status from the backend wins, so a payment Paymob confirmed while the app was closed shows up.
      // Only ever upgrades to paid: invoices the backend doesn't know about keep their demo status.
      syncInvoices: async () => {
        if (!apiEnabled) return;
        try {
          const remote = (await Promise.all(M.children.map((c) => api.invoices(c.id)))).flat();
          const paid = new Map(remote.filter((r) => r.status === 'paid').map((r) => [r.id, r]));
          patch((s) => ({
            invoices: s.invoices.map((i) => {
              const r = paid.get(i.id);
              if (!r || i.status === 'paid') return i;
              return { ...i, status: 'paid', paidVia: r.paidVia ?? undefined, paidAt: r.paidAt ? new Date(r.paidAt) : new Date() };
            }),
          }));
        } catch {
          // Offline or backend down: keep what we have.
        }
      },
      sendChat: (childId, text, reply) =>
        patch((s) => ({
          chats: {
            ...s.chats,
            [childId]: [
              ...(s.chats[childId] ?? []),
              { id: uid('m'), from: 'me', text, at: new Date() },
              { id: uid('m'), from: 'bot', text: reply, at: new Date() },
            ],
          },
        })),
      replyHandoff: (id, text) =>
        patch((s) => ({ handoffs: s.handoffs.map((h) => (h.id === id ? { ...h, reply: text } : h)) })),
      saveAttendance: (sessionId, marks) => patch((s) => ({ attendance: { ...s.attendance, [sessionId]: marks } })),
      saveGrades: (assessmentId, scores, publish) =>
        patch((s) => ({
          grades: { ...s.grades, [assessmentId]: scores },
          publishedGrades: publish ? Array.from(new Set([...s.publishedGrades, assessmentId])) : s.publishedGrades,
        })),
      recordCash: (rosterId) =>
        patch((s) => ({ roster: s.roster.map((r) => (r.id === rosterId ? { ...r, paidThisMonth: true } : r)) })),
      setAlertSettings: (a) => patch((s) => ({ alertSettings: { ...s.alertSettings, ...a } })),
      register: (childId, groupId) =>
        patch((s) => ({ extraEnrollments: [...s.extraEnrollments, { childId, groupId }] })),
    }),
    [patch],
  );

  useEffect(() => {
    void actions.syncInvoices();
  }, [actions]);

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
