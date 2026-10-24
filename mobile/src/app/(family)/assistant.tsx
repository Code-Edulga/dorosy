import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { answer } from '../../data/assistant';
import { fmtTime } from '../../lib/dates';
import { Icon, Row, Txt } from '../../components/ui';
import { LangToggle } from '../../components/LangToggle';

export default function Assistant() {
  const { t, L, lang, rtl } = useT();
  const s = useStore();
  const [text, setText] = useState('');
  const scroll = useRef<ScrollViewInstance>(null);
  const messages = s.chats[s.childId] ?? [];

  useEffect(() => {
    const id = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(id);
  }, [messages.length]);

  const send = (q: string) => {
    const v = q.trim();
    if (!v) return;
    s.sendChat(s.childId, v, answer(s, s.childId, v, lang));
    setText('');
  };

  const quick = [t('quickNext'), t('quickDue'), t('quickGrades'), t('quickPay')];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.head}>
          <Row justify="space-between">
            <Row gap={space.m} style={{ flex: 1 }}>
              <View style={styles.botMark}>
                <Icon name="sparkles" size={20} color={colors.blue} flip={false} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt w="b" size="heading">
                  {t('assistantTitle')}
                </Txt>
                <Txt size="micro" color={colors.inkSoft}>
                  {t('assistantSub')}
                </Txt>
              </View>
            </Row>
            <LangToggle />
          </Row>
          <Row gap={6} style={{ marginTop: space.s }}>
            <Icon name="logo-whatsapp" size={14} color={colors.good} flip={false} />
            <Txt size="micro" color={colors.good}>
              {t('viaWhatsApp')}
            </Txt>
          </Row>
        </View>

        <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: space.l, gap: space.s }}>
          {messages.map((m) => {
            const mine = m.from === 'me';
            const body = typeof m.text === 'string' ? m.text : L(m.text);
            return (
              <View key={m.id} style={{ alignItems: mine !== rtl ? 'flex-end' : 'flex-start' }}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs, mine ? (rtl ? styles.tailStart : styles.tailEnd) : rtl ? styles.tailEnd : styles.tailStart]}>
                  <Txt size="small" color={mine ? '#fff' : colors.ink} selectable>
                    {body}
                  </Txt>
                  <Txt size="micro" color={mine ? '#C9D5FA' : colors.inkMute} style={{ marginTop: 2 }}>
                    {fmtTime(m.at, lang)}
                  </Txt>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.quick, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
          {quick.map((q) => (
            <Pressable key={q} onPress={() => send(q)} style={styles.quickChip} accessibilityRole="button">
              <Txt size="small" w="m" color={colors.blue}>
                {q}
              </Txt>
            </Pressable>
          ))}
        </View>

        <Row gap={space.s} style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('assistantPlaceholder')}
            placeholderTextColor={colors.inkMute}
            onSubmitEditing={() => send(text)}
            returnKeyType="send"
            style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
            accessibilityLabel={t('assistantPlaceholder')}
          />
          <Pressable onPress={() => send(text)} style={[styles.send, !text.trim() && { opacity: 0.4 }]} disabled={!text.trim()} accessibilityRole="button" accessibilityLabel="send">
            <Icon name="send" size={18} color="#fff" />
          </Pressable>
        </Row>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: {
    paddingHorizontal: space.l,
    paddingTop: space.m,
    paddingBottom: space.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    backgroundColor: colors.card,
  },
  botMark: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '84%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  mine: { backgroundColor: colors.blue },
  theirs: { backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  tailStart: { borderTopLeftRadius: 6 },
  tailEnd: { borderTopRightRadius: 6 },
  quick: { paddingHorizontal: space.l, gap: space.s, paddingBottom: space.s, flexWrap: 'wrap' },
  quickChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.chip, backgroundColor: colors.blueTint },
  inputBar: {
    paddingHorizontal: space.l,
    paddingVertical: space.s,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: colors.paper,
    paddingHorizontal: space.l,
    fontFamily: font.r,
    fontSize: 15,
    color: colors.ink,
  },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
});
