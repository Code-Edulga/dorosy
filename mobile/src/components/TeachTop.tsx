import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '../theme/tokens';
import { useT } from '../i18n';
import { useStore } from '../data/store';
import { ME_INSTRUCTOR } from '../data/mock';
import { instructorById } from '../data/selectors';
import { Avatar, Icon, Row, Txt } from './ui';
import { LangToggle } from './LangToggle';

/** Top bar for instructor screens: greeting, public page, language, sign out. */
export function TeachTop() {
  const { t, L } = useT();
  const { setRole } = useStore();
  const me = instructorById(ME_INSTRUCTOR);
  const name = L(me.name);
  const morning = new Date().getHours() < 12;
  return (
    <Row justify="space-between" style={{ paddingTop: space.m, paddingBottom: space.l }}>
      <Row gap={space.s} style={{ flex: 1 }}>
        <Avatar name={name} size={40} />
        <View style={{ flex: 1 }}>
          <Txt size="micro" color={colors.inkSoft}>
            {t(morning ? 'goodDay' : 'goodEvening')}
          </Txt>
          <Txt w="b" size="heading" numberOfLines={1}>
            {name}
          </Txt>
        </View>
      </Row>
      <Row gap={space.s}>
        <LangToggle />
        <Pressable
          onPress={() => {
            setRole(null);
            router.replace('/');
          }}
          style={styles.round}
          accessibilityRole="button"
          accessibilityLabel={t('signOut')}
        >
          <Icon name="log-out-outline" size={18} color={colors.inkSoft} />
        </Pressable>
      </Row>
    </Row>
  );
}

const styles = StyleSheet.create({
  round: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.card },
});
