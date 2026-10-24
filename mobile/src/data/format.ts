import { fmtTime, weekdayName, type Lang } from '../lib/dates';
import type { Group } from './types';

/** "Saturday and Tuesday" / "السبت والتلات" */
export function groupDays(g: Group, lang: Lang): string {
  const names = g.days.map((d) => weekdayName(d, lang));
  return lang === 'ar' ? names.join(' و') : names.join(' and ');
}

export function groupTime(g: Group, lang: Lang): string {
  const d = new Date();
  d.setHours(g.hour, g.minute, 0, 0);
  return fmtTime(d, lang);
}

/** "Saturday and Tuesday, 4:00 PM" */
export function groupLabel(g: Group, lang: Lang): string {
  return `${groupDays(g, lang)}، ${groupTime(g, lang)}`.replace('،', lang === 'ar' ? '،' : ',');
}

/** Where a group meets, as one line. */
export function groupWhere(g: Group, lang: Lang): string {
  if (g.mode === 'online') return lang === 'ar' ? 'أونلاين' : 'Online';
  return `${g.place?.[lang] ?? ''}، ${g.area?.[lang] ?? ''}`.replace('،', lang === 'ar' ? '،' : ',');
}

/** Egyptian secondary grade names: 10 = أولى ثانوي, 11 = تانية ثانوي, 12 = تالتة ثانوي. */
export function gradeLabel(n: 10 | 11 | 12, lang: Lang): string {
  if (lang === 'ar') return { 10: 'أولى ثانوي', 11: 'تانية ثانوي', 12: 'تالتة ثانوي' }[n];
  return `Grade ${n}`;
}
