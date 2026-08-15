import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';
import { Button, Card, Pill, Row, Sub } from '../../components/UI';
import { expectedWeightRange } from '../../lib/coach';
import { ageInWeeks, today, useActions, useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function Poids() {
  const { state } = useStore();
  const { addWeight, removeWeight } = useActions();
  const [date, setDate] = useState(today());
  const [grams, setGrams] = useState('');

  const weeks = ageInWeeks(state.profile.birthdate) ?? 8;
  const [lo, hi] = expectedWeightRange(weeks);
  const data = state.weights;
  const last = data[data.length - 1];
  const prev = data[data.length - 2];

  const W = 300;
  const H = 130;
  const values = data.map((d) => d.grams);
  const maxY = Math.max(hi, ...values, 1000) * 1.1;
  const points = data
    .map((d, i) => {
      const x = data.length === 1 ? W / 2 : (i / (data.length - 1)) * (W - 20) + 10;
      const y = H - (d.grams / maxY) * (H - 12) - 6;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Card>
        <Row>
          <Text style={s.h}>Dernière pesée</Text>
          {last ? (
            <Pill tone={last.grams >= lo && last.grams <= hi ? 'green' : 'orange'}>
              {last.grams} g
            </Pill>
          ) : (
            <Pill tone="grey">—</Pill>
          )}
        </Row>
        <Sub>
          Fourchette indicative pour un Yorkshire standard à {weeks} semaines : {lo}–{hi} g. Une courbe qui stagne ou
          chute = vétérinaire (risque d'hypoglycémie chez un toy).
        </Sub>
        {prev && last ? (
          <Sub>
            Évolution depuis la pesée précédente : {last.grams - prev.grams >= 0 ? '+' : ''}
            {last.grams - prev.grams} g.
          </Sub>
        ) : null}
        {data.length > 0 ? (
          <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
            <Rect
              x={0}
              y={H - (hi / maxY) * (H - 12) - 6}
              width={W}
              height={Math.max(2, ((hi - lo) / maxY) * (H - 12))}
              fill={colors.greenSoft}
            />
            <Line x1={0} y1={H - 6} x2={W} y2={H - 6} stroke={colors.line} strokeWidth={1} />
            <Polyline points={points} fill="none" stroke={colors.accent} strokeWidth={2.5} />
            {data.map((d, i) => {
              const x = data.length === 1 ? W / 2 : (i / (data.length - 1)) * (W - 20) + 10;
              const y = H - (d.grams / maxY) * (H - 12) - 6;
              return <Circle key={d.id} cx={x} cy={y} r={3.5} fill={colors.accent} />;
            })}
          </Svg>
        ) : null}
      </Card>

      <Card>
        <Text style={s.h}>Ajouter une pesée</Text>
        <Row>
          <TextInput
            style={[s.input, { flex: 1.2, minWidth: 0 }]}
            value={date}
            onChangeText={setDate}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor={colors.ink3}
          />
          <TextInput
            style={[s.input, { flex: 1, minWidth: 0 }]}
            value={grams}
            onChangeText={setGrams}
            placeholder="grammes"
            placeholderTextColor={colors.ink3}
            keyboardType="number-pad"
          />
        </Row>
        <Button
          small
          title="Enregistrer"
          disabled={!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number(grams)}
          onPress={() => {
            addWeight(date, Number(grams));
            setGrams('');
          }}
        />
      </Card>

      <Card>
        <Text style={s.h}>Historique</Text>
        {[...data].reverse().map((w) => (
          <Row key={w.id} style={{ paddingVertical: 3 }}>
            <Text style={[s.meta, { flex: 1 }]}>
              {w.date} · {w.grams} g
            </Text>
            <Pressable onPress={() => removeWeight(w.id)} hitSlop={8}>
              <Text style={s.del}>supprimer</Text>
            </Pressable>
          </Row>
        ))}
        {data.length === 0 ? <Sub>Pèse-le une fois par semaine jusqu'à 6 mois, puis une fois par mois.</Sub> : null}
      </Card>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 10, paddingBottom: 40 },
  h: { fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 },
  meta: { fontSize: 13, color: colors.ink2 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#fff',
    color: colors.ink,
  },
  del: { fontSize: 11.5, color: colors.red },
});
