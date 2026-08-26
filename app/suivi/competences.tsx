import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/Icon';
import ScorePicker from '../../components/ScorePicker';
import { Card, Pill, Progress, Row, Sub } from '../../components/UI';
import { skillLegend, skillTargetWeeks, skills, tutorialByCode } from '../../lib/content';
import { ageInWeeks, skillTotal, useActions, useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function Competences() {
  const { state } = useStore();
  const { setSkill } = useActions();
  const router = useRouter();
  const weeks = ageInWeeks(state.profile.birthdate) ?? 0;

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Card>
        <Progress value={skillTotal(state.skills)} max={140} label="Total" />
        {skillLegend.map((l, i) => (
          <Text key={i} style={s.legend}>
            <Text style={{ fontWeight: '800', color: colors.accent }}>{i}</Text> — {l.replace(/^\d\s*/, '')}
          </Text>
        ))}
      </Card>

      {skills.map((sk) => {
        const score = state.skills[sk.code] ?? 0;
        const late = weeks > (skillTargetWeeks[sk.code] ?? 52) && score < 4;
        const t = tutorialByCode(sk.code);
        return (
          <Card key={sk.code} style={late ? { borderColor: colors.orange } : undefined}>
            <Row>
              <Icon name={t?.icon} size={20} />
              <View style={{ flex: 1 }}>
                <Text style={[s.name, sk.key && { fontWeight: '800' }]}>
                  {sk.code} · {sk.name}
                </Text>
                <Text style={s.meta}>cible 4/5 : {sk.target}</Text>
              </View>
              {late ? <Pill tone="orange">retard</Pill> : null}
              {sk.key ? <Pill tone="accent">clé</Pill> : null}
            </Row>
            <ScorePicker value={score} onChange={(v) => setSkill(sk.code, v)} compact />
            <Text style={s.link} onPress={() => router.push(`/tutos/${sk.code}`)}>
              Ouvrir le tutoriel →
            </Text>
          </Card>
        );
      })}
      <Sub>Les 6 compétences « clé » (gras dans le livre) passent avant tout nouvel apprentissage si elles sont &lt; 3.</Sub>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 10, paddingBottom: 40 },
  name: { fontSize: 14, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 11.5, color: colors.ink3 },
  legend: { fontSize: 12, color: colors.ink2 },
  link: { fontSize: 12.5, color: colors.accent, fontWeight: '700' },
});
