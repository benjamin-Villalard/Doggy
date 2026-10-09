import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, Toggle } from '../../components/Form';
import { Button, Card, Pill, Row, SectionTitle, Sub } from '../../components/UI';
import { consistencyScale, stoolColors, stoolFlags } from '../../lib/daily';
import type { StoolColor } from '../../lib/store';
import { useActions } from '../../lib/store';
import { colors, radiusSm } from '../../lib/theme';

const levelFg = { green: colors.green, blue: colors.blue, orange: colors.orange, red: colors.red };
const levelLabel = { green: 'normal', blue: 'à surveiller', orange: 'véto 24-48 h', red: 'véto urgent' };
const levelTone = { green: 'green', blue: 'blue', orange: 'orange', red: 'red' } as const;
const ago = [
  { label: 'Maintenant', min: 0 },
  { label: '-15 min', min: 15 },
  { label: '-30 min', min: 30 },
  { label: '-1 h', min: 60 },
  { label: '-2 h', min: 120 },
];

export default function Selle() {
  const router = useRouter();
  const { addPotty } = useActions();
  const [color, setColor] = useState<StoolColor>('brun');
  const [consistency, setConsistency] = useState(2);
  const [flags, setFlags] = useState<string[]>([]);
  const [accident, setAccident] = useState(false);
  const [minAgo, setMinAgo] = useState(0);
  const [note, setNote] = useState('');
  const info = stoolColors[color];
  const cons = consistencyScale.find((c) => c.score === consistency);

  const save = () => {
    addPotty(accident ? 'accident-caca' : 'caca', {
      ts: new Date(Date.now() - minAgo * 60000).toISOString(),
      color,
      consistency,
      flags: flags.length ? flags : undefined,
      note: note.trim() || undefined,
    });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <SectionTitle icon="eye">Couleur</SectionTitle>
      <Card>
        <View style={s.grid}>
          {(Object.keys(stoolColors) as StoolColor[]).map((k) => {
            const c = stoolColors[k];
            const on = k === color;
            return (
              <Pressable key={k} onPress={() => setColor(k)} style={[s.color, on && { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
                <View style={[s.dot, { backgroundColor: c.swatch }]} />
                <Text style={s.colorText} numberOfLines={2}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Row>
          <Pill tone={levelTone[info.level]}>{levelLabel[info.level]}</Pill>
          <Text style={[s.text, { flex: 1, color: levelFg[info.level] }]}>{info.meaning}</Text>
        </Row>
      </Card>

      <SectionTitle icon="drop">Consistance</SectionTitle>
      <Card>
        {consistencyScale.map((c) => (
          <Pressable key={c.score} onPress={() => setConsistency(c.score)} style={[s.cons, c.score === consistency && s.consOn]}>
            <Text style={[s.score, { color: levelFg[c.level] }]}>{c.score}</Text>
            <Text style={[s.text, { flex: 1 }]}>{c.label}</Text>
          </Pressable>
        ))}
        {cons && cons.level === 'red' ? (
          <Text style={[s.text, { color: colors.red }]}>
            Diarrhée : chez un chiot toy, surveille l'énergie et les gencives. Deux épisodes en 24 h = vétérinaire.
          </Text>
        ) : null}
      </Card>

      <SectionTitle icon="warn">Autres signes</SectionTitle>
      <Card>
        <View style={s.grid}>
          {stoolFlags.map((f) => {
            const on = flags.includes(f.key);
            return (
              <Pressable
                key={f.key}
                onPress={() => setFlags((x) => (on ? x.filter((y) => y !== f.key) : [...x, f.key]))}
                style={[s.flag, on && { backgroundColor: colors.orange, borderColor: colors.orange }]}
              >
                <Text style={[s.flagText, on && { color: '#fff' }]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Toggle label="Accident (à l'intérieur)" value={accident} onChange={setAccident} />
        <View style={s.grid}>
          {ago.map((a) => (
            <Pressable key={a.min} onPress={() => setMinAgo(a.min)} style={[s.flag, minAgo === a.min && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
              <Text style={[s.flagText, minAgo === a.min && { color: '#fff' }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Note" value={note} onChangeText={setNote} placeholder="ex. après changement de croquettes" />
      </Card>

      <Button full title="Enregistrer la selle" icon="check" onPress={save} />
      <Sub>
        Guide indicatif. Garde une photo ou un échantillon frais si tu dois consulter. En cas de doute, appelle ton vétérinaire.
      </Sub>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, gap: 12, paddingBottom: 40 },
  text: { fontSize: 13.5, lineHeight: 19, color: colors.ink2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  color: {
    width: '23%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: radiusSm,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  dot: { width: 28, height: 28, borderRadius: 999, borderWidth: 1, borderColor: '#0002' },
  colorText: { fontSize: 10.5, fontWeight: '700', color: colors.ink2, textAlign: 'center' },
  cons: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: radiusSm },
  consOn: { backgroundColor: colors.accentSoft },
  score: { fontSize: 18, fontWeight: '900', width: 20, textAlign: 'center' },
  flag: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: colors.line },
  flagText: { fontSize: 12.5, fontWeight: '700', color: colors.ink2 },
});
