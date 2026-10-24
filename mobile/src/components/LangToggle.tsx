import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, radius } from '../theme/tokens';
import { useT } from '../i18n';
import { Icon, Row, Txt } from './ui';
import type { Role } from '../data/types';

export function LangToggle({ onDark }: { onDark?: boolean }) {
  const { t, toggleLang } = useT();
  const fg = onDark ? '#fff' : colors.ink;
  return (
    <Pressable onPress={toggleLang} accessibilityRole="button" style={[styles.pill, onDark && { borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'transparent' }]}>
      <Row gap={6}>
        <Icon name="language" size={16} color={fg} flip={false} />
        <Txt w="m" size="small" color={fg}>
          {t('language')}
        </Txt>
      </Row>
    </Pressable>
  );
}

export function homeFor(role: Role) {
  return role === 'instructor' ? '/dashboard' : '/home';
}

export function goHome(role: Role) {
  router.replace(homeFor(role) as never);
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
});
