// Instructor course view (PRD LMS-01..09): groups, upcoming sessions, assessments to grade.

import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, space } from '../../../theme/tokens';
import { useT } from '../../../i18n';
import { useStore } from '../../../data/store';
import { assessments } from '../../../data/mock';
import { courseById, courseGroups, courseRoster, groupById, groupRoster, mySessions } from '../../../data/selectors';
import { groupLabel, groupWhere, gradeLabel } from '../../../data/format';
import { fmtDayLabel, fmtRelDay, fmtTime } from '../../../lib/dates';
import { AlignStart, Bar, Btn, Card, Icon, Row, Screen, Section, Tag, Txt } from '../../../components/ui';
import { Segmented } from '../../../components/Segmented';
import { AgendaItem } from '../../../components/Agenda';
import { WorkIcon } from '../../../components/WorkIcon';

type Tab = 'groups' | 'sessions' | 'assessments';

export default function TeachCourse() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, L, lang } = useT();
  const s = useStore();
  const c = courseById(id);
  const [tab, setTab] = useState<Tab>('groups');
  const now = new Date();
  const upcoming = mySessions()
    .filter((x) => x.courseId === id && x.end >= now)
    .slice(0, 8);
  const work = assessments.filter((a) => a.courseId === id).sort((a, b) => b.due.getTime() - a.due.getTime());
  const rosterSize = courseRoster(s, id).length;

  return (
    <Screen back title={L(c.title)} subtitle={`${L(c.track)} — ${gradeLabel(c.grade, lang)}`}>
      <Segmented
        value={tab}
        onChange={setTab}
        items={[
          { value: 'groups', label: t('groups') },
          { value: 'sessions', label: t('upcomingSessions') },
          { value: 'assessments', label: t('assessments') },
        ]}
      />

      {tab === 'groups' ? (
        <View style={{ marginTop: space.l, gap: space.m }}>
          {courseGroups(id).map((g) => {
            const n = groupRoster(s, g.id).length;
            return (
              <Card key={g.id} onPress={() => router.push({ pathname: '/students', params: { group: g.id } })}>
                <Row justify="space-between" align="flex-start">
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt w="b">{groupLabel(g, lang)}</Txt>
                    <Row gap={6}>
                      <Icon name={g.mode === 'online' ? 'videocam-outline' : 'location-outline'} size={14} color={colors.inkSoft} flip={false} />
                      <Txt size="small" color={colors.inkSoft}>
                        {groupWhere(g, lang)}
                      </Txt>
                    </Row>
                  </View>
                  {g.recordings ? <Tag label={t('recorded')} tone="info" icon="videocam" /> : null}
                </Row>
                <View style={{ marginTop: space.m, gap: 6 }}>
                  <Row justify="space-between">
                    <Txt size="micro" color={colors.inkSoft}>
                      {t('studentsTitle')}
                    </Txt>
                    <Txt size="micro" w="s">
                      {t('capacity', { a: n, b: g.capacity })}
                    </Txt>
                  </Row>
                  <Bar value={n / g.capacity} color={n >= g.capacity ? colors.warn : colors.cyan} />
                </View>
              </Card>
            );
          })}
        </View>
      ) : null}

      {tab === 'sessions' ? (
        <View style={{ marginTop: space.l, gap: space.s }}>
          {upcoming.map((x) => {
            const g = groupById(x.groupId);
            const live = now >= x.start;
            return (
              <AgendaItem
                key={x.id}
                time={fmtTime(x.start, lang)}
                until={fmtDayLabel(x.start, lang)}
                title={L(x.topic)}
                subtitle={groupWhere(g, lang)}
                color={g.mode === 'online' ? colors.blue : colors.cyan}
                tag={s.attendance[x.id] ? { label: t('attendanceTaken'), tone: 'good' } : live ? { label: t('startsNow'), tone: 'sun' } : undefined}
                onPress={() => router.push(`/teach/attendance/${x.id}`)}
              />
            );
          })}
        </View>
      ) : null}

      {tab === 'assessments' ? (
        <Section title={t('assessments')} style={{ marginTop: space.l }}>
          {work.map((a) => {
            const published = s.publishedGrades.includes(a.id);
            const past = a.due < now;
            const graded = published || a.kind === 'quiz';
            const submitted = past ? Math.ceil(rosterSize * 0.85) : Math.floor(rosterSize * 0.3);
            return (
              <Card key={a.id}>
                <Row gap={space.m} align="flex-start">
                  <WorkIcon kind={a.kind} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt w="s">{L(a.title)}</Txt>
                    <Txt size="small" color={colors.inkSoft}>
                      {t('dueIn', { when: fmtRelDay(a.due, lang) })} — {t('outOf', { n: a.max })}
                    </Txt>
                    <AlignStart>
                      {graded ? (
                        <Tag label={t('graded')} tone="good" icon="checkmark" />
                      ) : a.kind === 'exam' && !past ? (
                        <Tag label={t('kindExam')} tone="sun" />
                      ) : (
                        <Tag label={t('submissions', { a: submitted, b: rosterSize })} tone="info" />
                      )}
                    </AlignStart>
                  </View>
                  {!graded && (past || a.kind === 'homework') ? (
                    <Btn small label={t('gradeNow')} icon="create" onPress={() => router.push(`/teach/grade/${a.id}`)} />
                  ) : null}
                </Row>
              </Card>
            );
          })}
        </Section>
      ) : null}
    </Screen>
  );
}

