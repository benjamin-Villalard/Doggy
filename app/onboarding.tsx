import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { EmojiPicker, Segmented } from '../components/Form';
import Icon from '../components/Icon';
import { Button, Card, FadeIn, Row, Sub } from '../components/UI';
import { issues, socialization, tutorials } from '../lib/content';
import { useActions, type Sex, type Tone } from '../lib/store';
import { colors, grad, gradients, type } from '../lib/theme';

const isoValid = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime());

const AVATARS = ['🐶', '🐕', '🦴', '🐾', '🎀', '👑', '⭐️', '🍀', '🧸', '🐻'];

export default function Onboarding() {
  const { setProfile, setPrefs, finishOnboarding } = useActions();
  const router = useRouter();
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [arrival, setArrival] = useState('');
  const [owner, setOwner] = useState('');
  const [sex, setSex] = useState<Sex>('inconnu');
  const [avatar, setAvatar] = useState('🐶');
  const [tone, setTone] = useState<Tone>('fun');

  const ok = name.trim().length > 0 && isoValid(birth);
  const socialTotal = socialization.reduce((a, c) => a + c.items.length, 0);

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={grad(gradients.hero)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <View style={s.blob} />
        <View style={s.logo}>
          <Icon name="paw" size={34} color="#fff" />
        </View>
        <Text style={s.h1}>Mon Yorkshire</Text>
        <Text style={s.heroSub}>
          Le programme d'éducation complet, de 2 à 12 mois. Hors connexion, tes données restent sur ton téléphone.
        </Text>
        <Row style={{ gap: 7, marginTop: 4 }}>
          <View style={s.tag}>
            <Text style={s.tagTxt}>{tutorials.length} tutoriels</Text>
          </View>
          <View style={s.tag}>
            <Text style={s.tagTxt}>{issues.length} fiches aléas</Text>
          </View>
          <View style={s.tag}>
            <Text style={s.tagTxt}>{socialTotal} socialisations</Text>
          </View>
        </Row>
      </LinearGradient>

      <View style={s.body}>
        <FadeIn>
          <Card>
            <Text style={s.label}>Son nom</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex. Nino"
              placeholderTextColor={colors.ink3}
            />
            <Text style={s.label}>Date de naissance (AAAA-MM-JJ)</Text>
            <TextInput
              style={s.input}
              value={birth}
              onChangeText={setBirth}
              placeholder="2026-06-14"
              placeholderTextColor={colors.ink3}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={s.label}>Date d'arrivée à la maison (optionnel)</Text>
            <TextInput
              style={s.input}
              value={arrival}
              onChangeText={setArrival}
              placeholder="2026-08-14"
              placeholderTextColor={colors.ink3}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={s.label}>Ton prénom (optionnel)</Text>
            <TextInput
              style={s.input}
              value={owner}
              onChangeText={setOwner}
              placeholder="Ex. Benjamin"
              placeholderTextColor={colors.ink3}
            />
            <Segmented<Sex>
              label="Sexe"
              value={sex}
              options={[
                { value: 'male', label: 'Mâle' },
                { value: 'female', label: 'Femelle' },
                { value: 'inconnu', label: 'Plus tard' },
              ]}
              onChange={setSex}
              hint="Les tutoriels s'accordent automatiquement."
            />
            <EmojiPicker label="Son avatar" value={avatar} options={AVATARS} onChange={setAvatar} />
            <Segmented<Tone>
              label="Ton du coach"
              value={tone}
              options={[
                { value: 'fun', label: 'Ludique' },
                { value: 'neutre', label: 'Neutre' },
                { value: 'expert', label: 'Expert' },
              ]}
              onChange={setTone}
              hint="Modifiable à tout moment dans les réglages, avec 15 autres options."
            />
            <Sub>L'âge sert à placer automatiquement la phase en cours, les objectifs du jour et les rappels.</Sub>
            <Button
              title="Commencer l'aventure"
              icon="paw"
              full
              disabled={!ok}
              onPress={() => {
                setProfile({
                  name: name.trim(),
                  birthdate: birth,
                  arrival: isoValid(arrival) ? arrival : null,
                  ownerName: owner.trim(),
                  sex,
                  avatar,
                });
                setPrefs({ tone });
                finishOnboarding();
                router.replace('/');
              }}
            />
          </Card>
        </FadeIn>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: colors.bg, flexGrow: 1, paddingBottom: 30 },
  hero: {
    paddingTop: 44,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 7,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -100,
    right: -70,
  },
  logo: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  h1: { ...type.h1, color: '#fff', fontSize: 28 },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 19 },
  tag: { backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  tagTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  body: { padding: 16 },
  label: { fontSize: 13, fontWeight: '800', color: colors.ink, marginTop: 2 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: '#faf8fe',
    outlineStyle: 'none',
  } as never,
});
