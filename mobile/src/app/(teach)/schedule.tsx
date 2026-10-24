import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { assessments } from '../../data/mock';
import { courseById, groupById, groupRoster, myCourses, mySessions } from '../../data/selectors';
import { groupWhere } from '../../data/format';
import { fmtDayLabel, fmtTime, sameDay, startOfDay } from '../../lib/dates';
import { Empty, Screen, Section } from '../../components/ui';
import { WeekStrip } from '../../components/WeekStrip';
import { AgendaItem } from '../../components/Agenda';

export default function Schedule() {
  const { t, L, lang } = useT();
  const s = useStore();
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [week, setWeek] = useState(() => new Date());
  const sessions = mySessions();
  const mine = new Set(myCourses().map((c) => c.id));
  const work = assessments.filter((a) => mine.has(a.courseId));
  const now = new Date();

  const day = sessions.filter((x) => sameDay(x.start, selected));
  const dayWork = work.filter((a) => sameDay(a.due, selected));

  return (
    <Screen title={t('tabSchedule')}>
      <WeekStrip
        selected={selected}
        onSelect={setSelected}
        week={week}
        onWeek={setWeek}
        marks={(d) => ({ session: sessions.some((x) => sameDay(x.start, d)), due: work.some((a) => sameDay(a.due, d)) })}
      />
      <Section title={fmtDayLabel(selected, lang)}>
        {!day.length && !dayWork.length ? <Empty text={t('noSessionsDay')} /> : null}
        <View style={{ gap: space.s }}>
          {day.map((x) => {
            const g = groupById(x.groupId);
            const taken = !!s.attendance[x.id];
            const past = x.end < now;
            return (
              <AgendaItem
                key={x.id}
                time={fmtTime(x.start, lang)}
                until={fmtTime(x.end, lang)}
                title={L(courseById(x.courseId).title)}
                subtitle={`${L(x.topic)}\n${groupWhere(g, lang)} — ${groupRoster(s, g.id).length} ${t('students')}`}
                color={g.mode === 'online' ? colors.blue : colors.cyan}
                tag={taken ? { label: t('attendanceTaken'), tone: 'good' } : past ? { label: t('takeAttendance'), tone: 'warn' } : undefined}
                dim={past && taken}
                onPress={() => router.push(`/teach/attendance/${x.id}`)}
              />
            );
          })}
          {dayWork.map((a) => (
            <AgendaItem
              key={a.id}
              time={fmtTime(a.due, lang)}
              title={L(a.title)}
              subtitle={L(courseById(a.courseId).title)}
              color={colors.sun}
              tag={{ label: a.kind === 'exam' ? t('testLabel') : t('dueLabel'), tone: 'sun' }}
              onPress={() => router.push(`/teach/grade/${a.id}`)}
            />
          ))}
        </View>
      </Section>
    </Screen>
  );
}
