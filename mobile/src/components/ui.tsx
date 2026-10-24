import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, font, radius, space, type } from '../theme/tokens';
import { useT } from '../i18n';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

// ---------- Text ----------

type TxtProps = {
  children: React.ReactNode;
  w?: keyof typeof font;
  size?: keyof typeof type;
  color?: string;
  center?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  selectable?: boolean;
};

export function Txt({ children, w = 'r', size = 'body', color = colors.ink, center, style, numberOfLines, selectable }: TxtProps) {
  const { align, rtl } = useT();
  return (
    <Text
      numberOfLines={numberOfLines}
      selectable={selectable}
      style={[
        {
          fontFamily: font[w],
          fontSize: type[size].size,
          lineHeight: type[size].line,
          color,
          textAlign: center ? 'center' : align,
          writingDirection: rtl ? 'rtl' : 'ltr',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ---------- Layout ----------

type RowProps = {
  children: React.ReactNode;
  gap?: number;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Row({ children, gap = space.s, align = 'center', justify, wrap, style }: RowProps) {
  const { row } = useT();
  return (
    <View style={[{ flexDirection: row, alignItems: align, justifyContent: justify, gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>
      {children}
    </View>
  );
}

/** Column wrapper that hugs its children to the reading-start edge (for tags, small buttons). */
export function AlignStart({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { rtl } = useT();
  return <View style={[{ alignItems: rtl ? 'flex-end' : 'flex-start' }, style]}>{children}</View>;
}

export const Spacer = ({ h = space.l }: { h?: number }) => <View style={{ height: h }} />;

// ---------- Icons ----------

/** Directional icons flip in right-to-left layouts. */
const DIRECTIONAL: Partial<Record<string, string>> = {
  'chevron-forward': 'chevron-back',
  'chevron-back': 'chevron-forward',
  'arrow-forward': 'arrow-back',
  'arrow-back': 'arrow-forward',
  send: 'send',
};

export function Icon({ name, size = 20, color = colors.ink, flip = true }: { name: IconName; size?: number; color?: string; flip?: boolean }) {
  const { rtl } = useT();
  const n = (rtl && flip && DIRECTIONAL[name] ? DIRECTIONAL[name] : name) as IconName;
  const mirror = rtl && flip && name === 'send';
  return (
    <View style={mirror ? { transform: [{ scaleX: -1 }] } : undefined}>
      <Ionicons name={n} size={size} color={color} />
    </View>
  );
}

// ---------- Screen & header ----------

type ScreenProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  scroll?: boolean;
  footer?: React.ReactNode;
  padded?: boolean;
  bg?: string;
};

export function Screen({ children, title, subtitle, back, right, scroll = true, footer, padded = true, bg = colors.paper }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const body = (
    <View style={{ paddingHorizontal: padded ? space.l : 0, paddingBottom: space.xxl }}>
      {(title || back) && <Header title={title} subtitle={subtitle} back={back} right={right} />}
      {children}
    </View>
  );
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: bg }}>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{body}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.l) }]}>{footer}</View>
      ) : null}
    </SafeAreaView>
  );
}

export function Header({ title, subtitle, back, right }: { title?: string; subtitle?: string; back?: boolean; right?: React.ReactNode }) {
  const { t } = useT();
  return (
    <View style={{ paddingTop: space.m, paddingBottom: space.l, gap: space.s }}>
      {(back || right) && (
        <Row justify="space-between">
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('back')}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Icon name="chevron-back" size={22} />
            </Pressable>
          ) : (
            <View />
          )}
          {right}
        </Row>
      )}
      {title ? (
        <Txt w="b" size="title">
          {title}
        </Txt>
      ) : null}
      {subtitle ? (
        <Txt size="small" color={colors.inkSoft}>
          {subtitle}
        </Txt>
      ) : null}
    </View>
  );
}

// ---------- Surfaces ----------

export function Card({ children, style, onPress, tone = 'card' }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; tone?: 'card' | 'tint' | 'sun' }) {
  const bg = tone === 'tint' ? colors.blueTint : tone === 'sun' ? colors.sunTint : colors.card;
  const border = tone === 'card' ? colors.line : 'transparent';
  const s = [styles.card, { backgroundColor: bg, borderColor: border }, style];
  if (!onPress) return <View style={s}>{children}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

export function Section({ title, action, onAction, children, style }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginTop: space.xl, gap: space.m }, style]}>
      <Row justify="space-between">
        <Txt w="b" size="heading">
          {title}
        </Txt>
        {action ? (
          <Pressable onPress={onAction} hitSlop={8} accessibilityRole="link">
            <Txt w="m" size="small" color={colors.blue}>
              {action}
            </Txt>
          </Pressable>
        ) : null}
      </Row>
      {children}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }, style]} />;
}

// ---------- Controls ----------

type BtnProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'sun' | 'outline' | 'ghost' | 'danger';
  icon?: IconName;
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
} & Pick<PressableProps, 'accessibilityHint'>;

export function Btn({ label, onPress, variant = 'primary', icon, full, disabled, loading, small, style, accessibilityHint }: BtnProps) {
  const palette = {
    primary: { bg: colors.blue, fg: '#fff', border: colors.blue },
    sun: { bg: colors.sun, fg: colors.ink, border: colors.sun },
    outline: { bg: colors.card, fg: colors.blue, border: colors.line },
    ghost: { bg: 'transparent', fg: colors.blue, border: 'transparent' },
    danger: { bg: colors.badTint, fg: colors.bad, border: colors.badTint },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: palette.bg, borderColor: palette.border, alignSelf: full ? 'stretch' : undefined },
        (disabled || loading) && { opacity: 0.45 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      <Row gap={space.s} justify="center">
        {loading ? <ActivityIndicator color={palette.fg} /> : icon ? <Icon name={icon} size={small ? 16 : 18} color={palette.fg} /> : null}
        <Txt w="s" size={small ? 'small' : 'body'} color={palette.fg} center>
          {label}
        </Txt>
      </Row>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[styles.chip, selected ? { backgroundColor: colors.ink, borderColor: colors.ink } : null]}
    >
      <Row gap={6}>
        {icon ? <Icon name={icon} size={14} color={selected ? '#fff' : colors.inkSoft} /> : null}
        <Txt w="m" size="small" color={selected ? '#fff' : colors.inkSoft}>
          {label}
        </Txt>
      </Row>
    </Pressable>
  );
}

