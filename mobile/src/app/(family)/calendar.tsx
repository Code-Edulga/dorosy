import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { childAttendance, childSessions, childWork, courseById, groupById } from '../../data/selectors';
import { groupWhere } from '../../data/format';
import { fmtDayLabel, fmtTime, sameDay, startOfDay } from '../../lib/dates';
import { Empty, Screen, Section } from '../../components/ui';
import { WeekStrip } from '../../components/WeekStrip';
import { AgendaItem } from '../../components/Agenda';
import { attendanceTag } from '../../components/attendance';

export default function FamilyCalendar() {
  const { t, L, lang } = useT();
  const s = useStore();
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [week, setWeek] = useState(() => new Date());

  const sessions = childSessions(s, s.childId);
  const work = childWork(s, s.childId);

  const daySessions = sessions.filter((x) => sameDay(x.start, selected));
  const dayWork = work.filter((w) => sameDay(w.a.due, selected));

  return (
    <Screen title={t('calendarTitle')}>
      <WeekStrip
        selected={selected}
        onSelect={setSelected}
        week={week}
        onWeek={setWeek}
        marks={(d) => ({ session: sessions.some((x) => sameDay(x.start, d)), due: work.some((w) => sameDay(w.a.due, d)) })}
      />

      <Section title={fmtDayLabel(selected, lang)}>
        {!daySessions.length && !dayWork.length ? <Empty text={t('noSessionsDay')} /> : null}
        <View style={{ gap: space.s }}>
          {daySessions.map((x) => {
            const g = groupById(x.groupId);
            const att = childAttendance(s.childId, x);
            return (
              <AgendaItem
                key={x.id}
                time={fmtTime(x.start, lang)}
                until={fmtTime(x.end, lang)}
                title={L(courseById(x.courseId).title)}
                subtitle={`${L(x.topic)}\n${groupWhere(g, lang)}`}
                color={g.mode === 'online' ? colors.blue : colors.cyan}
                tag={att ? attendanceTag(att, t) : undefined}
                dim={!!att}
                onPress={() => router.push(`/course/${x.courseId}`)}
              />
            );
          })}
          {dayWork.map((w) => (
            <AgendaItem
              key={w.a.id}
              time={fmtTime(w.a.due, lang)}
              title={L(w.a.title)}
              subtitle={L(courseById(w.a.courseId).title)}
              color={colors.sun}
              tag={{ label: w.a.kind === 'exam' ? t('testLabel') : t('dueLabel'), tone: 'sun' }}
              onPress={() => router.push(`/assignment/${w.a.id}`)}
            />
          ))}
        </View>
      </Section>
    </Screen>
  );
}
