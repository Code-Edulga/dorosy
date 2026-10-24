import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { materials } from '../../data/mock';
import {
  childAttendance,
  childGroupIds,
  childSessions,
  courseById,
  groupById,
  instructorOfCourse,
  recordingsUnlocked,
} from '../../data/selectors';
import { groupLabel, groupWhere } from '../../data/format';
import { fmtDayLabel, fmtTime } from '../../lib/dates';
import { Btn, Card, Empty, Icon, ListRow, Notice, Row, Screen, Section, Tag, Txt } from '../../components/ui';
import { Segmented } from '../../components/Segmented';
import { AgendaItem } from '../../components/Agenda';
import { attendanceTag } from '../../components/attendance';

type Tab = 'sessions' | 'materials' | 'recordings';

export default function CourseView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, L, lang } = useT();
  const s = useStore();
  const [tab, setTab] = useState<Tab>('sessions');
  const c = courseById(id);
  const who = instructorOfCourse(id);
  const gid = childGroupIds(s, s.childId).find((g) => groupById(g).courseId === id)!;
  const g = groupById(gid);
  const now = new Date();
  const all = childSessions(s, s.childId).filter((x) => x.courseId === id);
  const upcoming = all.filter((x) => x.end >= now).slice(0, 6);
  const past = all.filter((x) => x.end < now).reverse();
  const unlocked = recordingsUnlocked(s, s.childId, id);

  return (
    <Screen back title={L(c.title)} subtitle={L(c.track)}>
      <Card>
        <ListRow
          leading={<View style={styles.mark}><Icon name="person" size={18} color={colors.blue} flip={false} /></View>}
          title={L(who.name)}
          subtitle={`${t('group')}: ${groupLabel(g, lang)}`}
          onPress={() => router.push(`/t/${who.handle}`)}
        />
        <Row gap={space.s} style={{ marginTop: space.xs }}>
          <Icon name={g.mode === 'online' ? 'videocam-outline' : 'location-outline'} size={16} color={colors.inkSoft} flip={false} />
          <Txt size="small" color={colors.inkSoft} style={{ flex: 1 }}>
            {groupWhere(g, lang)}
          </Txt>
        </Row>
      </Card>

      <View style={{ marginTop: space.l }}>
        <Segmented
          value={tab}
          onChange={setTab}
          items={[
            { value: 'sessions', label: t('courseSessions') },
            { value: 'materials', label: t('courseMaterials') },
            { value: 'recordings', label: t('courseRecordings') },
          ]}
        />
      </View>

      {tab === 'sessions' ? (
        <>
          <Section title={t('upcoming')}>
            <View style={{ gap: space.s }}>
              {upcoming.map((x) => (
                <AgendaItem key={x.id} time={fmtTime(x.start, lang)} until={fmtDayLabel(x.start, lang)} title={L(x.topic)} subtitle={groupWhere(g, lang)} />
              ))}
            </View>
          </Section>
          <Section title={t('past')}>
            <View style={{ gap: space.s }}>
              {past.map((x) => {
                const a = childAttendance(s.childId, x);
                return (
                  <AgendaItem
                    key={x.id}
                    time={fmtTime(x.start, lang)}
                    until={fmtDayLabel(x.start, lang)}
                    title={L(x.topic)}
                    color={colors.line}
                    tag={a ? attendanceTag(a, t) : undefined}
                  />
                );
              })}
            </View>
          </Section>
        </>
      ) : null}

      {tab === 'materials' ? (
        <Card style={{ marginTop: space.l, paddingVertical: space.xs }}>
          {materials
            .filter((m) => m.courseId === id)
            .map((m, i) => (
              <View key={m.id} style={i ? styles.sep : undefined}>
                <ListRow
                  leading={<View style={[styles.mark, { backgroundColor: colors.badTint }]}><Icon name="document" size={18} color={colors.bad} flip={false} /></View>}
                  title={L(m.title)}
                  subtitle={`PDF, ${t('pagesCount', { n: m.pages })}`}
                  trailing={<Icon name="download-outline" size={20} color={colors.blue} flip={false} />}
                  chevron={false}
                  onPress={() => {}}
                />
              </View>
            ))}
        </Card>
      ) : null}

      {tab === 'recordings' ? (
        <View style={{ marginTop: space.l, gap: space.s }}>
          {!g.recordings ? <Empty text={t('noRecordings')} /> : null}
          {g.recordings && !unlocked ? <Notice text={t('lockedUnpaid')} tone="warn" icon="lock-closed" /> : null}
          {g.recordings && !unlocked && s.role === 'parent' ? (
            <Btn label={t('payNow')} icon="wallet" onPress={() => router.push('/billing')} full />
          ) : null}
          {g.recordings
            ? past.slice(0, 6).map((x) => (
                <Card key={x.id} style={{ padding: space.m }}>
                  <Row gap={space.m}>
                    <View style={[styles.thumb, !unlocked && { opacity: 0.5 }]}>
                      <Icon name={unlocked ? 'play' : 'lock-closed'} size={20} color="#fff" flip={false} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt w="s" numberOfLines={1}>
                        {L(x.topic)}
                      </Txt>
                      <Txt size="small" color={colors.inkSoft}>
                        {fmtDayLabel(x.start, lang)}
                      </Txt>
                    </View>
                    {unlocked ? <Tag label={t('watch')} tone="info" icon="play" /> : null}
                  </Row>
                </Card>
              ))
            : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mark: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  thumb: { width: 64, height: 44, borderRadius: 10, backgroundColor: colors.blueDeep, alignItems: 'center', justifyContent: 'center' },
});
