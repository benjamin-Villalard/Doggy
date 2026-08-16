import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from '../../components/Icon';
import Rich from '../../components/Rich';
import ScorePicker from '../../components/ScorePicker';
import SessionRunner from '../../components/SessionRunner';
import { Card, Pill, Row, SectionTitle, Sub } from '../../components/UI';
import { issueByCode, skillByCode, tutorialByCode } from '../../lib/content';
import { useActions, useStore } from '../../lib/store';
import { useVoice } from '../../lib/voice';
import { LinearGradient } from 'expo-linear-gradient';
import { boxStyles, colors, grad, gradients, radius, shadow, type } from '../../lib/theme';

export default function TutoDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const t = code ? tutorialByCode(code) : undefined;
  const { state } = useStore();
  const { setSkill, setNote } = useActions();
  const router = useRouter();
  const voice = useVoice();

  if (!t) return <Text style={s.wrap}>Tutoriel introuvable.</Text>;
  const skill = skillByCode(t.code);
  const score = state.skills[t.code] ?? 0;
  const linkedIssues = [...new Set((t.alea ?? '').match(/A\d\d/g) ?? [])];
  const flavor = voice.flavor(t.code);

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: t.code }} />
      <LinearGradient colors={grad(gradients.hero)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <View style={s.heroBlob} />
        <Row>
          <View style={s.heroIcon}>
            <Icon name={t.icon} size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>{t.title}</Text>
            <Text style={s.heroMeta}>
              {t.code}
              {skill ? ` · cible 4/5 : ${skill.target}` : ''}
            </Text>
          </View>
        </Row>
        {t.block ? <Text style={s.heroMeta}>{t.block}</Text> : null}
      </LinearGradient>

      {flavor ? (
        <Card style={{ backgroundColor: colors.accentSoft }}>
          <Row>
            <Icon name="sparkle" size={18} color={colors.accent} />
            <Text style={[s.h, { color: colors.accentDeep }]}>
              {flavor.game} {voice.emoji('\u{1F3AF}')}
            </Text>
          </Row>
          <Rich text={flavor.pitch} />
          <View style={s.missionRow}>
            <Pill tone="accent" solid>
              Mission du jour
            </Pill>
          </View>
          <Rich text={flavor.mission} />
          <Row style={{ alignItems: 'flex-start' }}>
            <Icon name="trophy" size={16} color={colors.green} />
            <Rich text={`**C'est gagné quand :** ${flavor.win}`} style={{ flex: 1 }} />
          </Row>
        </Card>
      ) : null}

      {t.meta ? (
        <Card>
          <Rich text={t.meta} />
        </Card>
      ) : null}

      <Card>
        <Row>
          <Text style={s.h}>Où j'en suis</Text>
          <Pill tone={score >= 4 ? 'green' : score >= 2 ? 'orange' : 'grey'}>{score}/5</Pill>
        </Row>
        <ScorePicker value={score} onChange={(v) => setSkill(t.code, v)} />
      </Card>

      <SectionTitle icon="check">Étapes</SectionTitle>
      <Card>
        {t.steps.map((st) => (
          <Row key={st.n} style={{ alignItems: 'flex-start', marginBottom: 6 }}>
            <View style={s.num}>
              <Text style={s.numText}>{st.n}</Text>
            </View>
            <Rich text={st.text} style={{ flex: 1 }} />
          </Row>
        ))}
      </Card>

      {t.criteria && state.prefs.showCriteria ? (
        <Card style={{ backgroundColor: boxStyles.tip.bg, borderColor: boxStyles.tip.border }}>
          <Row>
            <Icon name="check" size={18} color={colors.green} />
            <Text style={[s.h, { color: colors.green }]}>Critère de réussite</Text>
          </Row>
          <Rich text={t.criteria} />
        </Card>
      ) : null}

      {t.alea ? (
        <Card style={{ backgroundColor: boxStyles.warn.bg, borderColor: boxStyles.warn.border }}>
          <Row>
            <Icon name="warn" size={18} color={colors.orange} />
            <Text style={[s.h, { color: colors.orange }]}>Si ça déraille</Text>
          </Row>
          <Rich text={t.alea} />
          {linkedIssues.map((a) => {
            const issue = issueByCode(a);
            return (
              <Text key={a} style={s.link} onPress={() => router.push(`/aleas/${a}`)}>
                Fiche {a}{issue ? ` · ${issue.title}` : ''} →
              </Text>
            );
          })}
        </Card>
      ) : null}

      {t.boxes
        .filter((b) => state.prefs.showToyBoxes || b.variant !== 'york')
        .map((b, i) => {
        const v = boxStyles[b.variant] ?? boxStyles.neutral;
        return (
          <Card key={i} style={{ backgroundColor: v.bg, borderColor: v.border }}>
            {b.title ? <Text style={[s.h, { color: v.fg }]}>{b.title}</Text> : v.label ? (
              <Text style={[s.h, { color: v.fg }]}>{v.label}</Text>
            ) : null}
            <Rich text={b.text} />
          </Card>
        );
      })}

      <SectionTitle icon="clock">S'entraîner</SectionTitle>
      <SessionRunner code={t.code} />

      <Card>
        <Text style={s.h}>Mes notes</Text>
        <TextInput
          style={s.input}
          value={state.notes[t.code] ?? ''}
          onChangeText={(v) => setNote(t.code, v)}
          placeholder={`Ce qui marche avec ${voice.name}, ses ${state.prefs.treatWord}s préférées, les lieux déjà validés…`}
          placeholderTextColor={colors.ink3}
          multiline
        />
        <Sub>Enregistré automatiquement.</Sub>
      </Card>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 11, paddingBottom: 40 },
  hero: { borderRadius: radius, padding: 16, gap: 7, overflow: 'hidden', ...shadow.lift },
  heroBlob: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.09)',
    top: -70,
    right: -40,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...type.h2, color: '#fff', fontSize: 18 },
  heroMeta: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 12.5, color: colors.ink3 },
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
  link: { color: colors.accent, fontWeight: '700', fontSize: 13.5, marginTop: 4 },
  missionRow: { flexDirection: 'row', marginTop: 2 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
    minHeight: 78,
    color: colors.ink,
    backgroundColor: '#faf8fe',
    outlineStyle: 'none',
  } as never,
});
