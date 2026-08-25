import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from '../../components/Icon';
import Rich from '../../components/Rich';
import SessionRunner from '../../components/SessionRunner';
import { Button, Card, Pill, Progress, Row, SectionTitle, Sub } from '../../components/UI';
import { trickByCode } from '../../lib/content';
import { ageInWeeks, useActions, useStore } from '../../lib/store';
import { boxStyles, colors, grad, gradients, radius, radiusSm, shadow, type } from '../../lib/theme';
import { useVoice } from '../../lib/voice';

export default function TrickDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const t = code ? trickByCode(code) : undefined;
  const { state } = useStore();
  const { setTrickLevel, setNote } = useActions();
  const voice = useVoice();

  if (!t) return <Text style={s.wrap}>Tour introuvable.</Text>;

  const level = state.tricks[t.code] ?? 0;
  const weeks = ageInWeeks(state.profile.birthdate);
  const tooYoung = weeks !== null && weeks < t.minAgeWeeks;

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: t.code }} />

      <LinearGradient colors={grad(gradients.candy)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <View style={s.heroBlob} />
        <Row>
          <View style={s.heroIcon}>
            <Icon name={t.icon} size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>{t.title}</Text>
            <Text style={s.heroMeta}>
              {t.category} · {'★'.repeat(t.stars)}
              {'☆'.repeat(3 - t.stars)} · dès {Math.round(t.minAgeWeeks / 4.35)} mois
            </Text>
          </View>
        </Row>
        <View style={{ marginTop: 4 }}>
          <Progress value={level} max={3} height={12} gradient={['#ffffff', '#ffe9ff']} hideValue label=" " />
        </View>
        <Text style={s.heroMeta}>
          Palier {level}/3 {level === 3 ? '· maîtrisé 🏆' : ''}
        </Text>
      </LinearGradient>

      <Card style={{ backgroundColor: colors.accentSoft }}>
        <Row>
          <Icon name="sparkle" size={18} color={colors.accent} />
          <Text style={[s.h, { color: colors.accentDeep }]}>À quoi ça sert</Text>
        </Row>
        <Rich text={t.why} />
        <Row style={{ flexWrap: 'wrap' }}>
          <Pill tone="accent" solid>
            Mot : {t.cue}
          </Pill>
          <Pill tone="blue">{t.gear}</Pill>
        </Row>
      </Card>

      {tooYoung ? (
        <Card style={{ backgroundColor: boxStyles.warn.bg, borderColor: boxStyles.warn.border }}>
          <Row>
            <Icon name="warn" size={18} color={colors.orange} />
            <Text style={[s.h, { color: colors.orange }]}>Trop tôt pour {voice.name}</Text>
          </Row>
          <Sub>
            Ce tour se travaille à partir de {Math.round(t.minAgeWeeks / 4.35)} mois ({t.minAgeWeeks} semaines).
            Avant, les articulations et la concentration ne suivent pas : garde-le en favori pour plus tard.
          </Sub>
        </Card>
      ) : null}

      <SectionTitle icon="check">Comment l'apprendre</SectionTitle>
      <Card>
        {t.steps.map((st, i) => (
          <Row key={i} style={{ alignItems: 'flex-start', marginBottom: 6 }}>
            <View style={s.num}>
              <Text style={s.numText}>{i + 1}</Text>
            </View>
            <Rich text={st} style={{ flex: 1 }} />
          </Row>
        ))}
      </Card>

      <SectionTitle icon="stairs">Les 3 paliers</SectionTitle>
      {t.levels.map((lv, i) => {
        const done = level >= i + 1;
        const current = level === i;
        return (
          <Pressable key={i} onPress={() => setTrickLevel(t.code, done ? i : i + 1)}>
            <View
              style={[
                s.level,
                done && { backgroundColor: colors.greenSoft, borderColor: colors.green },
                current && !done && { borderColor: colors.accent },
              ]}
            >
              <View style={[s.levelDot, done && { backgroundColor: colors.green }]}>
                <Icon name={done ? 'check' : 'target'} size={15} color={done ? '#fff' : colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.levelName}>{lv.name}</Text>
                <Text style={s.levelGoal}>{lv.goal}</Text>
                <Row style={{ marginTop: 4, alignItems: 'flex-start' }}>
                  <Icon name="trophy" size={14} color={colors.orange} />
                  <Text style={s.levelCrit}>{lv.criteria}</Text>
                </Row>
              </View>
              {current && !done ? <Pill tone="accent">en cours</Pill> : null}
            </View>
          </Pressable>
        );
      })}
      <Sub>Touche un palier pour le valider (ou l'annuler). On ne monte de palier qu'à partir de 8 réussites sur 10.</Sub>

      <Card style={{ backgroundColor: boxStyles.tip.bg, borderColor: boxStyles.tip.border }}>
        <Row>
          <Icon name="trophy" size={18} color={colors.green} />
          <Text style={[s.h, { color: colors.green }]}>Tour validé quand</Text>
        </Row>
        <Rich text={t.criteria} />
      </Card>

      <SectionTitle icon="warn">Ça bloque ?</SectionTitle>
      {t.fix.map((f, i) => (
        <Card key={i} tone="flat">
          <Text style={s.fixP}>{f.problem}</Text>
          <Rich text={f.solution} />
        </Card>
      ))}

      {state.prefs.showToyBoxes ? (
        <Card style={{ backgroundColor: boxStyles.york.bg, borderColor: boxStyles.york.border }}>
          <Row>
            <Icon name="dog" size={18} color={colors.accent} />
            <Text style={[s.h, { color: colors.accent }]}>Spécial Yorkshire</Text>
          </Row>
          <Rich text={t.toy} />
        </Card>
      ) : null}

      <SectionTitle icon="clock">S'entraîner</SectionTitle>
      <SessionRunner code={t.code} />

      <Card>
        <Text style={s.h}>Mes notes</Text>
        <TextInput
          style={s.input}
          value={state.notes[t.code] ?? ''}
          onChangeText={(v) => setNote(t.code, v)}
          placeholder={`Ce qui marche avec ${voice.name} sur ce tour…`}
          placeholderTextColor={colors.ink3}
          multiline
        />
      </Card>

      {level < 3 ? (
        <Button
          title={`Valider le palier ${level + 1}`}
          icon="check"
          tone="green"
          onPress={() => setTrickLevel(t.code, level + 1)}
        />
      ) : (
        <Button title="Recommencer la progression" tone="ghost" onPress={() => setTrickLevel(t.code, 0)} />
      )}
      <View style={{ height: 26 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 11, paddingBottom: 40 },
  hero: { borderRadius: radius, padding: 16, gap: 7, overflow: 'hidden', ...shadow.lift },
  heroBlob: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    top: -74,
    right: -40,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...type.h2, color: '#fff', fontSize: 19 },
  heroMeta: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700' },
  h: { fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 },
  num: {
    width: 24,
    height: 24,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  level: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: radiusSm + 4,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: 13,
  },
  levelDot: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelName: { fontSize: 14.5, fontWeight: '800', color: colors.ink },
  levelGoal: { ...type.small, color: colors.ink2, marginTop: 1 },
  levelCrit: { ...type.small, color: colors.orange, flex: 1, fontWeight: '700' },
  fixP: { fontSize: 14, fontWeight: '800', color: colors.coral },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
    minHeight: 70,
    color: colors.ink,
    backgroundColor: '#faf8fe',
    outlineStyle: 'none',
  } as never,
});
