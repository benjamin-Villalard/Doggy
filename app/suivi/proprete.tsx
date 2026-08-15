import { Link } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/Icon';
import { Button, Card, Pill, Row, Sub } from '../../components/UI';
import { accidentHotHours, daysWithoutAccident, useActions, useStore, type PottyEntry } from '../../lib/store';
import { colors } from '../../lib/theme';

const label: Record<string, string> = {
  pipi: 'Pipi dehors',
  caca: 'Caca dehors',
  'accident-pipi': 'Accident pipi',
  'accident-caca': 'Accident caca',
};

export default function Proprete() {
  const { state } = useStore();
  const { addPotty, removePotty } = useActions();
  const hot = accidentHotHours(state.potty);

  const days = Array.from({ length: 14 }, (_, k) => {
    const d = new Date(Date.now() - k * 86400000).toISOString().slice(0, 10);
    const entries = state.potty.filter((p) => p.ts.slice(0, 10) === d);
    return {
      date: d,
      ok: entries.filter((e) => !e.kind.startsWith('accident')).length,
      ko: entries.filter((e) => e.kind.startsWith('accident')).length,
    };
  });

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Card>
        <Row style={{ flexWrap: 'wrap' }}>
          <View style={{ flex: 1 }}>
            <Button small tone="green" title="+ Pipi" onPress={() => addPotty('pipi')} />
          </View>
          <View style={{ flex: 1 }}>
            <Button small tone="green" title="+ Caca" onPress={() => addPotty('caca')} />
          </View>
          <View style={{ flex: 1 }}>
            <Button small tone="red" title="+ Acc. pipi" onPress={() => addPotty('accident-pipi')} />
          </View>
          <View style={{ flex: 1 }}>
            <Button small tone="red" title="+ Acc. caca" onPress={() => addPotty('accident-caca')} />
          </View>
        </Row>
        <Row>
          <Pill tone="green">{daysWithoutAccident(state.potty)} j sans accident</Pill>
          <Pill tone="grey">objectif : 7 j consécutifs</Pill>
        </Row>
      </Card>

      {hot.length > 0 ? (
        <Card style={{ backgroundColor: colors.orangeSoft, borderColor: colors.orange }}>
          <Row>
            <Icon name="clock" size={18} color={colors.orange} />
            <Text style={[s.h, { color: colors.orange }]}>Créneaux à risque</Text>
          </Row>
          {hot.map((h) => (
            <Text key={h.hour} style={s.meta}>
              {h.hour}h → {h.count} accidents : ajoute une sortie 20 min avant.
            </Text>
          ))}
          <Link href="/aleas/A01" style={s.link}>
            Fiche A01 · accidents persistants →
          </Link>
        </Card>
      ) : null}

      <Card>
        <Text style={s.h}>14 derniers jours</Text>
        {days.map((d) => (
          <Row key={d.date} style={{ paddingVertical: 3 }}>
            <Text style={s.day}>{d.date.slice(5)}</Text>
            <View style={{ flexDirection: 'row', gap: 3, flex: 1, flexWrap: 'wrap' }}>
              {Array.from({ length: d.ok }).map((_, i) => (
                <View key={`ok${i}`} style={[s.dot, { backgroundColor: colors.green }]} />
              ))}
              {Array.from({ length: d.ko }).map((_, i) => (
                <View key={`ko${i}`} style={[s.dot, { backgroundColor: colors.red }]} />
              ))}
              {d.ok + d.ko === 0 ? <Text style={s.meta}>—</Text> : null}
            </View>
            <Text style={s.meta}>
              {d.ok} / {d.ko}
            </Text>
          </Row>
        ))}
        <Sub>Vert = réussite dehors · Rouge = accident. 3 accidents à la même heure = une sortie manquante.</Sub>
      </Card>

      <Card>
        <Text style={s.h}>Dernières entrées</Text>
        {state.potty.slice(0, 25).map((p: PottyEntry) => (
          <Row key={p.id} style={{ paddingVertical: 3 }}>
            <Text style={[s.meta, { flex: 1 }]}>
              {new Date(p.ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {label[p.kind]}
            </Text>
            <Pressable onPress={() => removePotty(p.id)} hitSlop={8}>
              <Text style={s.del}>supprimer</Text>
            </Pressable>
          </Row>
        ))}
        {state.potty.length === 0 ? <Sub>Aucune entrée pour le moment.</Sub> : null}
      </Card>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 10, paddingBottom: 40 },
  h: { fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 },
  meta: { fontSize: 12.5, color: colors.ink3 },
  day: { fontSize: 12, color: colors.ink2, width: 44, fontWeight: '600' },
  dot: { width: 9, height: 9, borderRadius: 5 },
  link: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  del: { fontSize: 11.5, color: colors.red },
});
