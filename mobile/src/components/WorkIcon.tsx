import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme/tokens';
import { Icon } from './ui';
import type { AssessmentKind } from '../data/types';

const map: Record<AssessmentKind, { icon: 'document-text' | 'flash' | 'school'; fg: string; bg: string }> = {
  homework: { icon: 'document-text', fg: colors.blue, bg: colors.blueTint },
  quiz: { icon: 'flash', fg: '#0B7F8F', bg: colors.cyanTint },
  exam: { icon: 'school', fg: '#8A6200', bg: colors.sunTint },
};

export function WorkIcon({ kind, size = 36 }: { kind: AssessmentKind; size?: number }) {
  const m = map[kind];
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: m.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={m.icon} size={size * 0.5} color={m.fg} flip={false} />
    </View>
  );
}
