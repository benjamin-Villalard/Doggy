import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { EmojiPicker, Field, Segmented, Stepper, Toggle } from '../components/Form';
import { Button, Card, Row, SectionTitle, Sub } from '../components/UI';
import { ageLabel, defaultPrefs, useActions, useStore, type Sex, type Tone } from '../lib/store';
import { useVoice } from '../lib/voice';

const AVATARS = ['🐶', '🐕', '🦴', '🐾', '🎀', '👑', '⭐️', '🍀', '🧸', '🐻'];

export default function Reglages() {
  const { state, reset } = useStore();
  const { setProfile, setPrefs } = useActions();
  const router = useRouter();
  const voice = useVoice();
  const p = state.profile;
  const prefs = state.prefs;

  const confirmReset = () => {
    const doIt = () => {
      reset();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') doIt();
    else
      Alert.alert('Tout effacer ?', 'Les notes, scores et journaux seront supprimés.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Effacer', style: 'destructive', onPress: doIt },
      ]);
  };

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <SectionTitle icon="dog">Profil du chiot</SectionTitle>
      <Card>
        <Field label="Nom" value={p.name} onChangeText={(v) => setProfile({ name: v })} placeholder="ex. Gaston" />
        <Field
          label="Surnom utilisé dans l'app"
          value={p.nickname}
          onChangeText={(v) => setProfile({ nickname: v })}
          placeholder="ex. Gus"
          hint={`Les tutoriels diront « ${voice.name} » à la place de « le chiot ».`}
        />
        <Segmented<Sex>
          label="Sexe"
          value={p.sex}
          options={[
            { value: 'male', label: 'Mâle' },
            { value: 'female', label: 'Femelle' },
            { value: 'inconnu', label: 'Non précisé' },
          ]}
          onChange={(v) => setProfile({ sex: v })}
          hint="Accorde automatiquement les textes (il / elle)."
        />
        <EmojiPicker label="Avatar" value={p.avatar} options={AVATARS} onChange={(v) => setProfile({ avatar: v })} />
        <Field
          label="Date de naissance (AAAA-MM-JJ)"
          value={p.birthdate ?? ''}
          onChangeText={(v) => setProfile({ birthdate: /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : v === '' ? null : p.birthdate })}
          placeholder="2026-06-01"
          hint={`Âge actuel : ${ageLabel(p.birthdate)}`}
        />
        <Field
          label="Date d'arrivée à la maison"
          value={p.arrival ?? ''}
          onChangeText={(v) => setProfile({ arrival: /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : v === '' ? null : p.arrival })}
          placeholder="2026-08-01"
        />
        <Field label="Ton prénom" value={p.ownerName} onChangeText={(v) => setProfile({ ownerName: v })} placeholder="ex. Benjamin" />
        <Field
          label="Poids adulte visé (g)"
          value={p.adultWeightG === null ? '' : String(p.adultWeightG)}
          onChangeText={(v) => setProfile({ adultWeightG: v.trim() === '' ? null : Number(v.replace(',', '.')) })}
          placeholder="2600"
          keyboardType="numeric"
          hint="Standard Yorkshire : 2 à 3,2 kg adulte. Sert de repère sur la courbe de poids."
        />
      </Card>

      <SectionTitle icon="voice">Ton du coach</SectionTitle>
      <Card>
        <Segmented<Tone>
          value={prefs.tone}
          options={[
            { value: 'fun', label: 'Ludique' },
            { value: 'neutre', label: 'Neutre' },
            { value: 'expert', label: 'Expert' },
          ]}
          onChange={(v) => setPrefs({ tone: v })}
          hint={
            prefs.tone === 'fun'
              ? 'Missions, jeux nommés et encouragements personnalisés.'
              : prefs.tone === 'neutre'
                ? 'Missions conservées, encouragements sobres.'
                : 'Aucune accroche ludique : uniquement le contenu technique du livre.'
          }
        />
        <Toggle label="Emojis" value={prefs.emoji} onChange={(v) => setPrefs({ emoji: v })} hint="Désactive-les pour un rendu plus sobre." />
        <Toggle
          label="Afficher les critères de réussite"
          value={prefs.showCriteria}
          onChange={(v) => setPrefs({ showCriteria: v })}
        />
        <Toggle
          label="Afficher les encadrés spécial toy"
          value={prefs.showToyBoxes}
          onChange={(v) => setPrefs({ showToyBoxes: v })}
          hint="Rappels propres aux chiens de moins de 3 kg (trachée, rotules, hypoglycémie)."
        />
        <Toggle
          label="Réduire les animations"
          value={prefs.reduceMotion}
          onChange={(v) => setPrefs({ reduceMotion: v })}
        />
      </Card>

      <SectionTitle icon="stethoscope">Mode clinicien</SectionTitle>
      <Card>
        <Toggle
          label="Activer le mode clinicien"
          value={prefs.clinicianMode}
          onChange={(v) => setPrefs({ clinicianMode: v })}
          hint="Réservé à un usage soignant : protocoles d'urgence détaillés, triage ABCDE, posologies en mg/kg avec volume calculé, calculateur toxicologique, constantes et score de douleur."
        />
        <Sub>
          Contenu documentaire à visée d'aide-mémoire : il ne remplace ni l'examen de l'animal, ni la prescription d'un
          vétérinaire, ni un protocole local. Les doses affichées sont des ordres de grandeur de la littérature
          vétérinaire, à valider avant toute administration.
        </Sub>
      </Card>

      <SectionTitle icon="whistle">Mes mots d'éducation</SectionTitle>
      <Card>
        <Sub>Ces mots remplacent ceux du livre dans tous les tutoriels : utilise exactement ceux que tu dis à la maison.</Sub>
        <Field label="Mot du rappel" value={prefs.recallWord} onChangeText={(v) => setPrefs({ recallWord: v })} placeholder="Viens" />
        <Field label="Marqueur (mot qui annonce la récompense)" value={prefs.marker} onChangeText={(v) => setPrefs({ marker: v })} placeholder="Oui / clic" />
        <Field label="Mot de libération (fin d'exercice)" value={prefs.releaseWord} onChangeText={(v) => setPrefs({ releaseWord: v })} placeholder="Ok" />
        <Field label="Comment tu appelles les friandises" value={prefs.treatWord} onChangeText={(v) => setPrefs({ treatWord: v })} placeholder="friandise / bonbon" />
        <Field label="Comment tu appelles le panier / tapis" value={prefs.matWord} onChangeText={(v) => setPrefs({ matWord: v })} placeholder="panier / place" />
        <Card tone="flat">
          <Sub>
            Aperçu : « {voice.t('Dis « {recall} », marque avec « {marker} » puis donne la {treat}, et envoie {name} au {mat}.')} »
          </Sub>
        </Card>
      </Card>

      <SectionTitle icon="target">Mes objectifs</SectionTitle>
      <Card>
        <Stepper
          label="Durée d'une séance"
          value={prefs.sessionSeconds}
          min={30}
          max={600}
          step={30}
          suffix=" s"
          onChange={(v) => setPrefs({ sessionSeconds: v })}
          hint="Le livre recommande 2 min chez un chiot de 2 mois."
        />
        <Stepper
          label="Séances par jour"
          value={prefs.goalSessions}
          min={1}
          max={10}
          onChange={(v) => setPrefs({ goalSessions: v })}
        />
        <Stepper
          label="Sorties propreté par jour"
          value={prefs.goalPotty}
          min={2}
          max={20}
          onChange={(v) => setPrefs({ goalPotty: v })}
        />
        <Stepper
          label="Expériences de socialisation par semaine"
          value={prefs.goalSocialWeek}
          min={1}
          max={30}
          onChange={(v) => setPrefs({ goalSocialWeek: v })}
        />
        <Segmented<'g' | 'kg'>
          label="Unité de poids"
          value={prefs.weightUnit}
          options={[
            { value: 'g', label: 'grammes' },
            { value: 'kg', label: 'kilos' },
          ]}
          onChange={(v) => setPrefs({ weightUnit: v })}
        />
        <Button small tone="ghost" title="Revenir aux réglages conseillés" onPress={() => setPrefs(defaultPrefs)} />
      </Card>

      <SectionTitle icon="shield">Données</SectionTitle>
      <Card>
        <Sub>
          {Object.keys(state.skills).length} compétences notées · {Object.keys(state.social).length} expériences ·{' '}
          {state.potty.length} entrées propreté · {state.sessions.length} séances · {state.weights.length} pesées ·{' '}
          {state.health.entries.length} actes de santé. Tout est stocké localement sur l'appareil, sans compte ni
          serveur.
        </Sub>
        <Row>
          <View style={{ flex: 1 }}>
            <Button small tone="ghost" title="Page santé" onPress={() => router.push('/sante')} />
          </View>
          <View style={{ flex: 1 }}>
            <Button small tone="red" title="Réinitialiser" onPress={confirmReset} />
          </View>
        </Row>
      </Card>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 10, paddingBottom: 40 },
});
