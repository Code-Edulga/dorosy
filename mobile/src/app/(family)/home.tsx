import React from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import {
  childAttendanceRate,
  childAverage,
  childById,
  childCourseIds,
  childGroupIds,
  childWork,
  courseById,
  groupById,
  instructorOfCourse,
  nextSession,
  outstandingFor,
} from '../../data/selectors';
import { groupLabel } from '../../data/format';
import { fmtMoney, fmtRelDay } from '../../lib/dates';
import { Bar, Btn, Card, Empty, Icon, ListRow, Row, Screen, Section, Tag, Txt } from '../../components/ui';
import { Ticket } from '../../components/Ticket';
import { FamilyTop } from '../../components/FamilyTop';
import { WorkIcon } from '../../components/WorkIcon';

export default function FamilyHome() {
  const { t, L, lang } = useT();
  const s = useStore();
  const child = childById(s.childId);
  const next = nextSession(s, s.childId);
  const money = outstandingFor(s, s.childId);
  const due = childWork(s, s.childId)
    .filter((w) => w.sub.status === 'pending')
    .slice(0, 3);
  const groupIds = childGroupIds(s, s.childId);

  const overdueAmount = money.overdue.reduce((a, i) => a + i.amount, 0);

  return (
    <Screen>
      <FamilyTop />

      {next ? <Ticket session={next} /> : <Empty text={t('noSessionsDay')} />}

      {/* Billing: only shown when something is owed. Overdue reads as an alert; upcoming as a quiet reminder. */}
      {money.total > 0 ? (
        <Card style={{ marginTop: space.l, borderColor: overdueAmount ? colors.badTint : colors.line, backgroundColor: overdueAmount ? '#FFF8F8' : colors.card }}>
          <Row gap={space.m}>
            <View style={[styles.billIcon, { backgroundColor: overdueAmount ? colors.badTint : colors.sunTint }]}>
              <Icon name="wallet" size={20} color={overdueAmount ? colors.bad : '#8A6200'} flip={false} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt w="s">
                {overdueAmount
                  ? t('billingOverdue', { amount: fmtMoney(overdueAmount) })
                  : t('billingDue', { amount: fmtMoney(money.total), when: fmtRelDay(money.next!.dueDate, lang) })}
              </Txt>
              {overdueAmount && money.total > overdueAmount ? (
                <Txt size="small" color={colors.inkSoft}>
                  {t('outstanding')}: {fmtMoney(money.total)} {t('egp')}
                </Txt>
              ) : null}
            </View>
            <Btn small label={s.role === 'parent' ? t('payNow') : t('viewBilling')} variant={overdueAmount ? 'primary' : 'outline'} onPress={() => router.push('/billing')} />
          </Row>
        </Card>
      ) : null}

      <Section title={t('dueSoon')} action={t('seeAll')} onAction={() => router.push('/assignments')}>
        <Card style={{ paddingVertical: space.xs }}>
          {due.length ? (
            due.map((w, i) => {
              const late = w.a.due < new Date();
              return (
                <View key={w.a.id} style={i > 0 ? styles.sep : undefined}>
                  <ListRow
                    leading={<WorkIcon kind={w.a.kind} />}
                    title={L(w.a.title)}
                    subtitle={L(courseById(w.a.courseId).title)}
                    trailing={<Tag label={late ? t('dueOverdue') : fmtRelDay(w.a.due, lang)} tone={late ? 'bad' : w.a.kind === 'exam' ? 'sun' : 'neutral'} />}
                    onPress={() => router.push(`/assignment/${w.a.id}`)}
                  />
                </View>
              );
            })
          ) : (
            <Empty text={t('nothingDue')} />
          )}
        </Card>
      </Section>

      <Section title={t('myCourses')}>
        {childCourseIds(s, s.childId).map((cid) => {
          const c = courseById(cid);
          const g = groupById(groupIds.find((gid) => groupById(gid).courseId === cid)!);
          const att = childAttendanceRate(s, s.childId, cid);
          const avg = childAverage(child, cid);
          return (
            <Card key={cid} onPress={() => router.push(`/course/${cid}`)}>
              <Row justify="space-between" align="flex-start">
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt w="b">{L(c.title)}</Txt>
                  <Txt size="small" color={colors.inkSoft}>
                    {L(instructorOfCourse(cid).name)} — {groupLabel(g, lang)}
                  </Txt>
                </View>
                <Icon name="chevron-forward" size={18} color={colors.inkMute} />
              </Row>
              <Row gap={space.l} style={{ marginTop: space.m }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Row justify="space-between">
                    <Txt size="micro" color={colors.inkSoft}>
                      {t('attendanceRate')}
                    </Txt>
                    <Txt size="micro" w="s">
                      {Math.round(att * 100)}%
                    </Txt>
                  </Row>
                  <Bar value={att} color={colors.cyan} />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Row justify="space-between">
                    <Txt size="micro" color={colors.inkSoft}>
                      {t('avgScore')}
                    </Txt>
                    <Txt size="micro" w="s">
                      {avg ? `${avg}%` : '—'}
                    </Txt>
                  </Row>
                  <Bar value={avg / 100} color={colors.blue} />
                </View>
              </Row>
            </Card>
          );
        })}
      </Section>

    </Screen>
  );
}

const styles = StyleSheet.create({
  billIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
