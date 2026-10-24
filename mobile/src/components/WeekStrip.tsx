import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme/tokens';
import { useT } from '../i18n';
import { Icon, Row, Txt } from './ui';
import { addDays, dayShort, monthName, sameDay, startOfDay } from '../lib/dates';

/** Egyptian school weeks start on Saturday. */
export function weekStart(d: Date): Date {
  const x = startOfDay(d);
  const back = (x.getDay() + 1) % 7; // Saturday -> 0
  return addDays(x, -back);
}

type Props = {
  selected: Date;
  onSelect: (d: Date) => void;
  week: Date; // any date in the visible week
  onWeek: (d: Date) => void;
  marks: (d: Date) => { session: boolean; due: boolean };
};

export function WeekStrip({ selected, onSelect, week, onWeek, marks }: Props) {
  const { lang, t } = useT();
  const start = weekStart(week);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();
  const end = days[6];
  const title =
    start.getMonth() === end.getMonth()
      ? `${monthName(start.getMonth(), lang)} ${start.getFullYear()}`
      : `${monthName(start.getMonth(), lang)} – ${monthName(end.getMonth(), lang)}`;

  return (
    <View style={{ gap: space.m }}>
      <Row justify="space-between">
        <Txt w="s">{title}</Txt>
        <Row gap={space.xs}>
          <Pressable onPress={() => onWeek(addDays(start, -7))} style={styles.nav} accessibilityRole="button" accessibilityLabel="previous week">
            <Icon name="chevron-back" size={18} />
          </Pressable>
          <Pressable
            onPress={() => {
              onWeek(today);
              onSelect(startOfDay(today));
            }}
            style={[styles.nav, { width: undefined, paddingHorizontal: 12 }]}
            accessibilityRole="button"
          >
            <Txt w="m" size="small">
              {t('today')}
            </Txt>
          </Pressable>
          <Pressable onPress={() => onWeek(addDays(start, 7))} style={styles.nav} accessibilityRole="button" accessibilityLabel="next week">
            <Icon name="chevron-forward" size={18} />
          </Pressable>
        </Row>
      </Row>
      <Row gap={6} justify="space-between">
        {days.map((d) => {
          const sel = sameDay(d, selected);
          const isToday = sameDay(d, today);
          const m = marks(d);
          return (
            <Pressable
              key={d.toISOString()}
              onPress={() => onSelect(d)}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              style={[styles.day, sel && { backgroundColor: colors.blue, borderColor: colors.blue }, !sel && isToday && { borderColor: colors.blue }]}
            >
              <Txt size="micro" color={sel ? '#C9D5FA' : colors.inkSoft} center>
                {dayShort(d, lang)}
              </Txt>
              <Txt w="b" size="heading" color={sel ? '#fff' : colors.ink} center>
                {d.getDate()}
              </Txt>
              <Row gap={3} justify="center" style={{ height: 6 }}>
                {m.session ? <View style={[styles.dot, { backgroundColor: sel ? colors.cyan : colors.cyan }]} /> : null}
                {m.due ? <View style={[styles.dot, { backgroundColor: colors.sun }]} /> : null}
              </Row>
            </Pressable>
          );
        })}
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    height: 34,
    width: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  day: {
    flex: 1,
    paddingVertical: space.s,
    borderRadius: radius.control,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    gap: 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
