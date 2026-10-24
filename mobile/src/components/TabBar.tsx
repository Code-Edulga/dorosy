import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, space } from '../theme/tokens';
import { useT } from '../i18n';
import { Txt, type IconName } from './ui';

export type TabSpec = { name: string; label: string; icon: IconName; iconActive: IconName; badge?: number };

/** Custom tab bar so tab order follows reading direction in both languages. */
export function TabBar({ state, navigateToTab, specs }: BottomTabBarProps & { specs: TabSpec[] }) {
  const insets = useSafeAreaInsets();
  const { rtl } = useT();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.s), flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      {state.routes.map((route, index) => {
        const spec = specs.find((s) => s.name === route.name);
        if (!spec) return null;
        const focused = state.index === index;
        const onPress = () => {
          if (!focused) navigateToTab(route.key);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={spec.label}
            style={styles.item}
          >
            <View style={[styles.pill, focused && { backgroundColor: colors.blueTint }]}>
              <Ionicons name={focused ? spec.iconActive : spec.icon} size={22} color={focused ? colors.blue : colors.inkMute} />
              {spec.badge ? (
                <View style={styles.badge}>
                  <Txt w="b" size="micro" color={colors.ink} center style={{ fontSize: 10, lineHeight: 14 }}>
                    {String(spec.badge)}
                  </Txt>
                </View>
              ) : null}
            </View>
            <Txt w={focused ? 's' : 'r'} size="micro" color={focused ? colors.blue : colors.inkMute} center style={{ fontFamily: focused ? font.s : font.r }}>
              {spec.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: space.s,
  },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  pill: { width: 56, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -2,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
