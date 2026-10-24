// Registration (PRD MKT-03..05): pick a group, name, parent's phone, guardian consent, payment timing.

import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, font, radius, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { useStore } from '../../data/store';
import { courseById, courseGroups, groupById, instructorOfCourse, seatsLeft } from '../../data/selectors';
import { groupLabel, groupWhere } from '../../data/format';
import { fmtMoney } from '../../lib/dates';
import { Btn, Card, Checkbox, Icon, Row, Screen, Section, Tag, Txt } from '../../components/ui';
import { goHome } from '../../components/LangToggle';

export default function Register() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { t, L, lang, rtl } = useT();
  const s = useStore();
  const c = courseById(courseId);
  const who = instructorOfCourse(courseId);
  const groups = courseGroups(courseId);
  const firstOpen = groups.find((g) => seatsLeft(s, g.id) > 0)?.id ?? '';

  const [groupId, setGroupId] = useState(firstOpen);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [payNow, setPayNow] = useState(true);
  const [consent, setConsent] = useState(false);
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);

  const phoneOk = /^01[0125]\d{8}$/.test(phone.replace(/\D/g, ''));
  const valid = !!groupId && name.trim().length > 1 && phoneOk && consent;

  const confirm = () => {
    setTried(true);
    if (!valid) return;
    s.register(c.grade === 11 ? 'k2' : 'k1', groupId);
    setDone(true);
  };

  if (done) {
    const g = groupById(groupId);
    return (
      <Screen footer={<Btn label={t('openApp')} full onPress={() => { if (!s.role) s.setRole('parent'); goHome(s.role ?? 'parent'); }} />}>
        <View style={{ alignItems: 'center', marginTop: 80, gap: space.l }}>
          <View style={styles.doneMark}>
            <Icon name="checkmark" size={44} color={colors.ink} flip={false} />
          </View>
          <Txt w="b" size="title" center>
            {t('registeredTitle')}
          </Txt>
          <Txt color={colors.inkSoft} center>
            {t('registeredBody', { group: `${L(c.title)}${lang === 'ar' ? '، ' : ', '}${groupLabel(g, lang)}` })}
          </Txt>
        </View>
      </Screen>
    );
  }

  const input = [styles.input, { textAlign: rtl ? 'right' : 'left' } as const];

  return (
    <Screen
      back
      title={t('registerTitle')}
      subtitle={`${L(c.title)} — ${L(who.name)}`}
      footer={
        <View style={{ gap: space.s }}>
          {tried && !consent ? (
            <Txt size="small" color={colors.bad} center>
              {t('consentRequired')}
            </Txt>
          ) : null}
          <Btn label={payNow ? `${t('confirmRegistration')} — ${fmtMoney(c.price)} ${t('egp')}` : t('confirmRegistration')} variant="sun" full onPress={confirm} />
        </View>
      }
    >
      <Section title={t('chooseGroup')} style={{ marginTop: 0 }}>
        <View style={{ gap: space.s }}>
          {groups.map((g) => {
            const left = seatsLeft(s, g.id);
            const on = g.id === groupId;
            return (
              <Pressable
                key={g.id}
                disabled={!left}
                onPress={() => setGroupId(g.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on, disabled: !left }}
                style={[styles.option, on && styles.optionOn, !left && { opacity: 0.5 }]}
              >
                <Row gap={space.m}>
                  <View style={[styles.radio, on && { borderColor: colors.blue }]}>{on ? <View style={styles.radioDot} /> : null}</View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt w="s">{groupLabel(g, lang)}</Txt>
                    <Txt size="small" color={colors.inkSoft}>
                      {groupWhere(g, lang)}
                    </Txt>
                  </View>
                  <Tag label={left ? t('seatsLeft', { n: left }) : t('full')} tone={!left ? 'bad' : left <= 3 ? 'warn' : 'good'} />
                </Row>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title={t('studentName')}>
        <TextInput value={name} onChangeText={setName} placeholder={t('studentName')} placeholderTextColor={colors.inkMute} style={[input, tried && name.trim().length < 2 && styles.err]} autoComplete="name" />
      </Section>

      <Section title={t('parentPhone')}>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder={t('phonePlaceholder')}
          placeholderTextColor={colors.inkMute}
          keyboardType="phone-pad"
          style={[styles.input, { textAlign: 'left' }, tried && !phoneOk && styles.err]}
        />
        {tried && !phoneOk ? (
          <Txt size="small" color={colors.bad}>
            {t('phoneInvalid')}
          </Txt>
        ) : null}
      </Section>

      <Section title={t('payTiming')}>
        <View style={{ gap: space.s }}>
          {[true, false].map((v) => {
            const on = payNow === v;
            return (
              <Pressable key={String(v)} onPress={() => setPayNow(v)} accessibilityRole="radio" accessibilityState={{ checked: on }} style={[styles.option, on && styles.optionOn]}>
                <Row gap={space.m}>
                  <View style={[styles.radio, on && { borderColor: colors.blue }]}>{on ? <View style={styles.radioDot} /> : null}</View>
                  <Txt style={{ flex: 1 }}>{v ? t('payAtRegistration') : t('payBeforeSession')}</Txt>
                </Row>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Card style={{ marginTop: space.xl }} tone={tried && !consent ? 'sun' : 'card'}>
        <Checkbox checked={consent} onChange={setConsent} label={t('consentLabel')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 52,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: space.l,
    fontFamily: font.r,
    fontSize: 16,
    color: colors.ink,
  },
  err: { borderColor: colors.bad },
  option: { backgroundColor: colors.card, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, padding: space.m + 2 },
  optionOn: { borderColor: colors.blue, backgroundColor: colors.blueTint },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue },
  doneMark: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.sun, alignItems: 'center', justifyContent: 'center' },
});
