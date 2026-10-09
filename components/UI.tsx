import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, grad, gradients, radius, radiusSm, shadow, type } from '../lib/theme';
import Icon from './Icon';

/* ---------- Card with press-spring ---------- */

export function Card({
  children,
  style,
  onPress,
  tone,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  tone?: 'plain' | 'flat';
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, friction: 7, tension: 220 }).start();

  const body = (
    <Animated.View
      style={[s.card, tone === 'flat' ? s.cardFlat : shadow.card, onPress ? { transform: [{ scale }] } : null, style]}
    >
      {children}
    </Animated.View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} onPressIn={() => spring(0.975)} onPressOut={() => spring(1)}>
      {body}
    </Pressable>
  );
}

/* ---------- Titles ---------- */

export function Title({ children, icon }: { children: React.ReactNode; icon?: string | null }) {
  return (
    <View style={s.titleRow}>
      {icon ? (
        <View style={s.titleIcon}>
          <Icon name={icon} size={18} color={colors.accent} />
        </View>
      ) : null}
      <Text style={s.title}>{children}</Text>
    </View>
  );
}

export function SectionTitle({
  children,
  icon,
  right,
}: {
  children: React.ReactNode;
  icon?: string | null;
  right?: React.ReactNode;
}) {
  return (
    <View style={s.sectionRow}>
      {icon ? <Icon name={icon} size={17} color={colors.accent} /> : null}
      <Text style={s.section}>{children}</Text>
      {right}
    </View>
  );
}

export function Sub({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[s.sub, style]}>{children}</Text>;
}

/* ---------- Pills / chips ---------- */

const tones: Record<string, { bg: string; fg: string }> = {
  accent: { bg: colors.accentSoft, fg: colors.accent },
  green: { bg: colors.greenSoft, fg: colors.green },
  orange: { bg: colors.amberSoft, fg: colors.orange },
  red: { bg: colors.redSoft, fg: colors.red },
  blue: { bg: colors.blueSoft, fg: colors.blue },
  coral: { bg: colors.coralSoft, fg: colors.coral },
  grey: { bg: '#f1eef7', fg: colors.ink2 },
};

export function Pill({
  children,
  tone = 'accent',
  solid,
}: {
  children: React.ReactNode;
  tone?: 'accent' | 'green' | 'orange' | 'red' | 'blue' | 'grey' | 'coral';
  solid?: boolean;
}) {
  const t = tones[tone];
  return (
    <View style={[s.pill, { backgroundColor: solid ? t.fg : t.bg }]}>
      <Text style={[s.pillText, { color: solid ? '#fff' : t.fg }]}>{children}</Text>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Progress ---------- */

export function Progress({
  value,
  max,
  label,
  color = colors.accent,
  gradient,
  height = 10,
  hideValue,
}: {
  value: number;
  max: number;
  label?: string;
  color?: string;
  gradient?: readonly string[];
  height?: number;
  hideValue?: boolean;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, anim]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ gap: 5 }}>
      {label ? (
        <View style={s.rowBetween}>
          <Text style={s.progressLabel}>{label}</Text>
          {hideValue ? null : (
            <Text style={[s.progressValue, { color }]}>
              {value}/{max}
            </Text>
          )}
        </View>
      ) : null}
      <View style={[s.track, { height, borderRadius: height }]}>
        <Animated.View style={{ width, height }}>
          <LinearGradient
            colors={grad(gradient ?? [color, color])}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: height }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

export function Ring({
  value,
  max,
  size = 76,
  stroke = 8,
  color = colors.accent,
  center,
  caption,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  center?: string;
  caption?: string;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="#ede8f7" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={s.ringCenter}>
          <Text style={[s.ringValue, { color }]}>{center ?? `${Math.round(pct * 100)}%`}</Text>
        </View>
      </View>
      {caption ? <Text style={s.ringCaption}>{caption}</Text> : null}
    </View>
  );
}

/* ---------- Buttons ---------- */

