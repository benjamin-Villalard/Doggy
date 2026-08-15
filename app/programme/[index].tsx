import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import Blocks from '../../components/Blocks';
import Icon from '../../components/Icon';
import { Card, Pill, Row, Title } from '../../components/UI';
import { phaseRanges, phaseTutorials, phases, tutorialByCode } from '../../lib/content';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function PhaseDetail() {
  const { index } = useLocalSearchParams<{ index: string }>();
  const i = Number(index);
  const phase = phases[i];
  const router = useRouter();
  const { state } = useStore();

  if (!phase) return <Text style={s.wrap}>Phase introuvable.</Text>;
  const codes = phaseTutorials[phaseRanges[i].title] ?? [];

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Stack.Screen options={{ title: phaseRanges[i].title }} />
      <Title icon={phase.icon}>{phase.title}</Title>

      <Card>
        <Row>
          <Icon name="clicker" size={20} />
          <Text style={s.h}>Tutoriels de la phase</Text>
        </Row>
        {codes.map((code) => {
          const t = tutorialByCode(code);
          if (!t) return null;
          const score = state.skills[code] ?? 0;
          return (
            <Row key={code} style={{ paddingVertical: 4 }}>
              <Icon name={t.icon} size={18} />
              <Text style={s.link} onPress={() => router.push(`/tutos/${code}`)}>
                {code} · {t.title}
              </Text>
              <Pill tone={score >= 4 ? 'green' : score >= 2 ? 'orange' : 'grey'}>{score}/5</Pill>
            </Row>
          );
        })}
      </Card>

      <Blocks blocks={phase.blocks} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 12, paddingBottom: 50 },
  h: { fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 },
  link: { flex: 1, fontSize: 13.5, color: colors.accent, fontWeight: '600' },
});
