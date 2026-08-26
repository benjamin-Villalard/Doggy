import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ListRow } from '../../components/Form';
import Icon from '../../components/Icon';
import { Button, Card, Chip, Empty, Pill, Row, SectionTitle, Sub } from '../../components/UI';
import { health, urgencyTone, type Urgency } from '../../lib/health';
import { useActions, useStore } from '../../lib/store';
import { colors, type } from '../../lib/theme';
import { useVoice } from '../../lib/voice';

const order: Urgency[] = ['urgent', 'rapide', 'surveiller'];

export default function Signes() {
  const { state } = useStore();
  const { addSymptom, removeSymptom } = useActions();
  const voice = useVoice();
  const [filter, setFilter] = useState<Urgency | 'tous'>('tous');

  const signs = health.signs
    .filter((x) => filter === 'tous' || x.urgency === filter)
    .sort((a, b) => order.indexOf(a.urgency) - order.indexOf(b.urgency));

  const signTitle = (code: string) => health.signs.find((x) => x.code === code)?.title ?? code;

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Card>
        <Row>
          <Icon name="pulse" size={18} color={colors.coral} />
          <Text style={s.h}>Quand faut-il s'inquiéter ?</Text>
        </Row>
        <Sub>
          Note un signe dès que tu l'observes chez {voice.name} : l'historique daté est exactement ce que le vétérinaire
          te demandera au téléphone.
        </Sub>
        <Row style={{ flexWrap: 'wrap' }}>
          <Chip label="Tous" active={filter === 'tous'} onPress={() => setFilter('tous')} />
          {order.map((u) => (
            <Chip key={u} label={urgencyTone[u].label} active={filter === u} onPress={() => setFilter(u)} />
          ))}
        </Row>
      </Card>

      {signs.map((x) => {
        const t = urgencyTone[x.urgency];
        return (
          <Card key={x.code}>
            <Row>
              <View style={{ flex: 1 }}>
                <Text style={s.h}>{x.title}</Text>
              </View>
              <Pill tone={t.tone}>{t.label}</Pill>
            </Row>
            <Text style={s.why}>{x.why}</Text>
            <Button small tone="ghost" title="Je l'observe aujourd'hui" onPress={() => addSymptom(x.code)} />
          </Card>
        );
      })}

      <SectionTitle icon="calendar">Signes notés ({state.health.symptoms.length})</SectionTitle>
      <Card>
        {state.health.symptoms.length === 0 ? (
          <Empty icon="pulse" text="Aucun signe noté. C'est la meilleure des nouvelles." />
        ) : (
          state.health.symptoms.map((sy) => (
            <ListRow
              key={sy.id}
              icon="pulse"
              tone={colors.coral}
              title={signTitle(sy.code)}
              sub={new Date(sy.ts).toLocaleString('fr-FR')}
              onRemove={() => removeSymptom(sy.id)}
            />
          ))
        )}
      </Card>

      <Card tone="flat">
        <Sub>{health.disclaimer}</Sub>
      </Card>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 10, paddingBottom: 40 },
  h: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  why: { ...type.small, color: colors.ink2, lineHeight: 18 },
});
