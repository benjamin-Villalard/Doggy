import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Pill, Row, Sub } from '../../components/UI';
import { tutorialByCode } from '../../lib/content';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function Seances() {
  const { state } = useStore();
  const router = useRouter();

  const byDay = state.sessions.reduce<Record<string, typeof state.sessions>>((acc, s) => {
    const d = s.ts.slice(0, 10);
    acc[d] = [...(acc[d] ?? []), s];
    return acc;
  }, {});

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      {Object.entries(byDay).map(([day, list]) => {
        const ok = list.reduce((a, b) => a + b.ok, 0);
        const attempts = list.reduce((a, b) => a + b.ok + b.ko, 0);
        return (
          <Card key={day}>
            <Row>
              <Text style={s.h}>{new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' })}</Text>
              <Pill tone={attempts && ok / attempts >= 0.8 ? 'green' : 'orange'}>
                {list.length} séances · {attempts ? Math.round((ok / attempts) * 100) : 0}%
              </Pill>
            </Row>
            {list.map((se) => (
              <Row key={se.id} style={{ paddingVertical: 3 }}>
                <Text style={s.link} onPress={() => router.push(`/tutos/${se.code}`)}>
                  {se.code} · {tutorialByCode(se.code)?.title ?? ''}
                </Text>
                <Text style={s.meta}>
                  {se.ok}/{se.ok + se.ko}
                </Text>
              </Row>
            ))}
            {list.some((x) => x.note) ? (
              <View style={{ gap: 2 }}>
                {list
                  .filter((x) => x.note)
                  .map((x) => (
                    <Text key={`n${x.id}`} style={s.note}>
                      « {x.note} »
                    </Text>
                  ))}
              </View>
            ) : null}
          </Card>
        );
      })}
      {state.sessions.length === 0 ? (
        <Sub>Aucune séance enregistrée : lance le minuteur depuis un tutoriel pour commencer.</Sub>
      ) : null}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 10, paddingBottom: 40 },
  h: { fontSize: 14.5, fontWeight: '700', color: colors.ink, flex: 1, textTransform: 'capitalize' },
  link: { flex: 1, fontSize: 13, color: colors.accent, fontWeight: '600' },
  meta: { fontSize: 12.5, color: colors.ink3 },
  note: { fontSize: 12, color: colors.ink3, fontStyle: 'italic' },
});
