import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { childWork, courseById } from '../../data/selectors';
import { fmtRelDay } from '../../lib/dates';
import { Card, Chip, Empty, ListRow, Row, Screen, Tag, Txt } from '../../components/ui';
import { WorkIcon } from '../../components/WorkIcon';

type Filter = 'pending' | 'submitted' | 'graded';

export default function Assignments() {
  const { t, L, lang } = useT();
  const s = useStore();
  const [filter, setFilter] = useState<Filter>('pending');
  const all = childWork(s, s.childId);
  const items = all.filter((w) => w.sub.status === filter);
  if (filter !== 'pending') items.reverse(); // newest first for finished work

  const count = (f: Filter) => all.filter((w) => w.sub.status === f).length;

  return (
    <Screen title={t('assignmentsTitle')}>
      <Row gap={space.s} wrap>
        <Chip label={`${t('filterPending')} ${count('pending')}`} selected={filter === 'pending'} onPress={() => setFilter('pending')} />
        <Chip label={`${t('filterSubmitted')} ${count('submitted')}`} selected={filter === 'submitted'} onPress={() => setFilter('submitted')} />
        <Chip label={`${t('filterGraded')} ${count('graded')}`} selected={filter === 'graded'} onPress={() => setFilter('graded')} />
      </Row>

      <Card style={{ marginTop: space.l, paddingVertical: space.xs }}>
        {items.length ? (
          items.map((w, i) => {
            const late = w.a.due < new Date();
            let trailing: React.ReactNode;
            if (w.sub.status === 'graded') {
              const pct = (w.sub.score ?? 0) / w.a.max;
              trailing = (
                <Txt w="b" color={pct >= 0.75 ? colors.good : pct >= 0.5 ? colors.warn : colors.bad}>
                  {w.sub.score}/{w.a.max}
                </Txt>
              );
            } else if (w.sub.status === 'submitted') {
              trailing = <Tag label={t('awaitingGrade')} tone="info" />;
            } else {
              trailing = <Tag label={late ? t('dueOverdue') : fmtRelDay(w.a.due, lang)} tone={late ? 'bad' : w.a.kind === 'exam' ? 'sun' : 'neutral'} />;
            }
            return (
              <View key={w.a.id} style={i > 0 ? styles.sep : undefined}>
                <ListRow
                  leading={<WorkIcon kind={w.a.kind} />}
                  title={L(w.a.title)}
                  subtitle={L(courseById(w.a.courseId).title)}
                  trailing={trailing}
                  onPress={() => router.push(`/assignment/${w.a.id}`)}
                />
              </View>
            );
          })
        ) : (
          <Empty text={t('nothingDue')} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
