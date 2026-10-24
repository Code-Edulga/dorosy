import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme/tokens';
import { useT } from '../i18n';
import { Txt } from './ui';

export function Segmented<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[] }) {
  const { row } = useT();
  return (
    <View style={[styles.wrap, { flexDirection: row }]} accessibilityRole="tablist">
      {items.map((i) => {
        const on = i.value === value;
        return (
          <Pressable key={i.value} onPress={() => onChange(i.value)} style={[styles.item, on && styles.on]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <Txt w={on ? 's' : 'm'} size="small" color={on ? colors.ink : colors.inkSoft} center>
              {i.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#E6ECF5', borderRadius: radius.control, padding: 4, gap: 4 },
  item: { flex: 1, paddingVertical: 8, borderRadius: radius.small, alignItems: 'center' },
  on: { backgroundColor: colors.card },
});
