import React, { useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, ListRow, Segmented } from '../../components/Form';
import Icon from '../../components/Icon';
import { Button, Card, Chip, Empty, Pill, Row, SectionTitle, Sub } from '../../components/UI';
import { frDate, health } from '../../lib/health';
import { formatWeight, useActions, useStore, type HealthKind } from '../../lib/store';
import { colors, type } from '../../lib/theme';
import { useVoice } from '../../lib/voice';

const today = () => new Date().toISOString().slice(0, 10);

const kinds: { value: HealthKind; label: string; icon: string }[] = [
  { value: 'visite', label: 'Visite', icon: 'vet' },
  { value: 'vaccin', label: 'Vaccin', icon: 'syringe' },
  { value: 'vermifuge', label: 'Vermifuge', icon: 'pill' },
  { value: 'antiparasitaire', label: 'Antiparasitaire', icon: 'bolt' },
  { value: 'traitement', label: 'Traitement', icon: 'pill' },
  { value: 'soin', label: 'Soin / toilettage', icon: 'brush' },
  { value: 'autre', label: 'Autre', icon: 'paw' },
];

export default function Carnet() {
  const { state } = useStore();
  const { setHealth, addHealthEntry, removeHealthEntry } = useActions();
  const voice = useVoice();
  const [kind, setKind] = useState<HealthKind>('visite');
  const [date, setDate] = useState(today());
  const [label, setLabel] = useState('');
  const [next, setNext] = useState('');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState<HealthKind | 'tous'>('tous');

  const entries = state.health.entries.filter((e) => filter === 'tous' || e.kind === filter);
  const weights = [...state.weights].slice(-6).reverse();

  const call = (phone: string) => {
    const n = phone.replace(/\s/g, '');
    if (!n) return;
    if (Platform.OS === 'web') window.open(`tel:${n}`);
    else Linking.openURL(`tel:${n}`);
  };

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <SectionTitle icon="phone">Mes contacts vétérinaires</SectionTitle>
      <Card>
        <Field label="Vétérinaire" value={state.health.vetName} onChangeText={(v) => setHealth({ vetName: v })} placeholder="Clinique du centre" />
        <Field
          label="Téléphone"
          value={state.health.vetPhone}
          onChangeText={(v) => setHealth({ vetPhone: v })}
          placeholder="01 23 45 67 89"
          keyboardType="phone-pad"
        />
        <Field
          label="Urgences / véto de garde"
          value={state.health.emergencyName}
          onChangeText={(v) => setHealth({ emergencyName: v })}
          placeholder="Clinique de garde 24/7"
        />
        <Field
          label="Téléphone urgences"
          value={state.health.emergencyPhone}
          onChangeText={(v) => setHealth({ emergencyPhone: v })}
          placeholder="01 23 45 67 89"
          keyboardType="phone-pad"
        />
        <Field
          label="Clinique de référence (imagerie, chirurgie)"
          value={state.health.clinicPhone}
          onChangeText={(v) => setHealth({ clinicPhone: v })}
          placeholder="01 23 45 67 89"
          keyboardType="phone-pad"
          hint="Structure vers laquelle tu réfères en cas de plateau technique nécessaire."
        />
        <Field
          label="Centre antipoison vétérinaire"
          value={state.health.poisonPhone}
          onChangeText={(v) => setHealth({ poisonPhone: v })}
          placeholder="Numéro du CAPAE / centre le plus proche"
          keyboardType="phone-pad"
          hint="À appeler avant toute décontamination : la conduite dépend de la molécule."
        />
        <Row>
          {state.health.vetPhone ? (
            <View style={{ flex: 1 }}>
              <Button small tone="accent" title="Appeler le véto" onPress={() => call(state.health.vetPhone)} />
            </View>
          ) : null}
          {state.health.emergencyPhone ? (
            <View style={{ flex: 1 }}>
              <Button small tone="red" title="Appeler les urgences" onPress={() => call(state.health.emergencyPhone)} />
            </View>
          ) : null}
        </Row>
      </Card>

      <SectionTitle icon="book">Identité de {voice.name}</SectionTitle>
      <Card>
        <Field label="Numéro de puce / tatouage" value={state.health.chip} onChangeText={(v) => setHealth({ chip: v })} placeholder="250 26..." />
        <Field label="Assurance santé" value={state.health.insurance} onChangeText={(v) => setHealth({ insurance: v })} placeholder="Contrat, n° de police" />
        <Field
          label="Allergies, intolérances, antécédents"
          value={state.health.allergies}
          onChangeText={(v) => setHealth({ allergies: v })}
          placeholder="ex. réaction au poulet, souffle cardiaque léger"
          multiline
        />
        <Sub>Ces informations restent sur ton téléphone : rien n'est envoyé sur Internet.</Sub>
      </Card>

      <SectionTitle icon="calendar">Ajouter un acte</SectionTitle>
      <Card>
        <Segmented
          label="Type"
          value={kind}
          options={kinds.slice(0, 4).map((k) => ({ value: k.value, label: k.label }))}
          onChange={(v) => setKind(v)}
        />
        <Segmented
          value={kind}
          options={kinds.slice(4).map((k) => ({ value: k.value, label: k.label }))}
          onChange={(v) => setKind(v)}
        />
        <Field label="Date" value={date} onChangeText={setDate} placeholder="AAAA-MM-JJ" />
        <Field label="Intitulé" value={label} onChangeText={setLabel} placeholder="ex. visite de contrôle, antibiotique 7 j" />
        <Field label="À renouveler le (optionnel)" value={next} onChangeText={setNext} placeholder="AAAA-MM-JJ" hint="Une alerte apparaîtra sur la page Santé 15 jours avant." />
        <Field label="Note" value={note} onChangeText={setNote} placeholder="poids du jour, remarques du véto…" multiline />
        <Button
          title="Enregistrer dans le carnet"
          disabled={!label.trim()}
          onPress={() => {
            addHealthEntry({
              date: date || today(),
              kind,
              label: label.trim(),
              nextDate: next.trim() || null,
              note: note.trim() || undefined,
            });
            setLabel('');
            setNext('');
            setNote('');
          }}
        />
      </Card>

      <SectionTitle icon="kit">Historique ({state.health.entries.length})</SectionTitle>
      <Card>
        <Row style={{ flexWrap: 'wrap' }}>
          <Chip label="Tous" active={filter === 'tous'} onPress={() => setFilter('tous')} />
          {kinds.map((k) => (
            <Chip key={k.value} label={k.label} active={filter === k.value} onPress={() => setFilter(k.value)} />
          ))}
        </Row>
        {entries.length === 0 ? (
          <Empty icon="kit" text="Carnet vide : chaque visite, vaccin ou traitement enregistré ici alimente les rappels automatiques." />
        ) : (
          entries.map((e) => (
            <ListRow
              key={e.id}
              icon={kinds.find((k) => k.value === e.kind)?.icon ?? 'paw'}
              title={`${frDate(e.date)} · ${e.label}`}
              sub={[e.note, e.nextDate ? `à renouveler le ${frDate(e.nextDate)}` : null].filter(Boolean).join(' — ')}
              onRemove={() => removeHealthEntry(e.id)}
            />
          ))
        )}
      </Card>

      <SectionTitle icon="scale">Dernières pesées</SectionTitle>
      <Card>
        {weights.length === 0 ? (
          <Sub>Aucune pesée : ajoute-les dans Suivi → Poids & croissance.</Sub>
        ) : (
          weights.map((w) => (
            <Row key={w.date}>
              <Text style={s.line}>{frDate(w.date)}</Text>
              <Pill tone="accent">{formatWeight(w.grams, state.prefs.weightUnit)}</Pill>
            </Row>
          ))
        )}
      </Card>

      <SectionTitle icon="shield">Trousse de premiers soins</SectionTitle>
      <Card style={{ backgroundColor: colors.accentSoft }}>
        {health.kit.map((k) => (
          <Row key={k} style={{ alignItems: 'flex-start' }}>
            <Icon name="check" size={15} color={colors.accent} />
            <Text style={s.bullet}>{k}</Text>
          </Row>
        ))}
      </Card>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 10, paddingBottom: 40 },
  line: { ...type.small, color: colors.ink2, flex: 1 },
  bullet: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink2, lineHeight: 18 },
});
