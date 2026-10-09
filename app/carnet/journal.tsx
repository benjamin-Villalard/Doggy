import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/Icon';
import { Button, Card, Pill, Row, SectionTitle, Sub } from '../../components/UI';
import { dayKey, daySummary, eliminationRef, localToday, stoolColors, waterPlan, foodPlan } from '../../lib/daily';
import { growthBasis } from '../../lib/growth';
import { mealsForAge } from '../../lib/health';
import { ageInWeeks, lastWeightG, useActions, useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

const shift = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return dayKey(d.toISOString());
};
const hm = (ts: string) => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const kindLabel: Record<string, string> = {
  pipi: 'Pipi',
  caca: 'Selle',
  'accident-pipi': 'Accident pipi',
  'accident-caca': 'Accident selle',
};

export default function Journal() {
  const { state } = useStore();
  const { removePotty, removeWater, removeMeal } = useActions();
  const router = useRouter();
  const [day, setDay] = useState(localToday());
  const weeks = ageInWeeks(state.profile.birthdate);
  const grams = lastWeightG(state.weights);
  const sum = daySummary(day, state.potty, state.water, state.meals);
  const ref = eliminationRef(weeks);
  const water = waterPlan(grams, weeks);
  const food = foodPlan(grams, growthBasis(state.profile).adultG, weeks, state.health, state.health.meals || mealsForAge(weeks).meals);

  type Item = { id: string; ts: string; title: string; detail?: string; icon: string; color: string; remove: () => void };
  const items: Item[] = [
    ...state.potty
      .filter((e) => dayKey(e.ts) === day)
      .map((e) => ({
        id: e.id,
        ts: e.ts,
        title: kindLabel[e.kind],
        detail: [e.color ? stoolColors[e.color].label : null, e.consistency ? `consistance ${e.consistency}/7` : null, ...(e.flags ?? []), e.note]
          .filter(Boolean)
          .join(' · '),
        icon: e.kind.includes('pipi') ? 'pee' : 'paw',
        color: e.kind.startsWith('accident') ? colors.red : e.kind === 'pipi' ? colors.amber : colors.orange,
        remove: () => removePotty(e.id),
      })),
    ...state.water
      .filter((e) => dayKey(e.ts) === day)
      .map((e) => ({ id: e.id, ts: e.ts, title: `Eau ${e.ml} ml`, icon: 'drop', color: colors.sky, remove: () => removeWater(e.id) })),
    ...state.meals
      .filter((e) => dayKey(e.ts) === day)
      .map((e) => ({ id: e.id, ts: e.ts, title: `Repas ${e.grams} g`, icon: 'bowl', color: colors.green, remove: () => removeMeal(e.id) })),
  ].sort((a, b) => (a.ts < b.ts ? 1 : -1));

  const label = new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Card>
        <Row>
          <Pressable onPress={() => setDay(shift(day, -1))} hitSlop={10}>
            <Text style={s.arrow}>‹</Text>
          </Pressable>
          <Text style={[s.h, { flex: 1, textAlign: 'center' }]}>{day === localToday() ? "Aujourd'hui" : label}</Text>
          <Pressable onPress={() => day < localToday() && setDay(shift(day, 1))} hitSlop={10}>
            <Text style={[s.arrow, day >= localToday() && { opacity: 0.2 }]}>›</Text>
          </Pressable>
        </Row>
        <View style={s.grid}>
          <Kpi label="Pipis" value={`${sum.pee}`} target={`${ref.pee[0]}-${ref.pee[1]}`} />
          <Kpi label="Selles" value={`${sum.poop}`} target={`${ref.poop[0]}-${ref.poop[1]}`} />
          <Kpi label="Eau" value={`${sum.waterMl} ml`} target={water ? `${water.low}-${water.high}` : '—'} />
          <Kpi label="Croquettes" value={`${sum.foodG} g`} target={food ? `${food.kibbleG} g` : '—'} />
        </View>
        {sum.accidents ? <Pill tone="red">{`${sum.accidents} accident(s)`}</Pill> : null}
      </Card>

      <Button title="Noter une selle détaillée" icon="paw" tone="ghost" onPress={() => router.push('/carnet/selle')} />

      <SectionTitle icon="clock">Chronologie</SectionTitle>
      {items.length === 0 ? <Sub>Rien de noté ce jour-là.</Sub> : null}
      {items.map((it) => (
        <Card key={it.id} tone="flat">
          <Row>
            <Text style={s.time}>{hm(it.ts)}</Text>
            <Icon name={it.icon} size={18} color={it.color} />
            <View style={{ flex: 1 }}>
              <Text style={s.h}>{it.title}</Text>
              {it.detail ? <Text style={s.meta}>{it.detail}</Text> : null}
            </View>
            <Button small tone="ghost" title="Suppr." onPress={it.remove} />
          </Row>
        </Card>
      ))}
      <Sub>L'eau notée est approximative : l'important est de repérer un changement net (il boit 2 fois plus, ou plus du tout).</Sub>
    </ScrollView>
  );
}

function Kpi({ label, value, target }: { label: string; value: string; target: string }) {
  return (
    <View style={s.kpi}>
      <Text style={s.meta}>{label}</Text>
      <Text style={s.kpiValue}>{value}</Text>
      <Text style={s.meta}>repère {target}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, gap: 12, paddingBottom: 40 },
  h: { fontSize: 15, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 12, color: colors.ink3 },
  arrow: { fontSize: 28, fontWeight: '700', color: colors.accent, paddingHorizontal: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpi: { width: '47%', flexGrow: 1, backgroundColor: colors.accentSoft, borderRadius: 14, padding: 10 },
  kpiValue: { fontSize: 20, fontWeight: '900', color: colors.accentDeep },
  time: { fontSize: 13, fontWeight: '800', color: colors.ink2, width: 42 },
});
