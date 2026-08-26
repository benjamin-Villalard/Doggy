import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { skillLegend } from '../lib/content';
import { colors, type } from '../lib/theme';

/** Couleur du palier : rouge → ambre → vert, comme dans la grille du livre. */
const toneOf = (n: number) => (n >= 4 ? colors.green : n >= 2 ? colors.amber : n >= 1 ? colors.coral : colors.ink3);

function Cell({ n, active, onPress }: { n: number; active: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, friction: 6, tension: 280 }).start();
  const tone = toneOf(n);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => spring(0.9)}
      onPressOut={() => spring(1)}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[s.cell, { transform: [{ scale }] }, active && { backgroundColor: tone, borderColor: tone }]}
      >
        <Text style={[s.cellText, active && { color: '#fff' }]}>{n}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function ScorePicker({
  value,
  onChange,
  compact,
}: {
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  return (
    <View style={{ gap: 7 }}>
      <View style={s.row}>
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <Cell key={n} n={n} active={value === n} onPress={() => onChange(n)} />
        ))}
      </View>
      {compact ? null : (
        <View style={[s.legendBox, { backgroundColor: value >= 4 ? colors.greenSoft : colors.accentSoft }]}>
          <Text style={[s.legend, { color: value >= 4 ? colors.green : colors.accent }]}>
            {skillLegend[value] ?? ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  cell: {
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: '#faf8fe',
    borderRadius: 13,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cellText: { fontWeight: '800', color: colors.ink2, fontSize: 15 },
  legendBox: { borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  legend: { ...type.small, fontSize: 12 },
});
