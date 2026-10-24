// Read-only views over mock data + store state. Screens call these instead of touching data directly,
// which keeps the swap to a real API contained here.

import * as M from './mock';
import { sameDay } from '../lib/dates';
import type { Assessment, AttendanceStatus, Child, Session, Submission } from './types';
import type { useStore } from './store';

type S = ReturnType<typeof useStore>;

export const courseById = (id: string) => M.courses.find((c) => c.id === id)!;
export const groupById = (id: string) => M.groups.find((g) => g.id === id)!;
export const instructorById = (id: string) => M.instructors.find((i) => i.id === id)!;
export const childById = (id: string) => M.children.find((c) => c.id === id)!;
export const instructorOfCourse = (courseId: string) => instructorById(courseById(courseId).instructorId);
export const instructorByHandle = (h: string) => M.instructors.find((i) => i.handle === h);

// ---------- Family side ----------

export function childGroupIds(s: S, childId: string): string[] {
  const base = childById(childId).groupIds;
  const extra = s.extraEnrollments.filter((e) => e.childId === childId).map((e) => e.groupId);
  return Array.from(new Set([...base, ...extra]));
}

export function childCourseIds(s: S, childId: string): string[] {
  return Array.from(new Set(childGroupIds(s, childId).map((g) => groupById(g).courseId)));
}

export function childSessions(s: S, childId: string): Session[] {
  const gs = new Set(childGroupIds(s, childId));
  return M.sessions.filter((x) => gs.has(x.groupId));
}

export function nextSession(s: S, childId: string, now = new Date()): Session | undefined {
  return childSessions(s, childId).find((x) => x.end > now);
}

export function childAttendance(childId: string, session: Session, now = new Date()): AttendanceStatus | undefined {
  if (session.end > now) return undefined;
  return M.childAttendanceExceptions[`${childId}:${session.id}`] ?? 'present';
}

export function childAttendanceRate(s: S, childId: string, courseId?: string): number {
  const past = childSessions(s, childId).filter((x) => x.end < new Date() && (!courseId || x.courseId === courseId));
  if (!past.length) return 1;
  const ok = past.filter((x) => {
    const a = childAttendance(childId, x);
    return a === 'present' || a === 'late';
  }).length;
  return ok / past.length;
}

export type WorkItem = { a: Assessment; sub: Submission };

export function childWork(s: S, childId: string): WorkItem[] {
  const courses = new Set(childCourseIds(s, childId));
  return M.assessments
    .filter((a) => courses.has(a.courseId))
    .map((a) => ({
      a,
      sub: s.submissions.find((x) => x.assessmentId === a.id && x.childId === childId) ?? {
        assessmentId: a.id,
        childId,
        status: 'pending' as const,
      },
    }))
    .sort((x, y) => x.a.due.getTime() - y.a.due.getTime());
}

export function childHistory(child: Child, courseId: string) {
  return child.history[courseId] ?? [];
}

export function childAverage(child: Child, courseId?: string): number {
  const pts = courseId ? childHistory(child, courseId) : Object.values(child.history).flat();
  if (!pts.length) return 0;
  return Math.round(pts.reduce((a, p) => a + p.pct, 0) / pts.length);
}

export function childInvoices(s: S, childId: string) {
  return s.invoices.filter((i) => i.childId === childId).sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
}

export function outstandingFor(s: S, childId: string) {
  const open = s.invoices.filter((i) => i.childId === childId && i.status !== 'paid');
  const overdue = open.filter((i) => i.status === 'overdue');
  const total = open.reduce((a, i) => a + i.amount, 0);
  const next = open.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
  return { open, overdue, total, next };
}

/** Recordings unlock only when the current month for that course is paid. */
export function recordingsUnlocked(s: S, childId: string, courseId: string, now = new Date()) {
  const inv = s.invoices.find(
    (i) => i.childId === childId && i.courseId === courseId && i.month === now.getMonth() && i.year === now.getFullYear(),
  );
  return !inv || inv.status === 'paid';
}

// ---------- Instructor side ----------

