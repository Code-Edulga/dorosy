import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, font, radius, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { Btn, Notice, Screen, Txt } from '../../components/ui';

const LEN = 6;

export default function Otp() {
  const { t } = useT();
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [left, setLeft] = useState(30);
  const input = useRef<TextInputInstance>(null);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const verify = () => {
    if (code.length === LEN) router.replace('/auth/role');
  };

  const pretty = phone.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1 $2 $3');

  return (
    <Screen
      back
      title={t('otpTitle')}
      subtitle={t('otpBody', { phone: pretty })}
      footer={<Btn label={t('verify')} full onPress={verify} disabled={code.length < LEN} />}
    >
      <Pressable onPress={() => input.current?.focus()} accessibilityLabel={t('otpTitle')}>
        <View style={styles.row}>
          {Array.from({ length: LEN }, (_, i) => {
            const active = i === code.length;
            return (
              <View key={i} style={[styles.cell, active && { borderColor: colors.blue, borderWidth: 2 }, code[i] && { backgroundColor: colors.blueTint }]}>
                <Txt w="b" size="title" center>
                  {code[i] ?? ''}
                </Txt>
              </View>
            );
          })}
        </View>
        <TextInput
          ref={input}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, LEN))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          autoFocus
          maxLength={LEN}
          onSubmitEditing={verify}
          style={styles.hidden}
          caretHidden
        />
      </Pressable>

      <View style={{ marginTop: space.l }}>
        {left > 0 ? (
          <Txt size="small" color={colors.inkSoft}>
            {t('resendIn', { s: left })}
          </Txt>
        ) : (
          <Pressable onPress={() => setLeft(30)} accessibilityRole="button">
            <Txt w="m" size="small" color={colors.blue}>
              {t('resend')}
            </Txt>
          </Pressable>
        )}
      </View>

      <View style={{ marginTop: space.xl }}>
        <Notice text={t('otpDemoHint')} tone="info" icon="information-circle" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Codes read left to right in both languages.
  row: { flexDirection: 'row', gap: space.s, justifyContent: 'space-between' },
  cell: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 56,
    borderRadius: radius.control,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1, fontFamily: font.r },
});
