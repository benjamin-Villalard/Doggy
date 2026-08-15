import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, Sub, Title } from '../components/UI';
import { ageLabel, useActions, useStore } from '../lib/store';
import { colors } from '../lib/theme';

export default function Reglages() {
  const { state, reset } = useStore();
  const { setProfile } = useActions();
  const router = useRouter();
  const [name, setName] = useState(state.profile.name);
  const [birth, setBirth] = useState(state.profile.birthdate ?? '');

  useEffect(() => {
    setName(state.profile.name);
    setBirth(state.profile.birthdate ?? '');
  }, [state.profile.name, state.profile.birthdate]);

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
    <ScrollView contentContainerStyle={s.wrap}>
      <Title icon="dog">Profil</Title>
      <Card>
        <Text style={s.label}>Nom</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholderTextColor={colors.ink3} />
        <Text style={s.label}>Date de naissance (AAAA-MM-JJ)</Text>
        <TextInput style={s.input} value={birth} onChangeText={setBirth} placeholderTextColor={colors.ink3} />
        <Sub>Âge actuel : {ageLabel(state.profile.birthdate)}</Sub>
        <Button
          small
          title="Enregistrer"
          onPress={() => setProfile({ name: name.trim(), birthdate: /^\d{4}-\d{2}-\d{2}$/.test(birth) ? birth : state.profile.birthdate })}
        />
      </Card>

      <Card>
        <Text style={s.label}>Données</Text>
        <Sub>
          {Object.keys(state.skills).length} compétences notées · {Object.keys(state.social).length} expériences ·{' '}
          {state.potty.length} entrées propreté · {state.sessions.length} séances · {state.weights.length} pesées. Tout
          est stocké localement sur l'appareil.
        </Sub>
        <Button small tone="red" title="Réinitialiser l'application" onPress={confirmReset} />
      </Card>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 12, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: colors.ink,
  },
});
