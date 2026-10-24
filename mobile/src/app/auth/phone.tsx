import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors, font, radius, space } from '../../theme/tokens';
import { useT } from '../../i18n';
import { Btn, Screen, Txt } from '../../components/ui';

export default function Phone() {
  const { t } = useT();
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const digits = phone.replace(/\D/g, '');
  const valid = /^01[0125]\d{8}$/.test(digits);

  const next = () => {
    setTouched(true);
    if (valid) router.push({ pathname: '/auth/otp', params: { phone: digits } });
  };

  return (
    <Screen back title={t('phoneTitle')} subtitle={t('phoneBody')} footer={<Btn label={t('sendCode')} full onPress={next} disabled={!digits.length} />}>
      {/* Phone numbers read left to right in both languages. */}
      <View style={{ flexDirection: 'row', gap: space.s }}>
        <View style={styles.cc}>
          <Txt w="s" center>
            +20
          </Txt>
        </View>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder={t('phonePlaceholder')}
          placeholderTextColor={colors.inkMute}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={13}
          autoFocus
          onSubmitEditing={next}
          accessibilityLabel={t('phoneTitle')}
          style={[styles.input, touched && !valid && { borderColor: colors.bad }]}
        />
      </View>
      {touched && !valid ? (
        <Txt size="small" color={colors.bad} style={{ marginTop: space.s }}>
          {t('phoneInvalid')}
        </Txt>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cc: {
    height: 56,
    paddingHorizontal: space.l,
    borderRadius: radius.control,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 56,
    borderRadius: radius.control,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.l,
    fontFamily: font.s,
    fontSize: 20,
    letterSpacing: 1,
    color: colors.ink,
    textAlign: 'left',
  },
});
