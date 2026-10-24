import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { colors, space } from '../theme/tokens';
import { useT } from '../i18n';
import { useStore } from '../data/store';
import { children } from '../data/mock';
import { childById } from '../data/selectors';
import { gradeLabel } from '../data/format';
import { Avatar, Icon, ListRow, Row, Sheet, Txt } from './ui';
import { LangToggle } from './LangToggle';

/** Top bar for student and parent screens: who you're looking at, language, sign out. */
export function FamilyTop() {
  const { t, L, lang } = useT();
  const { role, childId, setChild, setRole } = useStore();
  const [open, setOpen] = useState(false);
  const child = childById(childId);
  const first = L(child.name).split(' ')[0];
  const isParent = role === 'parent';

  return (
    <>
      <Row justify="space-between" style={{ paddingTop: space.m, paddingBottom: space.l }}>
        <Pressable
          disabled={!isParent}
          onPress={() => setOpen(true)}
          accessibilityRole={isParent ? 'button' : undefined}
          accessibilityLabel={isParent ? t('switchChild') : undefined}
        >
          <Row gap={space.s}>
            <Avatar name={L(child.name)} size={40} color={isParent ? colors.blue : colors.cyan} />
            <View>
              <Txt size="micro" color={colors.inkSoft}>
                {isParent ? t('roleParent') : t('roleStudent')}
              </Txt>
              <Row gap={4}>
                <Txt w="b" size="heading">
                  {isParent ? t('parentOf', { name: first }) : t('hiName', { name: first })}
                </Txt>
                {isParent ? <Icon name="chevron-down" size={16} color={colors.inkSoft} flip={false} /> : null}
              </Row>
            </View>
          </Row>
        </Pressable>
        <Row gap={space.s}>
          <LangToggle />
          <Pressable
            onPress={() => {
              setRole(null);
              router.replace('/');
            }}
            accessibilityRole="button"
            accessibilityLabel={t('signOut')}
            style={styles.out}
            hitSlop={6}
          >
            <Icon name="log-out-outline" size={18} color={colors.inkSoft} />
          </Pressable>
        </Row>
      </Row>

      <Sheet visible={open} onClose={() => setOpen(false)} title={t('switchChild')}>
        {children.map((c) => (
          <ListRow
            key={c.id}
            leading={<Avatar name={L(c.name)} size={36} />}
            title={L(c.name)}
            subtitle={gradeLabel(c.grade, lang)}
            trailing={c.id === childId ? <Icon name="checkmark-circle" color={colors.blue} flip={false} /> : undefined}
            chevron={false}
            onPress={() => {
              setChild(c.id);
              setOpen(false);
            }}
          />
        ))}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  out: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.card },
});
