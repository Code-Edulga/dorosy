import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, space } from '../theme/tokens';
import { useT } from '../i18n';
import { useStore } from '../data/store';
import { Btn, Icon, Row, Screen, Txt, type IconName } from '../components/ui';
import { LangToggle, goHome } from '../components/LangToggle';
import type { Role } from '../data/types';

export default function Welcome() {
  const { t, rtl } = useT();
  const { setRole } = useStore();

  const pick = (r: Role) => {
    setRole(r);
    goHome(r);
  };

  const roles: { role: Role; icon: IconName; title: string; desc: string; color: string }[] = [
    { role: 'student', icon: 'school', title: t('roleStudent'), desc: t('roleStudentDesc'), color: colors.cyan },
    { role: 'parent', icon: 'people', title: t('roleParent'), desc: t('roleParentDesc'), color: colors.blue },
    { role: 'instructor', icon: 'easel', title: t('roleInstructor'), desc: t('roleInstructorDesc'), color: colors.blueDeep },
  ];

  return (
    <Screen>
      <Row justify="space-between" style={{ paddingTop: space.m }}>
        <View />
        <LangToggle />
      </Row>

      {/* Wordmark: the name is the hero. Arabic large, Latin beneath. */}
      <View style={{ marginTop: space.xxl, marginBottom: space.xl }}>
        <Txt w="b" color={colors.blue} style={styles.wordmark}>
          دروسي
        </Txt>
        <Row gap={space.s} style={{ marginTop: -6 }}>
          <View style={styles.sunDot} />
          <Txt w="m" color={colors.cyan} style={{ letterSpacing: 1 }}>
            Dorosy
          </Txt>
        </Row>
        <Txt size="heading" w="m" style={{ marginTop: space.xl }}>
          {t('welcomeTitle')}
        </Txt>
        <Txt color={colors.inkSoft} style={{ marginTop: space.xs }}>
          {t('welcomeBody')}
        </Txt>
      </View>

      <Btn label={t('continueWithPhone')} icon="call" full onPress={() => router.push('/auth/phone')} />

      <Txt w="s" size="small" color={colors.inkSoft} style={{ marginTop: space.xxl, marginBottom: space.m }}>
        {t('demoAs')}
      </Txt>
      <View style={{ gap: space.s }}>
        {roles.map((r) => (
          <Pressable
            key={r.role}
            onPress={() => pick(r.role)}
            accessibilityRole="button"
            accessibilityLabel={`${t('demoAs')} ${r.title}`}
            style={({ pressed }) => [styles.role, pressed && { backgroundColor: colors.blueTint }]}
          >
            <Row gap={space.m}>
              <View style={[styles.roleIcon, { backgroundColor: r.color + '1A' }]}>
                <Icon name={r.icon} size={22} color={r.color} flip={false} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt w="s">{r.title}</Txt>
                <Txt size="small" color={colors.inkSoft}>
                  {r.desc}
                </Txt>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.inkMute} />
            </Row>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => router.push('/t/mr-ahmed-physics')} style={{ marginTop: space.xl, alignSelf: rtl ? 'flex-end' : 'flex-start' }} accessibilityRole="link">
        <Row gap={6}>
          <Icon name="globe-outline" size={16} color={colors.blue} flip={false} />
          <Txt w="m" size="small" color={colors.blue}>
            {t('browseInstructorPage')}
          </Txt>
        </Row>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wordmark: { fontSize: 72, lineHeight: 104 },
  sunDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.sun },
  role: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: space.l,
  },
  roleIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