export type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral' | 'sun';

export function Tag({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const map = {
    good: [colors.goodTint, colors.good],
    warn: [colors.warnTint, colors.warn],
    bad: [colors.badTint, colors.bad],
    info: [colors.cyanTint, '#0B7F8F'],
    neutral: ['#EEF2F8', colors.inkSoft],
    sun: [colors.sunTint, '#8A6200'],
  }[tone];
  return (
    <View style={[styles.tag, { backgroundColor: map[0] }]}>
      <Row gap={4}>
        {icon ? <Icon name={icon} size={12} color={map[1]} flip={false} /> : null}
        <Txt w="m" size="micro" color={map[1]}>
          {label}
        </Txt>
      </Row>
    </View>
  );
}

export function Bar({ value, color = colors.cyan, track = '#E6ECF5', height = 6 }: { value: number; color?: string; track?: string; height?: number }) {
  const { rtl } = useT();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden', flexDirection: rtl ? 'row-reverse' : 'row' }}
    >
      <View style={{ width: `${pct}%`, backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

export function Avatar({ name, size = 40, color = colors.blue }: { name: string; size?: number; color?: string }) {
  const words = name.replace(/^(أ\.|Mr\.|Ms\.)\s*/, '').split(/\s+/);
  // Arabic letters join into a word when placed together, so Arabic names show one letter.
  const arabic = /[\u0600-\u06FF]/.test(name);
  const letters = arabic ? words[0][0] : words.slice(0, 2).map((w) => w[0]).join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '1F', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: font.b, fontSize: size * 0.36, color }}>{letters}</Text>
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  chevron = !!onPress,
}: {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}) {
  const content = (
    <Row gap={space.m} style={{ paddingVertical: space.m }}>
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt w="m" numberOfLines={2}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt size="small" color={colors.inkSoft} numberOfLines={2}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {trailing}
      {chevron ? <Icon name="chevron-forward" size={18} color={colors.inkMute} /> : null}
    </Row>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {content}
    </Pressable>
  );
}

export function Stat({ label, value, sub, color = colors.ink }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Txt size="small" color={colors.inkSoft}>
        {label}
      </Txt>
      <Txt w="b" size="title" color={color}>
        {value}
      </Txt>
      {sub ? (
        <Txt size="micro" color={colors.inkMute}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}

export function Notice({ text, tone = 'good', icon = 'checkmark-circle' }: { text: string; tone?: Tone; icon?: IconName }) {
  const map = { good: [colors.goodTint, colors.good], warn: [colors.warnTint, colors.warn], bad: [colors.badTint, colors.bad], info: [colors.cyanTint, '#0B7F8F'], neutral: ['#EEF2F8', colors.inkSoft], sun: [colors.sunTint, '#8A6200'] }[tone];
  return (
    <View style={{ backgroundColor: map[0], borderRadius: radius.control, padding: space.m }} accessibilityLiveRegion="polite">
      <Row gap={space.s} align="flex-start">
        <Icon name={icon} size={18} color={map[1]} flip={false} />
        <View style={{ flex: 1 }}>
          <Txt size="small" w="m" color={map[1]}>
            {text}
          </Txt>
        </View>
      </Row>
    </View>
  );
}

export function Empty({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ paddingVertical: space.xl, alignItems: 'center', gap: space.m }}>
      <Txt color={colors.inkSoft} center>
        {text}
      </Txt>
      {action ? <Btn label={action} variant="outline" small onPress={onAction} /> : null}
    </View>
  );
}

/** Bottom sheet built on Modal; works on iOS, Android and web. */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="close" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.l) }]}>
        <View style={styles.grabber} />
        <Txt w="b" size="heading" style={{ marginBottom: space.m }}>
          {title}
        </Txt>
        {children}
      </View>
    </Modal>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { rtl } = useT();
  const knobSide = value !== rtl ? 'flex-end' : 'flex-start';
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label}>
      <Row gap={space.m} style={{ paddingVertical: space.m }}>
        <View style={{ flex: 1 }}>
          <Txt>{label}</Txt>
        </View>
        <View style={[styles.switch, { backgroundColor: value ? colors.cyan : '#D3DBE8', alignItems: knobSide }]}>
          <View style={styles.knob} />
        </View>
      </Row>
    </Pressable>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <Row gap={space.m} align="flex-start">
        <View style={[styles.box, checked && { backgroundColor: colors.blue, borderColor: colors.blue }]}>
          {checked ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Txt size="small" color={colors.inkSoft}>
            {label}
          </Txt>
        </View>
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.l,
  },
  btn: {
    minHeight: 52,
    paddingHorizontal: space.xl,
    borderRadius: radius.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSmall: { minHeight: 38, paddingHorizontal: space.l, borderRadius: radius.small },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.chip },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: space.l,
    paddingTop: space.m,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  scrim: { flex: 1, backgroundColor: 'rgba(11,27,63,0.45)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: space.l,
    paddingTop: space.s,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: 'center', marginBottom: space.l },
  switch: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.inkMute,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});
