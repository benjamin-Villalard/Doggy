import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/Icon';
import ScreenHeader from '../../components/ScreenHeader';
import { Card, Progress, Ring, Row, SectionTitle, Sub } from '../../components/UI';
import { MILESTONES, nextMilestone } from '../../lib/coach';
import { skills, socialization } from '../../lib/content';
import { badges, level, streak } from '../../lib/gamification';
import { ageInWeeks, daysWithoutAccident, skillTotal, useStore } from '../../lib/store';
import { colors, grad, gradients, radius, shadow, type } from '../../lib/theme';

export default function Suivi() {
  const { state } = useStore();
  const router = useRouter();
  const total = skillTotal(state.skills);
  const socialTotal = socialization.reduce((a, c) => a + c.items.length, 0);
  const socialDone = Object.keys(state.social).length;
  const weeks = ageInWeeks(state.profile.birthdate) ?? 0;
  const milestone = nextMilestone(state.profile.birthdate);
  const keyLow = skills.filter((s) => s.key && (state.skills[s.code] ?? 0) < 3).length;
  const lastWeight = state.weights[state.weights.length - 1];
  const lvl = level(state);
  const all = badges(state);
  const got = all.filter((b) => b.got).length;

  return (
    <ScrollView contentContainerStyle={s.wrap} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Carnet de suivi"
        subtitle={`Niv. ${lvl.index} · ${lvl.xp} XP · ${streak(state)} jours de série`}
        icon="chart"
      />

      <View style={s.body}>
        <Card>
          <Row style={{ justifyContent: 'space-around' }}>
            <Ring value={total} max={140} caption="COMPÉTENCES" center={`${total}`} />
            <Ring value={socialDone} max={socialTotal} color={colors.blue} caption="SOCIALISATION" center={`${socialDone}`} />
            <Ring value={got} max={all.length} color={colors.amber} caption="TROPHÉES" center={`${got}`} />
          </Row>
          <Progress
            value={total}
            max={140}
            label={`Bilan ${milestone.key} : objectif ≥ ${milestone.min}`}
            gradient={gradients.accent}
          />
          <Sub>
            {keyLow > 0
              ? `${keyLow} compétence(s) clé(s) sous 3/5 — priorité du mois.`
              : 'Toutes les compétences clés sont à 3/5 ou plus.'}
          </Sub>
          <View style={s.milestones}>
            {MILESTONES.map((m) => (
              <View key={m.key} style={[s.ms, weeks >= m.weeks && { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft }]}>
                <Text style={[s.msKey, weeks >= m.weeks && { color: colors.accent }]}>{m.key}</Text>
                <Text style={s.msVal}>≥{m.min}</Text>
              </View>
            ))}
          </View>
        </Card>

        <SectionTitle icon="compass">Les carnets</SectionTitle>
        <Item
          icon="check"
          tone={gradients.accent}
          title="Grille de compétences (0 → 5)"
          sub={`${total}/140 points · ${skills.length} compétences`}
          onPress={() => router.push('/suivi/competences')}
        />
        <Item
          icon="people"
          tone={gradients.blue}
          title="Checklist socialisation"
          sub={`${socialDone}/${socialTotal} expériences validées`}
          onPress={() => router.push('/suivi/socialisation')}
        />
        <Item
          icon="drop"
          tone={gradients.green}
          title="Journal de propreté"
          sub={`${state.potty.length} entrées · ${daysWithoutAccident(state.potty)} j sans accident`}
          onPress={() => router.push('/suivi/proprete')}
        />
        <Item
          icon="scale"
          tone={gradients.amber}
          title="Poids & croissance"
          sub={lastWeight ? `${lastWeight.grams} g le ${lastWeight.date}` : 'aucune pesée enregistrée'}
          onPress={() => router.push('/suivi/poids')}
        />
        <Item
          icon="clicker"
          tone={gradients.coral}
          title="Historique des séances"
          sub={`${state.sessions.length} séances enregistrées`}
          onPress={() => router.push('/suivi/seances')}
        />

        <SectionTitle icon="trophy">Trophées ({got}/{all.length})</SectionTitle>
        <View style={s.grid}>
          {all.map((b) => (
            <View key={b.code} style={[s.badge, shadow.soft, !b.got && { opacity: 0.55 }]}>
              {b.got ? (
                <LinearGradient colors={grad(gradients.amber)} style={s.badgeIcon}>
                  <Icon name={b.icon} size={19} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={[s.badgeIcon, { backgroundColor: '#ece7f6' }]}>
                  <Icon name="lock" size={17} color={colors.ink3} />
                </View>
              )}
              <Text style={s.badgeName}>{b.name}</Text>
              <Text style={s.badgeHint}>{b.hint}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Item({
  icon,
  title,
  sub,
  onPress,
  tone,
}: {
  icon: string;
  title: string;
  sub: string;
  onPress: () => void;
  tone: readonly string[];
}) {
  return (
    <Card onPress={onPress}>
      <Row>
        <LinearGradient colors={grad(tone)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.itemIcon}>
          <Icon name={icon} size={19} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.meta}>{sub}</Text>
        </View>
        <Text style={s.chev}>›</Text>
      </Row>
    </Card>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 36 },
  body: { paddingHorizontal: 14, paddingTop: 14, gap: 10 },
  title: { fontSize: 14.5, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  meta: { ...type.small, color: colors.ink3 },
  chev: { fontSize: 22, color: colors.ink3, fontWeight: '600' },
  itemIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  milestones: { flexDirection: 'row', gap: 6, marginTop: 2 },
  ms: {
    flex: 1,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 7,
    alignItems: 'center',
  },
  msKey: { fontSize: 12, fontWeight: '800', color: colors.ink2 },
  msVal: { fontSize: 10.5, fontWeight: '600', color: colors.ink3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  badge: {
    width: '31.5%',
    minWidth: 96,
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: radius,
    padding: 11,
    alignItems: 'center',
    gap: 4,
  },
  badgeIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badgeName: { fontSize: 12, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  badgeHint: { fontSize: 9.5, fontWeight: '600', color: colors.ink3, textAlign: 'center' },
});
