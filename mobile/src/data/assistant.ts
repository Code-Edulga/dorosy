// Demo assistant: answers logistics questions from the child's own data only (PRD AI-03, AI-12).
// Anything it can't answer is handed to the instructor (AI-11). In production this is an LLM call
// with the same data scope and the same handoff rule.

import { fmtDayLabel, fmtMoney, fmtRelDay, fmtTime, type Lang } from '../lib/dates';
import { groupWhere } from './format';
import {
  childAverage,
  childById,
  childWork,
  courseById,
  groupById,
  instructorOfCourse,
  nextSession,
  outstandingFor,
} from './selectors';
import type { useStore } from './store';

type S = ReturnType<typeof useStore>;

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));

export function answer(s: S, childId: string, raw: string, lang: Lang): string {
  const text = raw.toLowerCase();
  const child = childById(childId);
  const L = (v: { ar: string; en: string }) => v[lang];

  if (has(text, ['حصة', 'الحصه', 'ميعاد', 'إمتى', 'امتى', 'next', 'session', 'class', 'when'])) {
    const n = nextSession(s, childId);
    if (!n) return lang === 'ar' ? 'مفيش حصص جاية في الجدول.' : 'There are no upcoming sessions on the schedule.';
    const g = groupById(n.groupId);
    const c = courseById(n.courseId);
    return lang === 'ar'
      ? `الحصة الجاية: ${L(c.title)}، ${fmtDayLabel(n.start, lang)} الساعة ${fmtTime(n.start, lang)}، ${groupWhere(g, lang)}. الموضوع: ${L(n.topic)}.`
      : `Next session: ${L(c.title)}, ${fmtDayLabel(n.start, lang)} at ${fmtTime(n.start, lang)}, ${groupWhere(g, lang)}. Topic: ${L(n.topic)}.`;
  }

  if (has(text, ['واجب', 'مطلوب', 'تسليم', 'due', 'homework', 'assignment', 'have to'])) {
    const pending = childWork(s, childId).filter((w) => w.sub.status === 'pending' && w.a.due > new Date());
    if (!pending.length) return lang === 'ar' ? 'مفيش حاجة مطلوبة دلوقتي.' : 'Nothing is due right now.';
    const lines = pending
      .slice(0, 3)
      .map((w) => `• ${L(w.a.title)} (${L(courseById(w.a.courseId).title)}): ${fmtRelDay(w.a.due, lang)}`);
    return (lang === 'ar' ? 'المطلوب:\n' : 'Due:\n') + lines.join('\n');
  }

  if (has(text, ['درج', 'مستوى', 'grade', 'score', 'mark', 'how am i', 'how is'])) {
    const parts = Object.keys(child.history).map(
      (cid) => `• ${L(courseById(cid).title)}: ${childAverage(child, cid)}%`,
    );
    return (lang === 'ar' ? 'متوسط الدرجات:\n' : 'Average scores:\n') + parts.join('\n');
  }

  if (has(text, ['فلوس', 'دفع', 'مصاريف', 'pay', 'owe', 'fee', 'bill', 'invoice'])) {
    const o = outstandingFor(s, childId);
    if (!o.total) return lang === 'ar' ? 'كل المصاريف مدفوعة.' : 'All fees are paid.';
    const over = o.overdue.reduce((a, i) => a + i.amount, 0);
    return lang === 'ar'
      ? `المستحق ${fmtMoney(o.total)} ج.م${over ? `، منهم ${fmtMoney(over)} ج.م متأخرين` : ''}. تقدر تدفع من صفحة المدفوعات.`
      : `${fmtMoney(o.total)} EGP outstanding${over ? `, of which ${fmtMoney(over)} EGP is overdue` : ''}. You can pay from Billing.`;
  }

  const firstCourse = Object.keys(child.history)[0] ?? 'c1';
  const who = instructorOfCourse(firstCourse).name[lang];
  return lang === 'ar'
    ? `السؤال ده محتاج ${who}. بعته ليه وهيرد عليك هنا وعلى واتساب.`
    : `This one needs ${who}. I've sent it over; the reply will come here and on WhatsApp.`;
}
