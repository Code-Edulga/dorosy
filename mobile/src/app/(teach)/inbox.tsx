// Assistant inbox (PRD AI-11, AI-13): questions the assistant handed to the instructor,
// what it sent on their behalf today, and the alert rules it follows.

import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, font, radius, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { sentAlerts } from '../../data/mock';
import { fmtDayLabel, fmtTime } from '../../lib/dates';
import { AlignStart, Btn, Card, Divider, Empty, Icon, Row, Screen, Section, Tag, Toggle, Txt, type IconName } from '../../components/ui';

const ALERT_ICON: Record<string, IconName> = { reminder: 'alarm', absence: 'person-remove', payment: 'wallet', brief: 'document-text' };

export default function Inbox() {
  const { t, L, lang, rtl } = useT();
  const s = useStore();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(s.handoffs.find((h) => !h.reply)?.id ?? null);
  const pending = s.handoffs.filter((h) => !h.reply);
  const answered = s.handoffs.filter((h) => h.reply);
  const a = s.alertSettings;

  return (
    <Screen title={t('inboxTitle')} subtitle={t('inboxSub')}>
      <Section title={t('handoffs')} style={{ marginTop: 0 }}>
        {pending.length ? null : (
          <Card>
            <Empty text={t('noHandoffs')} />
          </Card>
        )}
        {[...pending, ...answered].map((h) => {
          const isOpen = openId === h.id && !h.reply;
          return (
            <Card key={h.id} style={h.reply ? { opacity: 0.7 } : undefined}>
              <Pressable disabled={!!h.reply} onPress={() => setOpenId(isOpen ? null : h.id)} accessibilityRole="button">
              <Row justify="space-between" align="flex-start" gap={space.s}>
                <View style={{ flex: 1 }}>
                  <Txt w="s" size="small">
                    {L(h.who)}
                  </Txt>
                  <Row gap={4}>
                    <Icon name={h.channel === 'whatsapp' ? 'logo-whatsapp' : 'chatbubble-ellipses'} size={12} color={h.channel === 'whatsapp' ? colors.good : colors.blue} flip={false} />
                    <Txt size="micro" color={colors.inkMute}>
                      {fmtDayLabel(h.at, lang)} {fmtTime(h.at, lang)}
                    </Txt>
                  </Row>
                </View>
                {h.reply ? <Tag label={t('replied')} tone="good" icon="checkmark" /> : null}
              </Row>
              <Txt style={{ marginTop: space.s }}>{L(h.question)}</Txt>
              </Pressable>
              {h.reply ? (
                <View style={[styles.reply, rtl ? { borderRightWidth: 3 } : { borderLeftWidth: 3 }]}>
                  <Txt size="small" color={colors.inkSoft}>
                    {h.reply}
                  </Txt>
                </View>
              ) : null}
              {isOpen ? (
                <View style={{ marginTop: space.m, gap: space.s }}>
                  <TextInput
                    value={drafts[h.id] ?? ''}
                    onChangeText={(v) => setDrafts((d) => ({ ...d, [h.id]: v }))}
                    placeholder={t('replyPlaceholder')}
                    placeholderTextColor={colors.inkMute}
                    multiline
                    style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
                  />
                  <AlignStart>
                    <Btn
                      small
                      label={t('sendReply')}
                      icon="send"
                      disabled={!(drafts[h.id] ?? '').trim()}
                      onPress={() => {
                        s.replyHandoff(h.id, (drafts[h.id] ?? '').trim());
                        setOpenId(s.handoffs.find((x) => !x.reply && x.id !== h.id)?.id ?? null);
                      }}
                    />
                  </AlignStart>
                </View>
              ) : null}
            </Card>
          );
        })}
      </Section>

      <Section title={t('sentToday')}>
        <Card style={{ paddingVertical: space.xs }}>
          {sentAlerts.map((al, i) => (
            <View key={al.id}>
              {i ? <Divider /> : null}
              <Row gap={space.m} style={{ paddingVertical: space.m }}>
                <View style={styles.alertIcon}>
                  <Icon name={ALERT_ICON[al.kind]} size={16} color={colors.blue} flip={false} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size="small" w="m">
                    {L(al.text)}
                  </Txt>
                  <Txt size="micro" color={colors.inkMute}>
                    {fmtTime(al.at, lang)}
                  </Txt>
                </View>
                <Txt w="s" color={colors.inkSoft}>
                  ×{al.count}
                </Txt>
              </Row>
            </View>
          ))}
        </Card>
      </Section>

      <Section title={t('alertSettings')}>
        <Card style={{ paddingVertical: space.xs }}>
          <Toggle label={t('setAbsence')} value={a.absence} onChange={(v) => s.setAlertSettings({ absence: v })} />
          <Divider />
          <Toggle label={t('setWeekly')} value={a.weekly} onChange={(v) => s.setAlertSettings({ weekly: v })} />
          <Divider />
          <Toggle label={t('setPayments')} value={a.payments} onChange={(v) => s.setAlertSettings({ payments: v })} />
          <Divider />
          <Toggle label={t('setLowScore', { n: a.lowScorePct })} value={a.lowScore} onChange={(v) => s.setAlertSettings({ lowScore: v })} />
          <Divider />
          <Toggle label={t('quietHours')} value={a.quietHours} onChange={(v) => s.setAlertSettings({ quietHours: v })} />
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 80,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    padding: space.m,
    fontFamily: font.r,
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  reply: { marginTop: space.s, paddingHorizontal: space.m, paddingVertical: space.s, borderColor: colors.cyan, backgroundColor: colors.cyanTint, borderRadius: 8 },
  alertIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' },
});
