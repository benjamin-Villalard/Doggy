import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radiusSm, type } from '../lib/theme';
import Icon from './Icon';

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  keyboardType,
  multiline,
  secure,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  hint?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  secure?: boolean;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, multiline && { minHeight: 70, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink3}
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secure}
        autoCapitalize={secure ? 'none' : undefined}
        autoCorrect={secure ? false : undefined}
      />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  hint?: string;
}) {
  return (
    <View style={{ gap: 5 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={s.segWrap}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={[s.seg, active && s.segActive]}>
              <Text style={[s.segText, active && { color: '#fff' }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Toggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <Pressable onPress={() => onChange(!value)} style={s.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        {hint ? <Text style={s.hint}>{hint}</Text> : null}
      </View>
      <View style={[s.track, value && { backgroundColor: colors.accent }]}>
        <View style={[s.knob, value && { alignSelf: 'flex-end' }]} />
      </View>
    </Pressable>
  );
}

export function Stepper({
  label,
  value,
  min = 0,
  max = 99,
  step = 1,
  suffix,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <View style={s.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        {hint ? <Text style={s.hint}>{hint}</Text> : null}
      </View>
      <View style={s.stepWrap}>
        <Pressable onPress={() => onChange(Math.max(min, value - step))} style={s.stepBtn}>
          <Text style={s.stepText}>−</Text>
        </Pressable>
        <Text style={s.stepValue}>
          {value}
          {suffix ?? ''}
        </Text>
        <Pressable onPress={() => onChange(Math.min(max, value + step))} style={s.stepBtn}>
          <Text style={s.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function EmojiPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.emojiWrap}>
        {options.map((e) => (
          <Pressable key={e} onPress={() => onChange(e)} style={[s.emoji, e === value && s.emojiActive]}>
            <Text style={{ fontSize: 20 }}>{e}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ListRow({
  title,
  sub,
  icon,
  onRemove,
  tone = colors.accent,
}: {
  title: string;
  sub?: string;
  icon?: string;
  onRemove?: () => void;
  tone?: string;
}) {
  return (
    <View style={s.listRow}>
      {icon ? <Icon name={icon} size={17} color={tone} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={s.listTitle}>{title}</Text>
        {sub ? <Text style={s.hint}>{sub}</Text> : null}
      </View>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8}>
          <Icon name="cross" size={16} color={colors.ink3} />
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  hint: { ...type.small, color: colors.ink3, fontSize: 11.5, lineHeight: 16 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#faf8fe',
    color: colors.ink,
    fontSize: 14,
    outlineStyle: 'none',
  } as never,
  segWrap: {
    flexDirection: 'row',
    backgroundColor: '#f1eef8',
    borderRadius: 999,
    padding: 3,
    gap: 3,
  },
  seg: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  segActive: { backgroundColor: colors.accent },
  segText: { fontSize: 12.5, fontWeight: '800', color: colors.ink2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  track: { width: 46, height: 27, borderRadius: 999, backgroundColor: '#ddd6ec', padding: 3, justifyContent: 'center' },
  knob: { width: 21, height: 21, borderRadius: 999, backgroundColor: '#fff' },
  stepWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 17, fontWeight: '800', color: colors.accent },
  stepValue: { fontSize: 14, fontWeight: '800', color: colors.ink, minWidth: 46, textAlign: 'center' },
  emojiWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  emoji: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#f6f4fb',
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  listTitle: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
});
