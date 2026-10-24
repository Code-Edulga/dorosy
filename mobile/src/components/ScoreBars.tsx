import React from 'react';
import { View } from 'react-native';
import { colors, space } from '../theme/tokens';
import { useT } from '../i18n';
import { Row, Txt } from './ui';
import { fmtDate } from '../lib/dates';
import type { ScorePoint } from '../data/types';

/** Recent scores as columns, oldest first in reading order; the latest column is the strong one. */
export function ScoreBars({ points, height = 110 }: { points: ScorePoint[]; height?: number }) {
  const { L, lang } = useT();
  return (
    <Row align="flex-end" gap={space.s} style={{ marginTop: space.m }}>
      {points.map((p, i) => {
        const last = i === points.length - 1;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }} accessible accessibilityLabel={`${L(p.title)} ${p.pct}%`}>
            <Txt w={last ? 'b' : 'm'} size="micro" color={last ? colors.blue : colors.inkSoft} center>
              {p.pct}%
            </Txt>
            <View style={{ width: '100%', maxWidth: 34, height: (height * p.pct) / 100, backgroundColor: last ? colors.blue : '#BFD0F7', borderRadius: 8 }} />
            <Txt size="micro" color={colors.inkMute} center numberOfLines={1}>
              {fmtDate(p.date, lang)}
            </Txt>
          </View>
        );
      })}
    </Row>
  );
}
