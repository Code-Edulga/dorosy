import React, { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, space } from '../../../theme/tokens';
import { useT } from '../../../i18n';
import { useStore } from '../../../data/store';
import { courseById, groupById, mySessions, rosterById } from '../../../data/selectors';
import { groupLabel } from '../../../data/format';
import { addDays, fmtDayLabel, fmtMoney } from '../../../lib/dates';
import { Avatar, Btn, Card, Notice, Row, Screen, Section, Stat, Tag, Txt } from '../../../components/ui';
import { ScoreBars } from '../../../components/ScoreBars';
import { attendanceTag } from '../../../components/attendance';

export default function StudentProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, L, lang } = useT();
  const s = useStore();
  const r = rosterById(s, id);
  const g = groupById(r.groupId);
  const c = courseById(g.courseId);
  const [cashDone, setCashDone] = useState(false);
  const now = new Date();
  const log = mySessions()
    .filter((x) => x.groupId === g.id && x.end < now && s.attendance[x.id]?.[r.id])
    .reverse()
    .slice(0, 6);
  const points = r.scores.map((pct, i) => ({
    title: { ar: `تقييم ${i + 1}`, en: `Assessment ${i + 1}` },
    pct,
    date: addDays(now, -7 * (r.scores.length - i)),
  }));

  const open = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <Screen back>
      <Row gap={space.m}>
        <Avatar name={L(r.name)} size={64} />
        <View style={{ flex: 1 }}>
          <Txt w="b" size="title">
            {L(r.name)}
          </Txt>
          <Txt size="small" color={colors.inkSoft}>
            {L(c.title)} — {groupLabel(g, lang)}
          </Txt>
        </View>
      </Row>

      <Row gap={space.s} style={{ marginTop: space.l }}>
        <View style={{ flex: 1 }}>
          <Btn label={t('call')} icon="call" variant="outline" full small onPress={() => open(`tel:+2${r.phone}`)} />
        </View>
        <View style={{ flex: 1 }}>
          <Btn label={t('whatsapp')} icon="logo-whatsapp" variant="outline" full small onPress={() => open(`https://wa.me/2${r.phone}`)} />
        </View>
      </Row>

      <Card style={{ marginTop: space.l }}>
        <Row gap={space.l}>
          <Stat label={t('attendanceRate')} value={`${Math.round(r.attendance * 100)}%`} color={r.attendance < 0.75 ? colors.bad : colors.cyan} />
          <Stat label={t('lastScore')} value={`${r.scores[r.scores.length - 1]}%`} color={colors.blue} />
          <Stat label={t('thisMonthFee')} value={r.paidThisMonth ? t('paidStatus') : t('unpaidStatus')} color={r.paidThisMonth ? colors.good : colors.warn} />
        </Row>
      </Card>

      {!r.paidThisMonth ? (
        <View style={{ marginTop: space.m }}>
          <Btn label={t('recordCash')} icon="cash" variant="outline" full onPress={() => { s.recordCash(r.id); setCashDone(true); }} />
        </View>
      ) : null}
      {cashDone ? (
        <View style={{ marginTop: space.m }}>
          <Notice text={`${t('cashRecorded')} ${fmtMoney(c.price)} ${t('egp')}`} />
        </View>
      ) : null}

      <Section title={t('recentScores')}>
        <Card>
          <ScoreBars points={points} height={90} />
        </Card>
      </Section>

      <Section title={t('attendanceLog')}>
        <Card style={{ paddingVertical: space.xs }}>
          {log.map((x, i) => {
            const a = s.attendance[x.id][r.id];
            const tag = attendanceTag(a, t);
            return (
              <Row key={x.id} justify="space-between" style={[{ paddingVertical: space.m }, i ? styles.sep : null]}>
                <View style={{ flex: 1 }}>
                  <Txt w="m">{L(x.topic)}</Txt>
                  <Txt size="micro" color={colors.inkSoft}>
                    {fmtDayLabel(x.start, lang)}
                  </Txt>
                </View>
                <Tag label={tag.label} tone={tag.tone} />
              </Row>
            );
          })}
        </Card>
      </Section>

      <Section title={t('parent')}>
        <Card>
          <Txt w="s">{L(r.parentName)}</Txt>
          <Txt size="small" color={colors.inkSoft} style={{ marginBottom: space.m }}>
            {r.parentPhone}
          </Txt>
          <Row gap={space.s}>
            <View style={{ flex: 1 }}>
              <Btn label={t('call')} icon="call" variant="outline" full small onPress={() => open(`tel:+2${r.parentPhone}`)} />
            </View>
            <View style={{ flex: 1 }}>
              <Btn label={t('whatsapp')} icon="logo-whatsapp" variant="outline" full small onPress={() => open(`https://wa.me/2${r.parentPhone}`)} />
            </View>
          </Row>
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
