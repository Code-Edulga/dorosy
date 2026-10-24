import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, font, radius, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { groupById, myGroups } from '../../data/selectors';
import { groupDays } from '../../data/format';
import { Avatar, Card, Chip, Empty, Icon, Row, Screen, Tag, Txt } from '../../components/ui';

type Filter = 'all' | 'lowAttendance' | 'unpaid' | 'lowScore';

export default function Students() {
  const params = useLocalSearchParams<{ filter?: Filter; group?: string }>();
  const { t, L, lang, rtl } = useT();
  const s = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>(params.filter ?? 'all');
  const [group, setGroup] = useState<string>(params.group ?? 'all');

  useEffect(() => {
    if (params.filter) setFilter(params.filter);
    if (params.group) setGroup(params.group);
  }, [params.filter, params.group]);

  const groups = myGroups();
  const mine = new Set(groups.map((g) => g.id));
  const list = s.roster
    .filter((r) => mine.has(r.groupId))
    .filter((r) => group === 'all' || r.groupId === group)
    .filter((r) => {
      const last = r.scores[r.scores.length - 1];
      if (filter === 'lowAttendance') return r.attendance < 0.75 || r.absentStreak >= 2;
      if (filter === 'unpaid') return !r.paidThisMonth;
      if (filter === 'lowScore') return last < s.alertSettings.lowScorePct;
      return true;
    })
    .filter((r) => !q.trim() || r.name.ar.includes(q.trim()) || r.name.en.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Screen title={t('studentsTitle')} subtitle={`${list.length} ${t('students')}`}>
      <View style={[styles.search, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <Icon name="search" size={18} color={colors.inkMute} flip={false} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('searchStudents')}
          placeholderTextColor={colors.inkMute}
          style={[styles.searchInput, { textAlign: rtl ? 'right' : 'left' }]}
          accessibilityLabel={t('searchStudents')}
        />
      </View>

      <Row gap={space.s} wrap style={{ marginTop: space.m }}>
        <Chip label={t('allGroups')} selected={group === 'all'} onPress={() => setGroup('all')} />
        {groups.map((g) => (
          <Chip key={g.id} label={`${groupDays(g, lang)}${g.mode === 'online' ? ` (${t('online')})` : ''}`} selected={group === g.id} onPress={() => setGroup(g.id)} />
        ))}
      </Row>

      <Row gap={space.s} wrap style={{ marginTop: space.s }}>
        <Chip label={t('filterAll')} selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label={t('filterLowAttendance')} icon="person-remove-outline" selected={filter === 'lowAttendance'} onPress={() => setFilter('lowAttendance')} />
        <Chip label={t('filterUnpaid')} icon="wallet-outline" selected={filter === 'unpaid'} onPress={() => setFilter('unpaid')} />
        <Chip label={t('filterLowScore')} icon="trending-down" selected={filter === 'lowScore'} onPress={() => setFilter('lowScore')} />
      </Row>

      <Card style={{ marginTop: space.l, paddingVertical: space.xs }}>
        {list.length ? (
          list.map((r, i) => {
            const last = r.scores[r.scores.length - 1];
            const g = groupById(r.groupId);
            return (
              <Pressable key={r.id} onPress={() => router.push(`/teach/student/${r.id}`)} accessibilityRole="button" style={({ pressed }) => [i ? styles.sep : null, pressed && { opacity: 0.7 }]}>
                <Row gap={space.m} style={{ paddingVertical: space.m }}>
                  <Avatar name={L(r.name)} size={40} color={r.absentStreak >= 2 ? colors.bad : colors.blue} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt w="s" numberOfLines={1}>
                      {L(r.name)}
                    </Txt>
                    <Row gap={space.s} wrap>
                      <Txt size="micro" color={colors.inkSoft}>
                        {groupDays(g, lang)}
                      </Txt>
                      {!r.paidThisMonth ? <Tag label={t('unpaidStatus')} tone="warn" /> : null}
                      {r.absentStreak >= 2 ? <Tag label={t('absent') + ' ×2'} tone="bad" /> : null}
                    </Row>
                  </View>
                  <View style={{ alignItems: 'center', minWidth: 44 }}>
                    <Txt w="b" color={last >= 75 ? colors.good : last >= s.alertSettings.lowScorePct ? colors.ink : colors.bad}>
                      {last}%
                    </Txt>
                    <Txt size="micro" color={colors.inkMute}>
                      {t('attShort', { n: Math.round(r.attendance * 100) })}
                    </Txt>
                  </View>
                  <Icon name="chevron-forward" size={18} color={colors.inkMute} />
                </Row>
              </Pressable>
            );
          })
        ) : (
          <Empty text={t('noResults')} action={t('filterAll')} onAction={() => { setFilter('all'); setGroup('all'); setQ(''); }} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    alignItems: 'center',
    gap: space.s,
    height: 48,
    paddingHorizontal: space.m,
    borderRadius: radius.control,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, minWidth: 0, height: 46, fontFamily: font.r, fontSize: 15, color: colors.ink },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