export function Button({
  title,
  onPress,
  tone = 'accent',
  small,
  disabled,
  icon,
  full,
}: {
  title: string;
  onPress: () => void;
  tone?: 'accent' | 'ghost' | 'green' | 'red' | 'coral' | 'amber';
  small?: boolean;
  disabled?: boolean;
  icon?: string | null;
  full?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, friction: 6, tension: 260 }).start();

  const gradMap: Record<string, readonly string[] | null> = {
    accent: gradients.accent,
    green: gradients.green,
    coral: gradients.coral,
    amber: gradients.amber,
    red: null,
    ghost: null,
  };
  const flat: Record<string, { bg: string; fg: string; border: string }> = {
    red: { bg: colors.redSoft, fg: colors.red, border: colors.redSoft },
    ghost: { bg: '#fff', fg: colors.accent, border: colors.line },
  };
  const g = gradMap[tone];
  const inner = (
    <View style={[s.btnInner, small && { paddingVertical: 9 }]}>
      {icon ? <Icon name={icon} size={small ? 15 : 17} color={g ? '#fff' : flat[tone].fg} /> : null}
      <Text style={[s.btnText, small && { fontSize: 13.5 }, { color: g ? '#fff' : flat[tone].fg }]}>{title}</Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => spring(0.96)}
      onPressOut={() => spring(1)}
      style={full ? { alignSelf: 'stretch' } : undefined}
    >
      <Animated.View
        style={[
          s.btn,
          !g && { backgroundColor: flat[tone].bg, borderWidth: 1, borderColor: flat[tone].border },
          g ? shadow.soft : null,
          { transform: [{ scale }], opacity: disabled ? 0.42 : 1 },
        ]}
      >
        {g ? (
          <LinearGradient colors={grad(g)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btnGrad}>
            {inner}
          </LinearGradient>
        ) : (
          inner
        )}
      </Animated.View>
    </Pressable>
  );
}

/* ---------- Layout helpers ---------- */

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 9 }, style]}>{children}</View>;
}

export function Divider() {
  return <View style={s.divider} />;
}

export function Stat({
  value,
  label,
  tone = 'accent',
  icon,
}: {
  value: string | number;
  label: string;
  tone?: 'accent' | 'green' | 'red' | 'blue' | 'coral' | 'amber' | 'grey';
  icon?: string | null;
}) {
  const map: Record<string, { bg: string; fg: string }> = {
    accent: { bg: colors.accentSoft, fg: colors.accent },
    green: { bg: colors.greenSoft, fg: colors.green },
    red: { bg: colors.redSoft, fg: colors.red },
    blue: { bg: colors.blueSoft, fg: colors.blue },
    coral: { bg: colors.coralSoft, fg: colors.coral },
    amber: { bg: colors.amberSoft, fg: colors.orange },
    grey: { bg: colors.bgAlt, fg: colors.ink2 },
  };
  const t = map[tone] ?? map.accent;
  return (
    <View style={[s.stat, { backgroundColor: t.bg }]}>
      {icon ? <Icon name={icon} size={15} color={t.fg} /> : null}
      <Text style={[s.statValue, { color: t.fg }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export function Empty({ text, icon = 'paw' }: { text: string; icon?: string }) {
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyIcon}>
        <Icon name={icon} size={26} color={colors.accent} />
      </View>
      <Text style={s.empty}>{text}</Text>
    </View>
  );
}

export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 380, delay, useNativeDriver: true }).start();
  }, [a, delay]);
  return (
    <Animated.View
      style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}
    >
      {children}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    gap: 9,
  },
  cardFlat: { borderWidth: 1, borderColor: colors.line },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.h2, color: colors.ink, flex: 1 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 2 },
  section: { ...type.h3, color: colors.ink, flex: 1 },
  sub: { ...type.small, color: colors.ink3, lineHeight: 18.5 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { ...type.micro },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { ...type.small, color: colors.ink2 },
  track: { backgroundColor: '#ede8f7', overflow: 'hidden' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { ...type.small, color: colors.ink2 },
  progressValue: { fontSize: 13, fontWeight: '800' },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringValue: { fontSize: 17, fontWeight: '800' },
  ringCaption: { ...type.micro, color: colors.ink3, textAlign: 'center' },
  btn: { borderRadius: radiusSm, overflow: 'hidden' },
  btnGrad: { borderRadius: radiusSm },
  btnInner: { flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, paddingHorizontal: 16 },
  btnText: { fontWeight: '800', fontSize: 14.5, letterSpacing: -0.2 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 8 },
  stat: { flex: 1, borderRadius: radiusSm, padding: 11, gap: 2, alignItems: 'flex-start' },
  statValue: { fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { ...type.micro, color: colors.ink3 },
  emptyWrap: { alignItems: 'center', gap: 8, paddingVertical: 22 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { ...type.small, color: colors.ink3, textAlign: 'center', maxWidth: 260, lineHeight: 18 },
});
