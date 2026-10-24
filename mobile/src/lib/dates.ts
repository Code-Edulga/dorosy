// Date helpers that do not depend on Intl locale data (Hermes ships limited Intl).
// All mock data is generated relative to "now", so the demo always looks current.

export type Lang = 'ar' | 'en';

const DAYS: Record<Lang, string[]> = {
  ar: ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
const DAYS_SHORT: Record<Lang, string[]> = {
  ar: ['أحد', 'اتنين', 'تلات', 'أربع', 'خميس', 'جمعة', 'سبت'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
const MONTHS: Record<Lang, string[]> = {
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

export const DAY_MS = 86_400_000;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function dayDiff(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function isoDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export const dayName = (d: Date, lang: Lang) => DAYS[lang][d.getDay()];
export const dayShort = (d: Date, lang: Lang) => DAYS_SHORT[lang][d.getDay()];
export const weekdayName = (i: number, lang: Lang) => DAYS[lang][i];
export const monthName = (m: number, lang: Lang) => MONTHS[lang][m];

export function fmtTime(d: Date, lang: Lang): string {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = lang === 'ar' ? (h < 12 ? 'ص' : 'م') : h < 12 ? 'AM' : 'PM';
  return `${h12}:${m} ${suffix}`;
}

/** Clock split into digits and AM/PM marker, for large display where the marker is set smaller. */
export function fmtClock(d: Date, lang: Lang): { hm: string; suffix: string } {
  const full = fmtTime(d, lang);
  const i = full.lastIndexOf(' ');
  return { hm: full.slice(0, i), suffix: full.slice(i + 1) };
}

export function fmtDate(d: Date, lang: Lang): string {
  return lang === 'ar'
    ? `${d.getDate()} ${MONTHS.ar[d.getMonth()]}`
    : `${MONTHS.en[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

/** "Today", "Tomorrow", "Saturday 26 October" */
export function fmtDayLabel(d: Date, lang: Lang, now = new Date()): string {
  const diff = dayDiff(now, d);
  if (diff === 0) return lang === 'ar' ? 'النهارده' : 'Today';
  if (diff === 1) return lang === 'ar' ? 'بكرة' : 'Tomorrow';
  if (diff === -1) return lang === 'ar' ? 'امبارح' : 'Yesterday';
  return `${dayName(d, lang)} ${fmtDate(d, lang)}`;
}

/** Relative day phrase for due dates: "today", "tomorrow", "in 3 days", "3 days ago". */
export function fmtRelDay(d: Date, lang: Lang, now = new Date()): string {
  const diff = dayDiff(now, d);
  if (diff === 0) return lang === 'ar' ? 'النهارده' : 'today';
  if (diff === 1) return lang === 'ar' ? 'بكرة' : 'tomorrow';
  if (diff === -1) return lang === 'ar' ? 'امبارح' : 'yesterday';
  if (diff > 1 && diff < 7) return lang === 'ar' ? `بعد ${diff} أيام` : `in ${diff} days`;
  if (diff < -1 && diff > -7) return lang === 'ar' ? `من ${-diff} أيام` : `${-diff} days ago`;
  return lang === 'ar' ? `${dayName(d, lang)} ${fmtDate(d, lang)}` : fmtDate(d, lang);
}

/** "2 h 15 min" / "2 س 15 د" */
export function fmtDuration(ms: number, lang: Lang): string {
  const totalMin = Math.max(0, Math.round(ms / 60_000));
  const days = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (lang === 'ar') {
    if (days > 0) return `${days} يوم و${h} ساعة`;
    if (h > 0) return `${h} ساعة و${m} دقيقة`;
    return `${m} دقيقة`;
  }
  if (days > 0) return `${days} d ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

export function fmtMoney(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