export const myCourses = () => M.courses.filter((c) => c.instructorId === M.ME_INSTRUCTOR);
export const myGroups = () => M.groups.filter((g) => courseById(g.courseId).instructorId === M.ME_INSTRUCTOR);
export const mySessions = () => {
  const ids = new Set(myGroups().map((g) => g.id));
  return M.sessions.filter((s) => ids.has(s.groupId));
};
export const sessionById = (id: string) => M.sessions.find((s) => s.id === id)!;

export function sessionsOn(day: Date, list: Session[]) {
  return list.filter((s) => sameDay(s.start, day));
}

export function groupRoster(s: S, groupId: string) {
  return s.roster.filter((r) => r.groupId === groupId);
}

export function courseRoster(s: S, courseId: string) {
  const gs = new Set(M.groups.filter((g) => g.courseId === courseId).map((g) => g.id));
  return s.roster.filter((r) => gs.has(r.groupId));
}

export function courseMonthProgress(courseId: string, now = new Date()) {
  const inMonth = M.sessions.filter(
    (x) => x.courseId === courseId && x.start.getMonth() === now.getMonth() && x.start.getFullYear() === now.getFullYear(),
  );
  const held = inMonth.filter((x) => x.end < now).length;
  return { held, total: inMonth.length };
}

export const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

export function courseStats(s: S, courseId: string) {
  const r = courseRoster(s, courseId);
  return {
    students: r.length,
    avgScore: avg(r.map((x) => x.scores[x.scores.length - 1])),
    attendance: avg(r.map((x) => Math.round(x.attendance * 100))),
  };
}

export function rosterById(s: S, id: string) {
  return s.roster.find((r) => r.id === id)!;
}

export function instructorAlerts(s: S) {
  const mineGroupIds = new Set(myGroups().map((g) => g.id));
  const mine = s.roster.filter((r) => mineGroupIds.has(r.groupId));
  const myCourseIds = new Set(myCourses().map((c) => c.id));
  const ungradedAssessments = M.assessments.filter(
    (a) => myCourseIds.has(a.courseId) && a.due < new Date() && !s.publishedGrades.includes(a.id) && a.kind !== 'quiz',
  );
  return {
    absent: mine.filter((r) => r.absentStreak >= 2).length,
    overdue: mine.filter((r) => !r.paidThisMonth).length,
    ungraded: ungradedAssessments.reduce((n, a) => n + Math.ceil(courseRoster(s, a.courseId).length * 0.8), 0),
    handoffs: s.handoffs.filter((h) => !h.reply).length,
  };
}

export function revenue(s: S) {
  const mineGroupIds = new Set(myGroups().map((g) => g.id));
  const mine = s.roster.filter((r) => mineGroupIds.has(r.groupId));
  const price = (r: (typeof mine)[number]) => courseById(groupById(r.groupId).courseId).price;
  const collected = mine.filter((r) => r.paidThisMonth).reduce((a, r) => a + price(r), 0);
  const outstanding = mine.filter((r) => !r.paidThisMonth).reduce((a, r) => a + price(r), 0);
  const byGroup = myGroups().map((g) => {
    const rs = mine.filter((r) => r.groupId === g.id);
    const p = courseById(g.courseId).price;
    return {
      group: g,
      collected: rs.filter((r) => r.paidThisMonth).length * p,
      outstanding: rs.filter((r) => !r.paidThisMonth).length * p,
    };
  });
  return { collected, outstanding, byGroup, unpaid: mine.filter((r) => !r.paidThisMonth) };
}

export function seatsLeft(s: S, groupId: string) {
  const g = groupById(groupId);
  const taken = s.roster.filter((r) => r.groupId === groupId).length + s.extraEnrollments.filter((e) => e.groupId === groupId).length;
  return Math.max(0, g.capacity - taken);
}

export const courseGroups = (courseId: string) => M.groups.filter((g) => g.courseId === courseId);
export const instructorCourses = (instructorId: string) => M.courses.filter((c) => c.instructorId === instructorId);
