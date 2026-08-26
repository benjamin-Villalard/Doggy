import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/Icon';
import { Field } from '../../components/Form';
import { Button, Card, Pill, Row, SectionTitle, Sub } from '../../components/UI';
import { addMonths, frDate, health, nextDeworming, vaccinePlan, type PlanStatus } from '../../lib/health';
import { ageInWeeks, useActions, useStore } from '../../lib/store';
import { colors, type } from '../../lib/theme';
import { useVoice } from '../../lib/voice';

const today = () => new Date().toISOString().slice(0, 10);

const statusTone: Record<PlanStatus, { label: string; tone: 'green' | 'red' | 'orange' | 'grey' }> = {
  fait: { label: 'fait', tone: 'green' },
  retard: { label: 'en retard', tone: 'red' },
  bientot: { label: 'bientôt', tone: 'orange' },
  aVenir: { label: 'à venir', tone: 'grey' },
  inconnu: { label: 'date inconnue', tone: 'grey' },
};

export default function Vaccins() {
  const { state } = useStore();
  const { addHealthEntry, removeHealthEntry } = useActions();
  const voice = useVoice();
  const plan = vaccinePlan(state.profile, state.health);
  const worm = nextDeworming(state.profile, state.health);
  const [wormDate, setWormDate] = useState(today());
  const [wormLabel, setWormLabel] = useState('Vermifuge');
  const [antiDate, setAntiDate] = useState(today());
  const [antiLabel, setAntiLabel] = useState('Antiparasitaire externe');

  const weeks = ageInWeeks(state.profile.birthdate);
  const wormEvery = weeks === null || weeks < 26 ? 1 : 3;
  const wormEntries = state.health.entries.filter((e) => e.kind === 'vermifuge');
  const antiEntries = state.health.entries.filter((e) => e.kind === 'antiparasitaire');

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Card tone="flat">
        <Sub>{health.disclaimer}</Sub>
      </Card>

      <SectionTitle icon="syringe">Protocole vaccinal</SectionTitle>
      {plan.map((p) => {
        const st = statusTone[p.status];
        return (
          <Card key={p.vaccine.code}>
            <Row>
              <View style={{ flex: 1 }}>
                <Text style={s.h}>
                  {p.vaccine.label} {p.vaccine.optional ? '(selon exposition)' : ''}
                </Text>
                <Text style={s.meta}>
                  {p.vaccine.valences} · {p.vaccine.weeks} semaines
                  {p.due ? ` → ${frDate(p.due)}` : ''}
                </Text>
              </View>
              <Pill tone={st.tone}>{st.label}</Pill>
            </Row>
            <Sub>{p.vaccine.note}</Sub>
            {p.status === 'fait' ? (
              <Row>
                <Text style={s.done}>Injecté le {frDate(p.doneDate as string)}</Text>
                <Button
                  small
                  tone="ghost"
                  title="Annuler"
                  onPress={() => {
                    const e = state.health.entries.find((x) => x.kind === 'vaccin' && x.ref === p.vaccine.code);
                    if (e) removeHealthEntry(e.id);
                  }}
                />
              </Row>
            ) : (
              <Button
                small
                title="Marquer comme fait aujourd'hui"
                onPress={() =>
                  addHealthEntry({
                    date: today(),
                    kind: 'vaccin',
                    label: p.vaccine.label,
                    ref: p.vaccine.code,
                    nextDate: null,
                  })
                }
              />
            )}
          </Card>
        );
      })}

      <Card style={{ backgroundColor: colors.blueSoft }}>
        <Row>
          <Icon name="shield" size={17} color={colors.blue} />
          <Text style={[s.h, { color: colors.blue }]}>Les règles à connaître</Text>
        </Row>
        {health.vaccineRules.map((r) => (
          <Text key={r} style={s.bullet}>
            • {r}
          </Text>
        ))}
      </Card>

      <SectionTitle icon="pill">Vermifuges</SectionTitle>
      <Card>
        <Row>
          <View style={{ flex: 1 }}>
            <Text style={s.h}>Prochaine échéance</Text>
            <Text style={s.meta}>
              {worm.due ? frDate(worm.due) : 'renseigne la date de naissance'}
              {worm.last ? ` · dernier le ${frDate(worm.last)}` : ' · aucun enregistré'}
            </Text>
          </View>
          <Pill tone={worm.due ? 'accent' : 'grey'}>{worm.last ? 'suivi' : 'à faire'}</Pill>
        </Row>
        <Sub>
          Rythme ESSCAP : tous les mois jusqu'à 6 mois, puis tous les 3 mois. Pèse {voice.name} avant chaque
          administration : la dose d'un chien toy se calcule au gramme près.
        </Sub>
        <Field label="Date" value={wormDate} onChangeText={setWormDate} placeholder="AAAA-MM-JJ" />
        <Field label="Produit / note" value={wormLabel} onChangeText={setWormLabel} />
        <Button
          small
          title="Enregistrer le vermifuge"
          onPress={() =>
            addHealthEntry({
              date: wormDate,
              kind: 'vermifuge',
              label: wormLabel || 'Vermifuge',
              nextDate: addMonths(wormDate, wormEvery),
            })
          }
        />
        {wormEntries.map((e) => (
          <Row key={e.id}>
            <Text style={s.line}>
              {frDate(e.date)} · {e.label}
            </Text>
            <Button small tone="ghost" title="Suppr." onPress={() => removeHealthEntry(e.id)} />
          </Row>
        ))}
      </Card>

      <SectionTitle icon="paw">Étapes de vermifugation</SectionTitle>
      <Card>
        {health.deworming.map((d) => (
          <View key={d.code} style={s.step}>
            <Text style={s.h}>{d.label}</Text>
            <Text style={s.meta}>{d.note}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle icon="bolt">Antiparasitaires externes</SectionTitle>
      <Card>
        <Sub>
          Puces, tiques, aoûtats : produit vétérinaire adapté au poids exact et à l'âge. Jamais de pipette « chat » ni de
          produit à base de perméthrine mal dosé sur un chien de 1 kg.
        </Sub>
        <Field label="Date" value={antiDate} onChangeText={setAntiDate} placeholder="AAAA-MM-JJ" />
        <Field label="Produit" value={antiLabel} onChangeText={setAntiLabel} />
        <Button
          small
          title="Enregistrer l'antiparasitaire"
          onPress={() =>
            addHealthEntry({
              date: antiDate,
              kind: 'antiparasitaire',
              label: antiLabel || 'Antiparasitaire',
              nextDate: addMonths(antiDate, 1),
            })
          }
        />
        {antiEntries.map((e) => (
          <Row key={e.id}>
            <Text style={s.line}>
              {frDate(e.date)} · {e.label}
              {e.nextDate ? ` → renouveler ${frDate(e.nextDate)}` : ''}
            </Text>
            <Button small tone="ghost" title="Suppr." onPress={() => removeHealthEntry(e.id)} />
          </Row>
        ))}
      </Card>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 10, paddingBottom: 40 },
  h: { fontSize: 14.5, fontWeight: '700', color: colors.ink, flex: 1 },
  meta: { ...type.small, color: colors.ink3 },
  bullet: { fontSize: 13, fontWeight: '600', color: colors.ink2, lineHeight: 19 },
  line: { ...type.small, color: colors.ink2, flex: 1 },
  done: { ...type.small, color: colors.green, flex: 1 },
  step: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.line },
});
