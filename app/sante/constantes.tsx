import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field } from '../../components/Form';
import Icon from '../../components/Icon';
import Rich from '../../components/Rich';
import { Button, Card, Empty, Pill, Row, SectionTitle, Sub } from '../../components/UI';
import { clinical, painAdvice, painTotal, vitalsForAge } from '../../lib/clinical';
import { ageInWeeks, lastWeightG, useActions, useStore } from '../../lib/store';
import { colors, radiusSm, type } from '../../lib/theme';

const num = (v: string): number | null => {
  const n = Number(v.replace(',', '.'));
  return v.trim() && isFinite(n) ? n : null;
};

export default function Constantes() {
  const { state } = useStore();
  const { addVital, removeVital } = useActions();
  const weeks = ageInWeeks(state.profile.birthdate);
  const ref = vitalsForAge(weeks);
  const stored = lastWeightG(state.weights);

  const [temp, setTemp] = useState('');
  const [hr, setHr] = useState('');
  const [rr, setRr] = useState('');
  const [crt, setCrt] = useState('');
  const [gly, setGly] = useState('');
  const [mucosa, setMucosa] = useState('');
  const [context, setContext] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const total = useMemo(() => painTotal(answers), [answers]);
  const answered = Object.keys(answers).length;
  const advice = painAdvice(total);

  const flags: string[] = [];
  const t = num(temp);
  const h = num(hr);
  const r = num(rr);
  const c = num(crt);
  const g = num(gly);
  if (t !== null && t < 37.5) flags.push('Hypothermie : réchauffer progressivement, contrôler la glycémie.');
  if (t !== null && t > 39.5) flags.push('Hyperthermie ou fièvre : distinguer les deux, refroidir si > 40,5 °C.');
  if (h !== null && weeks !== null && weeks < 12 && h < 120) flags.push('Bradycardie relative chez un chiot : signe de gravité.');
  if (h !== null && h > 180) flags.push('Tachycardie marquée : douleur, hypovolémie, toxique, arythmie.');
  if (r !== null && r > 40) flags.push('Tachypnée de repos : évaluer cardio-respiratoire.');
  if (c !== null && c > 2) flags.push('TRC > 2 s : hypoperfusion, rechercher un choc.');
  if (g !== null && g < 0.6) flags.push('Hypoglycémie : protocole P02 immédiat.');

  const save = () => {
    addVital({
      weightG: stored,
      temp: t,
      hr: h,
      rr: r,
      crt: c,
      glycemia: g,
      mucosa,
      pain: answered >= 4 ? total : null,
      context,
      note: note.trim() || undefined,
    });
    setSaved(true);
    setTemp('');
    setHr('');
    setRr('');
    setCrt('');
    setGly('');
    setMucosa('');
    setContext('');
    setNote('');
    setAnswers({});
  };

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Constantes & douleur' }} />

      <SectionTitle icon="pulse">Valeurs de référence</SectionTitle>
      <Card>
        <Row>
          <Metric label="FC attendue" value={ref.hr} />
          <Metric label="FR attendue" value={ref.rr} />
        </Row>
        {clinical.vitals.map((v) => (
          <View key={v.label} style={s.vital}>
            <Row>
              <Icon name={v.icon} size={16} color={colors.accent} />
              <Text style={s.vLabel}>{v.label}</Text>
              <Pill tone="accent">{v.range}</Pill>
            </Row>
            <Rich text={v.note} />
          </View>
        ))}
      </Card>

      <SectionTitle icon="stethoscope">Relevé d'examen</SectionTitle>
      <Card>
        <Row>
          <View style={{ flex: 1 }}>
            <Field label="T° (°C)" value={temp} onChangeText={setTemp} keyboardType="numeric" placeholder="38.6" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="FC (/min)" value={hr} onChangeText={setHr} keyboardType="numeric" placeholder="140" />
          </View>
        </Row>
        <Row>
          <View style={{ flex: 1 }}>
            <Field label="FR (/min)" value={rr} onChangeText={setRr} keyboardType="numeric" placeholder="24" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="TRC (s)" value={crt} onChangeText={setCrt} keyboardType="numeric" placeholder="1.5" />
          </View>
        </Row>
        <Field
          label="Glycémie (g/L)"
          value={gly}
          onChangeText={setGly}
          keyboardType="numeric"
          placeholder="0.95"
          hint="Convertir : g/L × 5,55 = mmol/L."
        />
        <Field label="Muqueuses" value={mucosa} onChangeText={setMucosa} placeholder="rose, TRC normal" />
        <Field label="Contexte" value={context} onChangeText={setContext} placeholder="chute, vomissements, post-op…" />
        <Field label="Note" value={note} onChangeText={setNote} multiline placeholder="Examen, conduite tenue, appel au véto…" />

        {flags.length > 0 ? (
          <View style={[s.block, { backgroundColor: colors.redSoft }]}>
            <Text style={[s.label, { color: colors.red }]}>Valeurs hors normes</Text>
            {flags.map((f) => (
              <Row key={f} style={{ alignItems: 'flex-start' }}>
                <Icon name="warn" size={14} color={colors.red} />
                <Text style={s.meta}>{f}</Text>
              </Row>
            ))}
          </View>
        ) : null}

        <Button
          title="Enregistrer le relevé"
          icon="check"
          onPress={save}
          disabled={t === null && h === null && r === null && g === null && !mucosa}
        />
        {saved ? <Sub>Relevé ajouté à l'historique clinique.</Sub> : null}
        <Sub>
          Poids associé : {stored ? `${(stored / 1000).toFixed(2)} kg` : 'aucun poids enregistré'}. Les relevés restent
          sur l'appareil.
        </Sub>
      </Card>

      <SectionTitle icon="warn">{clinical.pain.name}</SectionTitle>
      <Card>
        <Sub>{clinical.pain.note}</Sub>
        {clinical.pain.items.map((item) => (
          <View key={item.category} style={{ gap: 6, marginTop: 8 }}>
            <Text style={s.label}>{item.category}</Text>
            <View style={s.wrapRow}>
              {item.options.map((o) => {
                const on = answers[item.category] === o.score && answers[item.category] !== undefined;
                return (
                  <Pressable
                    key={o.label}
                    onPress={() => setAnswers((a) => ({ ...a, [item.category]: o.score }))}
                    style={[s.opt, on && s.optOn]}
                  >
                    <Text style={[s.optText, on && { color: '#fff' }]}>
                      {o.label} · {o.score}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <View
          style={[
            s.score,
            {
              backgroundColor:
                advice.tone === 'red' ? colors.redSoft : advice.tone === 'orange' ? colors.amberSoft : colors.greenSoft,
            },
          ]}
        >
          <Text style={s.scoreValue}>
            {total}/24
            {answered < clinical.pain.items.length ? ` · ${answered}/${clinical.pain.items.length} items` : ''}
          </Text>
          <Text style={s.scoreText}>{advice.text}</Text>
        </View>
        <Button small tone="ghost" title="Réinitialiser le score" onPress={() => setAnswers({})} />
      </Card>

      <SectionTitle icon="chart">Historique clinique</SectionTitle>
      {state.health.vitals.length === 0 ? (
        <Empty text="Aucun relevé enregistré pour l'instant." icon="pulse" />
      ) : (
        state.health.vitals.map((v) => (
          <Card key={v.id} tone="flat">
            <Row>
              <Text style={s.vLabel}>{new Date(v.ts).toLocaleString('fr-FR')}</Text>
              <Pressable onPress={() => removeVital(v.id)} hitSlop={8}>
                <Icon name="cross" size={15} color={colors.ink3} />
              </Pressable>
            </Row>
            <Row style={{ flexWrap: 'wrap' }}>
              {v.temp !== null ? <Pill tone="accent">{v.temp} °C</Pill> : null}
              {v.hr !== null ? <Pill tone="coral">FC {v.hr}</Pill> : null}
              {v.rr !== null ? <Pill tone="blue">FR {v.rr}</Pill> : null}
              {v.crt !== null ? <Pill tone="grey">TRC {v.crt} s</Pill> : null}
              {v.glycemia !== null ? <Pill tone="orange">{v.glycemia} g/L</Pill> : null}
              {v.pain !== null ? <Pill tone={v.pain >= 6 ? 'red' : 'green'}>Douleur {v.pain}/24</Pill> : null}
              {v.weightG ? <Pill tone="grey">{(v.weightG / 1000).toFixed(2)} kg</Pill> : null}
            </Row>
            {v.mucosa ? <Text style={s.meta}>Muqueuses : {v.mucosa}</Text> : null}
            {v.context ? <Text style={s.meta}>Contexte : {v.context}</Text> : null}
            {v.note ? <Text style={s.meta}>{v.note}</Text> : null}
          </Card>
        ))
      )}
      <View style={{ height: 26 }} />
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metric}>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={s.metricValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 11, paddingBottom: 40 },
  label: { fontSize: 12.5, fontWeight: '800', color: colors.ink2 },
  meta: { ...type.small, color: colors.ink3, flex: 1 },
  vital: { gap: 3, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  vLabel: { fontSize: 13.5, fontWeight: '700', color: colors.ink, flex: 1 },
  block: { borderRadius: radiusSm, padding: 11, gap: 3, marginTop: 6 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  opt: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#f6f4fb',
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  optOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  optText: { fontSize: 12, fontWeight: '700', color: colors.ink2 },
  score: { borderRadius: radiusSm, padding: 12, gap: 3, marginTop: 10 },
  scoreValue: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  scoreText: { fontSize: 13, fontWeight: '700', color: colors.ink2 },
  metric: { flex: 1, backgroundColor: colors.accentSoft, borderRadius: radiusSm, padding: 11, gap: 2 },
  metricLabel: { ...type.micro, color: colors.accent, fontWeight: '800' },
  metricValue: { fontSize: 13.5, fontWeight: '800', color: colors.ink },
});
