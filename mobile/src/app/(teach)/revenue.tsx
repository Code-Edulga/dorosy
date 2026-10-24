import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { revenueHistory } from '../../data/mock';
import { courseById, groupById, revenue } from '../../data/selectors';
import { groupDays } from '../../data/format';
import { fmtMoney, monthName } from '../../lib/dates';
import { Avatar, Btn, Card, Divider, Notice, Row, Screen, Section, Sheet, Txt } from '../../components/ui';
import type { RosterStudent } from '../../data/types';

export default function Revenue() {
  const { t, L, lang } = useT();
  const s = useStore();
  const r = revenue(s);
  const [confirm, setConfirm] = useState<RosterStudent | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const now = new Date();
  const series = [...revenueHistory, r.collected];
  const max = Math.max(...series, r.collected + r.outstanding);
  const labels = series.map((_, i) => monthName((now.getMonth() - (series.length - 1 - i) + 12) % 12, lang));

  return (
    <Screen title={t('revenueTitle')}>
      <Card>
        <Row gap={space.l} align="flex-start">
          <View style={{ flex: 1 }}>
            <Txt size="small" color={colors.inkSoft}>
              {t('collectedThisMonth')}
            </Txt>
            <Txt w="b" size="display" color={colors.ink}>
              {fmtMoney(r.collected)}
            </Txt>
            <Txt size="micro" color={colors.inkMute}>
              {t('egp')}
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt size="small" color={colors.inkSoft}>
              {t('outstandingThisMonth')}
            </Txt>
            <Txt w="b" size="display" color={colors.warn}>
              {fmtMoney(r.outstanding)}
            </Txt>
            <Txt size="micro" color={colors.inkMute}>
              {r.unpaid.length} {t('students')}
            </Txt>
          </View>
        </Row>
      </Card>

      <Section title={t('lastSixMonths')}>
        <Card>
          <Row align="flex-end" gap={space.s} style={{ height: 150 }}>
            {series.map((v, i) => {
              const last = i === series.length - 1;
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 }}>
                  <Txt size="micro" w={last ? 'b' : 'r'} color={last ? colors.blue : colors.inkSoft} center>
                    {(v / 1000).toFixed(1)}k
                  </Txt>
                  <View style={{ width: '100%', maxWidth: 32 }}>
                    {last ? <View style={{ height: (100 * r.outstanding) / max, backgroundColor: colors.sunTint, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: 1, borderColor: colors.sun, borderStyle: 'dashed', borderBottomWidth: 0 }} /> : null}
                    <View style={{ height: (100 * v) / max, backgroundColor: last ? colors.blue : '#BFD0F7', borderRadius: last ? 0 : 8, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderTopLeftRadius: last && r.outstanding ? 0 : 8, borderTopRightRadius: last && r.outstanding ? 0 : 8 }} />
                  </View>
                </View>
              );
            })}
          </Row>
          <Row gap={space.s} style={{ marginTop: 6 }}>
            {labels.map((l, i) => (
              <Txt key={i} size="micro" color={colors.inkMute} center style={{ flex: 1 }} numberOfLines={1}>
                {lang === 'ar' ? l : l.slice(0, 3)}
              </Txt>
            ))}
          </Row>
          <Row gap={space.l} style={{ marginTop: space.m }}>
            <Row gap={6}>
              <View style={[styles.key, { backgroundColor: colors.blue }]} />
              <Txt size="micro" color={colors.inkSoft}>
                {t('collected')}
              </Txt>
            </Row>
            <Row gap={6}>
              <View style={[styles.key, { backgroundColor: colors.sunTint, borderWidth: 1, borderColor: colors.sun }]} />
              <Txt size="micro" color={colors.inkSoft}>
                {t('pending')}
              </Txt>
            </Row>
          </Row>
        </Card>
      </Section>

      <Section title={t('byGroup')}>
        <Card>
          {r.byGroup.map((b, i) => {
            const total = b.collected + b.outstanding || 1;
            const g = b.group;
            return (
              <View key={g.id}>
                {i ? <Divider style={{ marginVertical: space.m }} /> : null}
                <Row justify="space-between">
                  <View style={{ flex: 1 }}>
                    <Txt w="s" size="small">
                      {groupDays(g, lang)}
                      {g.mode === 'online' ? ` (${t('online')})` : ''}
                    </Txt>
                    <Txt size="micro" color={colors.inkMute}>
                      {L(courseById(g.courseId).title)}
                    </Txt>
                  </View>
                  <Txt w="s" size="small">
                    {fmtMoney(b.collected)} / {fmtMoney(b.collected + b.outstanding)}
                  </Txt>
                </Row>
                <Row gap={0} align="stretch" style={{ marginTop: 6, height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#E6ECF5' }}>
                  <View style={{ flex: b.collected / total, backgroundColor: colors.blue }} />
                  <View style={{ flex: b.outstanding / total, backgroundColor: colors.sun }} />
                </Row>
              </View>
            );
          })}
        </Card>
      </Section>

      {done ? (
        <View style={{ marginTop: space.l }}>
          <Notice text={done} />
        </View>
      ) : null}

      <Section title={t('unpaidList')}>
        <Card style={{ paddingVertical: space.xs }}>
          {r.unpaid.map((st, i) => {
            const g = groupById(st.groupId);
            return (
              <Row key={st.id} gap={space.m} style={[{ paddingVertical: space.m }, i ? styles.sep : null]}>
                <Avatar name={L(st.name)} size={36} color={colors.warn} />
                <View style={{ flex: 1 }}>
                  <Txt w="m" numberOfLines={1} >
                    {L(st.name)}
                  </Txt>
                  <Txt size="micro" color={colors.inkSoft}>
                    {fmtMoney(courseById(g.courseId).price)} {t('egp')} — {groupDays(g, lang)}
                  </Txt>
                </View>
                <Btn small label={t('recordCash')} icon="cash" variant="outline" onPress={() => { setDone(null); setConfirm(st); }} />
              </Row>
            );
          })}
          {!r.unpaid.length ? (
            <Txt color={colors.good} w="m" center style={{ paddingVertical: space.l }}>
              {t('billingClear')}
            </Txt>
          ) : null}
        </Card>
      </Section>

      <Sheet visible={!!confirm} onClose={() => setConfirm(null)} title={confirm ? t('recordCashFor', { name: L(confirm.name) }) : ''}>
        {confirm ? (
          <View style={{ gap: space.l }}>
            <Row gap={6} align="flex-end">
              <Txt w="b" size="display">
                {fmtMoney(courseById(groupById(confirm.groupId).courseId).price)}
              </Txt>
              <Txt w="m" color={colors.inkSoft} style={{ marginBottom: 6 }}>
                {t('egp')}
              </Txt>
            </Row>
            <Row gap={space.s}>
              <View style={{ flex: 1 }}>
                <Btn label={t('cancel')} variant="outline" full onPress={() => setConfirm(null)} />
              </View>
              <View style={{ flex: 1 }}>
                <Btn
                  label={t('recordCash')}
                  full
                  onPress={() => {
                    s.recordCash(confirm.id);
                    setDone(`${t('cashRecorded')}`);
                    setConfirm(null);
                  }}
                />
              </View>
            </Row>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  key: { width: 12, height: 12, borderRadius: 3 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
