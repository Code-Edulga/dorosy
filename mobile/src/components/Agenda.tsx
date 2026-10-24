import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme/tokens';
import { AlignStart, Row, Tag, Txt, type Tone } from './ui';

type Props = {
  time: string;
  until?: string;
  title: string;
  subtitle?: string;
  color?: string;
  tag?: { label: string; tone: Tone };
  onPress?: () => void;
  dim?: boolean;
};

/** One line of a day's agenda: time on the leading edge, a colour rule, then what and where. */
export function AgendaItem({ time, until, title, subtitle, color = colors.cyan, tag, onPress, dim }: Props) {
  const body = (
    <Row gap={space.m} align="stretch" style={[styles.item, dim && { opacity: 0.6 }]}>
      <View style={{ width: 64, paddingTop: 2 }}>
        <Txt w="s" size="small">
          {time}
        </Txt>
        {until ? (
          <Txt size="micro" color={colors.inkMute}>
            {until}
          </Txt>
        ) : null}
      </View>
      <View style={[styles.rule, { backgroundColor: color }]} />
      <View style={{ flex: 1, gap: 4 }}>
        <Txt w="s">{title}</Txt>
        {subtitle ? (
          <Txt size="small" color={colors.inkSoft}>
            {subtitle}
          </Txt>
        ) : null}
        {tag ? (
          <AlignStart>
            <Tag label={tag.label} tone={tag.tone} />
          </AlignStart>
        ) : null}
      </View>
    </Row>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.75 }}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: colors.card,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: space.m,
  },
  rule: { width: 3, borderRadius: 2 },
});
