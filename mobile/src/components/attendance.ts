import type { StringKey } from '../i18n/strings';
import type { AttendanceStatus } from '../data/types';
import type { Tone } from './ui';

export function attendanceTag(a: AttendanceStatus, t: (k: StringKey) => string): { label: string; tone: Tone } {
  switch (a) {
    case 'present':
      return { label: t('attended'), tone: 'good' };
    case 'late':
      return { label: t('late'), tone: 'warn' };
    case 'absent':
      return { label: t('absent'), tone: 'bad' };
    case 'excused':
      return { label: t('excused'), tone: 'neutral' };
  }
}
