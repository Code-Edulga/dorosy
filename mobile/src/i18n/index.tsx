import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import { ar, en, type StringKey } from './strings';
import type { Lang } from '../lib/dates';

/** Text that exists in both languages (names, course titles, places). */
export type Localized = { ar: string; en: string };

type Vars = Record<string, string | number>;

type I18n = {
  lang: Lang;
  rtl: boolean;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: StringKey, vars?: Vars) => string;
  /** Pick the current language from a Localized value. */
  L: (v: Localized) => string;
  /** Horizontal flex direction that follows reading direction. */
  row: ViewStyle['flexDirection'];
  /** Text alignment that follows reading direction. */
  align: TextStyle['textAlign'];
  /** Start / end edges, for absolute positioning and one-sided spacing. */
  start: 'left' | 'right';
  end: 'left' | 'right';
};

const Ctx = createContext<I18n | null>(null);

function fill(s: string, vars?: Vars) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

/**
 * Direction is handled in layout code (row / align) rather than with I18nManager.forceRTL,
 * so switching language takes effect instantly without an app reload, on native and web alike.
 */
export function I18nProvider({ children, initial = 'ar' }: { children: React.ReactNode; initial?: Lang }) {
  const [lang, setLang] = useState<Lang>(initial);
  const toggleLang = useCallback(() => setLang((l) => (l === 'ar' ? 'en' : 'ar')), []);

  const value = useMemo<I18n>(() => {
    const rtl = lang === 'ar';
    const dict = rtl ? ar : en;
    return {
      lang,
      rtl,
      setLang,
      toggleLang,
      t: (key, vars) => fill(dict[key], vars),
      L: (v) => v[lang],
      row: rtl ? 'row-reverse' : 'row',
      align: rtl ? 'right' : 'left',
      start: rtl ? 'right' : 'left',
      end: rtl ? 'left' : 'right',
    };
  }, [lang, toggleLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useT must be used inside I18nProvider');
  return v;
}
