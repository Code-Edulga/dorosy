// Attendance (PRD LMS-06): QR check-in at the door, or a roster tick by the instructor or assistant.
// Saving triggers same-day absence alerts to parents (AI-07).

import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius, space } from '../../../theme/tokens';
import { useT } from '../../../i18n';
import { useStore } from '../../../data/store';
import { courseById, groupById, groupRoster, sessionById } from '../../../data/selectors';
import { groupWhere } from '../../../data/format';
import { fmtDayLabel, fmtTime } from '../../../lib/dates';
import { Avatar, Btn, Card, Notice, Row, Screen, Section, Txt } from '../../../components/ui';
import { QrBlock } from '../../../components/QrBlock';
import type { AttendanceStatus } from '../../../data/types';
import type { StringKey } from '../../../i18n/strings';

const OPTIONS: { v: AttendanceStatus; label: StringKey; color: string; tint: string }[] = [
  { v: 'present', label: 'attended', color: colors.good, tint: colors.goodTint },
  { v: 'late', label: 'late', color: colors.warn, tint: colors.warnTint },
  { v: 'absent', label: 'absent', color: colors.bad, tint: colors.badTint },
];

export default function Attendance() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { t, L, lang } = useT();
  const s = useStore();
  const x = sessionById(sessionId);
  const g = groupById(x.groupId);
  const roster = groupRoster(s, g.id);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(() => ({ ...(s.attendance[x.id] ?? {}) }));
  const [saved, setSaved] = useState(false);

  const present = Object.values(marks).filter((m) => m === 'present' || m === 'late').length;
  const allMarked = roster.every((r) => marks[r.id]);

  const save = () => {
    const full: Record<string, AttendanceStatus> = {};
    roster.forEach((r) => (full[r.id] = marks[r.id] ?? 'absent'));
    s.saveAttendance(x.id, full);
    setMarks(full);
    setSaved(true);
  };

  return (
    <Screen
      back
      title={t('attendanceTitle')}
      subtitle={`${L(courseById(x.courseId).title)} — ${fmtDayLabel(x.start, lang)} ${fmtTime(x.start, lang)}${lang === 'ar' ? '، ' : ', '}${groupWhere(g, lang)}`}
      footer={
        saved ? (
          <Btn label={t('done')} full onPress={() => router.back()} />
        ) : (
          <Btn label={`${t('saveAttendance')} — ${t('presentCount', { a: present, b: roster.length })}`} full onPress={save} />
        )
      }
    >
      {saved ? (
        <View style={{ marginBottom: space.l }}>
          <Notice text={t('attendanceSaved')} />
        </View>
      ) : null}

      <Card style={{ alignItems: 'center', gap: space.m }}>
        <Txt w="s" center>
          {t('scanQr')}
        </Txt>
        <QrBlock seed={x.id} />
        <Txt size="micro" color={colors.inkMute} center>
          {t('qrHint')}
        </Txt>
      </Card>

      <Section title={t('orTick')} action={t('markAllPresent')} onAction={() => setMarks(Object.fromEntries(roster.map((r) => [r.id, 'present' as const])))}>
        <Card style={{ paddingVertical: space.xs }}>
          {roster.map((r, i) => (
            <Row key={r.id} gap={space.m} style={[{ paddingVertical: space.m }, i ? styles.sep : null]}>
              <Avatar name={L(r.name)} size={36} color={marks[r.id] === 'absent' ? colors.bad : colors.blue} />
              <View style={{ flex: 1 }}>
                <Txt w="m" numberOfLines={1}>
                  {L(r.name)}
                </Txt>
              </View>
              <Row gap={4}>
                {OPTIONS.map((o) => {
                  const on = marks[r.id] === o.v;
                  return (
                    <Pressable
                      key={o.v}
                      onPress={() => {
                        setSaved(false);
                        setMarks((m) => ({ ...m, [r.id]: o.v }));
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={`${L(r.name)}: ${t(o.label)}`}
                      style={[styles.opt, on && { backgroundColor: o.tint, borderColor: o.color }]}
                    >
                      <Txt size="micro" w={on ? 's' : 'r'} color={on ? o.color : colors.inkSoft} center>
                        {t(o.label)}
                      </Txt>
                    </Pressable>
                  );
                })}
              </Row>
            </Row>
          ))}
        </Card>
        {!allMarked && !saved ? (
          <Txt size="micro" color={colors.inkMute}>
            {t('unmarkedAbsent')}
          </Txt>
        ) : null}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  opt: { minWidth: 48, paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.small, borderWidth: 1, borderColor: colors.line },
});
