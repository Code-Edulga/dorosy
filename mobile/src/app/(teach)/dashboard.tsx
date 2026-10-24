import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import {
  courseById,
  courseMonthProgress,
  courseStats,
  groupById,
  groupRoster,
  instructorAlerts,
  instructorById,
  myCourses,
  mySessions,
  sessionsOn,
} from '../../data/selectors';
import { groupWhere } from '../../data/format';
import { ME_INSTRUCTOR } from '../../data/mock';
import { fmtClock, fmtTime } from '../../lib/dates';
import { Bar, Btn, Card, Empty, Icon, ListRow, Row, Screen, Section, Tag, Txt, type IconName } from '../../components/ui';
import { TeachTop } from '../../components/TeachTop';

export default function Dashboard() {
  const { t, L, lang } = useT();
  const s = useStore();
  const now = new Date();
  const today = sessionsOn(now, mySessions());
  const alerts = instructorAlerts(s);
  const me = instructorById(ME_INSTRUCTOR);

  const allAlerts: { n: number; text: string; icon: IconName; tone: string; go: () => void }[] = [
    { n: alerts.handoffs, text: t('alertHandoff', { n: alerts.handoffs }), icon: 'chatbubbles', tone: colors.blue, go: () => router.push('/inbox') },
    { n: alerts.absent, text: t('alertAbsent', { n: alerts.absent }), icon: 'person-remove', tone: colors.bad, go: () => router.push({ pathname: '/students', params: { filter: 'lowAttendance' } }) },
    { n: alerts.overdue, text: t('alertOverdue', { n: alerts.overdue }), icon: 'wallet', tone: colors.warn, go: () => router.push('/revenue') },
    { n: alerts.ungraded, text: t('alertUngraded', { n: alerts.ungraded }), icon: 'create', tone: '#0B7F8F', go: () => router.push('/teach/course/c1') },
  ];
  const alertRows = allAlerts.filter((a) => a.n > 0);

  return (
    <Screen>
      <TeachTop />

      <Section title={t('todaySessions')} style={{ marginTop: 0 }}>
        {today.length ? (
          today.map((x) => {
            const g = groupById(x.groupId);
            const roster = groupRoster(s, g.id);
            const marks = s.attendance[x.id];
            const present = marks ? Object.values(marks).filter((m) => m === 'present' || m === 'late').length : 0;
            const live = now >= x.start && now <= x.end;
            const clock = fmtClock(x.start, lang);
            return (
              <Card key={x.id} style={live ? { borderColor: colors.blue, borderWidth: 1.5 } : undefined}>
                <Row gap={space.l} align="flex-start">
                  <View style={styles.clock}>
                    <Txt w="b" size="heading" color={colors.blueDeep} center>
                      {clock.hm}
                    </Txt>
                    <Txt size="micro" w="m" color={colors.inkSoft} center>
                      {clock.suffix}
                    </Txt>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt w="b">{L(courseById(x.courseId).title)}</Txt>
                    <Txt size="small" color={colors.inkSoft}>
                      {L(x.topic)}
                    </Txt>
                    <Txt size="small" color={colors.inkSoft}>
                      {groupWhere(g, lang)} — {roster.length} {t('students')}
                    </Txt>
                  </View>
                </Row>
                <Row justify="space-between" style={{ marginTop: space.m }}>
                  {marks ? (
                    <Tag label={`${t('attendanceTaken')}: ${t('presentCount', { a: present, b: roster.length })}`} tone="good" icon="checkmark-circle" />
                  ) : live ? (
                    <Tag label={t('startsNow')} tone="sun" />
                  ) : (
                    <Txt size="small" color={colors.inkMute}>
                      {fmtTime(x.start, lang)} – {fmtTime(x.end, lang)}
                    </Txt>
                  )}
                  <Btn
                    small
                    label={marks ? t('editAttendance') : t('takeAttendance')}
                    icon={marks ? 'create-outline' : 'qr-code'}
                    variant={marks ? 'outline' : 'primary'}
                    onPress={() => router.push(`/teach/attendance/${x.id}`)}
                  />
                </Row>
              </Card>
            );
          })
        ) : (
          <Card>
            <Empty text={t('noSessionsToday')} action={t('tabSchedule')} onAction={() => router.push('/schedule')} />
          </Card>
        )}
      </Section>

      {alertRows.length ? (
        <Section title={t('needsAttention')}>
          <Card style={{ paddingVertical: space.xs }}>
            {alertRows.map((a, i) => (
              <View key={a.text} style={i ? styles.sep : undefined}>
                <ListRow
                  leading={
                    <View style={[styles.alertIcon, { backgroundColor: a.tone + '1A' }]}>
                      <Icon name={a.icon} size={18} color={a.tone} flip={false} />
                    </View>
                  }
                  title={a.text}
                  onPress={a.go}
                />
              </View>
            ))}
          </Card>
        </Section>
      ) : null}

      <Section title={t('coursesProgress')}>
        {myCourses().map((c) => {
          const p = courseMonthProgress(c.id);
          const st = courseStats(s, c.id);
          return (
            <Card key={c.id} onPress={() => router.push(`/teach/course/${c.id}`)}>
              <Row justify="space-between" align="flex-start">
                <View style={{ flex: 1 }}>
                  <Txt w="b">{L(c.title)}</Txt>
                  <Txt size="small" color={colors.inkSoft}>
                    {st.students} {t('students')}
                  </Txt>
                </View>
                <Icon name="chevron-forward" size={18} color={colors.inkMute} />
              </Row>
              <View style={{ marginTop: space.m, gap: 6 }}>
                <Row justify="space-between">
                  <Txt size="micro" color={colors.inkSoft}>
                    {t('sessionsThisMonth')}
                  </Txt>
                  <Txt size="micro" w="s">
                    {t('sessionsHeld', { a: p.held, b: p.total })}
                  </Txt>
                </Row>
                <Bar value={p.total ? p.held / p.total : 0} color={colors.blue} />
              </View>
              <Row gap={space.l} style={{ marginTop: space.m }}>
                <Row gap={6}>
                  <Icon name="checkmark-done" size={16} color={colors.cyan} flip={false} />
                  <Txt size="small">
                    {t('attendanceRate')} {st.attendance}%
                  </Txt>
                </Row>
                <Row gap={6}>
                  <Icon name="ribbon" size={16} color={colors.blue} flip={false} />
                  <Txt size="small">
                    {t('avgScore')} {st.avgScore}%
                  </Txt>
                </Row>
              </Row>
            </Card>
          );
        })}
      </Section>

      <Card tone="tint" style={{ marginTop: space.xl }} onPress={() => router.push(`/t/${me.handle}`)}>
        <Row gap={space.m}>
          <Icon name="globe-outline" size={22} color={colors.blue} flip={false} />
          <View style={{ flex: 1 }}>
            <Txt w="s">{t('shareMyPage')}</Txt>
            <Txt size="small" color={colors.inkSoft}>
              {t('myPageBody')}
            </Txt>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.blue} />
        </Row>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  clock: { width: 64, paddingVertical: space.s, borderRadius: 14, backgroundColor: colors.blueTint },
  alertIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
