import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Hero from '../../components/Hero';
import Icon from '../../components/Icon';
import Rich from '../../components/Rich';
import { Card, FadeIn, Pill, Row, SectionTitle, Stat, Sub } from '../../components/UI';
import { currentPhaseIndex, lateKeySkills, nextMilestone, todaysFocus } from '../../lib/coach';
import { phases, socialization } from '../../lib/content';
import { badges, dailyGoals } from '../../lib/gamification';
import { accidentHotHours, ageInWeeks, daysWithoutAccident, skillTotal, today, useActions, useStore } from '../../lib/store';
import { colors, grad, gradients, radius, shadow, type } from '../../lib/theme';

function QuickAction({
  label,
  icon,
  gradient,
  onPress,
}: {
  label: string;
  icon: string;
  gradient: readonly string[];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <LinearGradient colors={grad(gradient)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.qa}>
        <Icon name={icon} size={19} color="#fff" />
        <Text style={s.qaTxt}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export default function Dashboard() {
  const { state } = useStore();
  const { addPotty } = useActions();
  const router = useRouter();

  const weeks = ageInWeeks(state.profile.birthdate) ?? 8;
  const idx = currentPhaseIndex(state.profile.birthdate);
  const phase = phases[idx];
  const focus = todaysFocus(state);
  const late = lateKeySkills(state);
  const milestone = nextMilestone(state.profile.birthdate);
  const total = skillTotal(state.skills);
  const socialTotal = socialization.reduce((a, c) => a + c.items.length, 0);
  const socialDone = Object.keys(state.social).length;
  const todayStr = today();
  const pottyToday = state.potty.filter((p) => p.ts.slice(0, 10) === todayStr);
  const accidentsToday = pottyToday.filter((p) => p.kind.startsWith('accident')).length;
  const hot = accidentHotHours(state.potty);
  const sessionsToday = state.sessions.filter((s) => s.ts.slice(0, 10) === todayStr).length;
  const goals = dailyGoals(state);
  const goalsDone = goals.filter((g) => g.done).length;
  const gotBadges = badges(state).filter((b) => b.got);
  const nextBadge = badges(state).find((b) => !b.got);

  return (
    <ScrollView contentContainerStyle={s.wrap} showsVerticalScrollIndicator={false}>
      <Hero
        phaseTitle={phase?.title ?? 'Programme'}
        skillValue={total}
        skillMax={140}
        socialValue={socialDone}
        socialMax={socialTotal}
      />

      <View style={s.body}>
        <FadeIn>
          <Card>
            <Row>
              <Text style={s.h}>Quêtes du jour</Text>
              <Pill tone={goalsDone === goals.length ? 'green' : 'accent'} solid={goalsDone === goals.length}>
                {goalsDone}/{goals.length}
              </Pill>
            </Row>
            {goals.map((g) => (
              <Row key={g.key} style={{ paddingVertical: 3 }}>
                <View style={[s.check, g.done && { backgroundColor: colors.green, borderColor: colors.green }]}>
                  {g.done ? <Text style={s.checkTxt}>✓</Text> : <Icon name={g.icon} size={13} color={colors.ink3} />}
                </View>
                <Text style={[s.goal, g.done && { color: colors.ink3, textDecorationLine: 'line-through' }]}>
                  {g.label}
                </Text>
              </Row>
            ))}
            <Sub>
              Objectif du bilan {milestone.key} : {milestone.min}/140 points de compétences — tu es à {total}.
            </Sub>
          </Card>
        </FadeIn>

        <SectionTitle icon="target">Les 3 priorités du jour</SectionTitle>
        {focus.map(({ tutorial, score, reason }, i) => (
          <FadeIn key={tutorial.code} delay={60 * i}>
            <Card onPress={() => router.push(`/tutos/${tutorial.code}`)}>
              <Row>
                <View style={s.tutIcon}>
                  <Icon name={tutorial.icon} size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{tutorial.title}</Text>
                  <Text style={s.meta}>
                    {tutorial.code} · {reason}
                  </Text>
                </View>
                <Pill tone={score >= 4 ? 'green' : score >= 2 ? 'orange' : 'grey'} solid={score >= 4}>
                  {score}/5
                </Pill>
              </Row>
            </Card>
          </FadeIn>
        ))}

        <SectionTitle icon="drop" right={<Link href="/suivi/proprete" style={s.link}>Journal →</Link>}>
          Propreté du jour
        </SectionTitle>
        <Card>
          <Row>
            <Stat icon="check" tone="green" value={pottyToday.length - accidentsToday} label="DEHORS" />
            <Stat icon="warn" tone={accidentsToday ? 'red' : 'grey'} value={accidentsToday} label="ACCIDENTS" />
            <Stat icon="flame" tone="amber" value={daysWithoutAccident(state.potty)} label="JOURS PROPRES" />
          </Row>
          <Row>
            <QuickAction label="Pipi" icon="drop" gradient={gradients.green} onPress={() => addPotty('pipi')} />
            <QuickAction label="Caca" icon="check" gradient={gradients.blue} onPress={() => addPotty('caca')} />
            <QuickAction label="Accident" icon="warn" gradient={gradients.coral} onPress={() => addPotty('accident-pipi')} />
          </Row>
        </Card>

        {hot.length > 0 ? (
          <Card style={{ backgroundColor: colors.amberSoft }}>
            <Row>
              <Icon name="clock" size={19} color={colors.orange} />
              <Text style={[s.cardTitle, { color: colors.orange }]}>Sortie manquante détectée</Text>
            </Row>
            <Rich
              text={`Tu as ${hot[0].count} accidents autour de **${hot[0].hour}h**. Ajoute une sortie 20 min avant ce créneau pendant 5 jours (fiche A01).`}
            />
            <Link href="/aleas/A01" style={s.link}>
              Ouvrir la fiche A01 →
            </Link>
          </Card>
        ) : null}

        {late.length > 0 ? (
          <Card style={{ backgroundColor: colors.redSoft }}>
            <Row>
              <Icon name="warn" size={19} color={colors.red} />
              <Text style={[s.cardTitle, { color: colors.red }]}>Compétences clés en retard</Text>
            </Row>
            {late.map((l) => (
              <Text key={l.code} style={s.meta}>
                {l.code} · {l.name} — {l.score}/5 (cible {l.target})
              </Text>
            ))}
            <Link href="/suivi/competences" style={s.link}>
              Mettre à jour les notes →
            </Link>
          </Card>
        ) : null}

        <SectionTitle icon="trophy" right={<Link href="/suivi" style={s.link}>Tout voir →</Link>}>
          Trophées
        </SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
          {gotBadges.map((b) => (
            <View key={b.code} style={[s.badge, shadow.soft]}>
              <LinearGradient colors={grad(gradients.amber)} style={s.badgeIcon}>
                <Icon name={b.icon} size={20} color="#fff" />
              </LinearGradient>
              <Text style={s.badgeName}>{b.name}</Text>
            </View>
          ))}
          {nextBadge ? (
            <View style={[s.badge, { opacity: 0.6 }]}>
              <View style={[s.badgeIcon, { backgroundColor: '#ece7f6' }]}>
                <Icon name="lock" size={19} color={colors.ink3} />
              </View>
              <Text style={s.badgeName}>{nextBadge.name}</Text>
              <Text style={s.badgeHint}>{nextBadge.hint}</Text>
            </View>
          ) : null}
        </ScrollView>

        <SectionTitle icon="clock">Le rituel du jour</SectionTitle>
        <Card>
          <Row>
            <Icon name="clicker" size={17} />
            <Text style={s.meta}>
              {sessionsToday} séance{sessionsToday > 1 ? 's' : ''} aujourd'hui — objectif 3 à 5 séances de 2 minutes.
            </Text>
          </Row>
          <Row>
            <Icon name="alone" size={17} />
            <Text style={s.meta}>
              Solitude : {weeks < 12 ? '30 s → 3 min, tous les jours' : weeks < 26 ? 'monter vers 1 h' : 'entretenir 2–3 h'}.
            </Text>
          </Row>
          <Row>
            <Icon name="brush" size={17} />
            <Text style={s.meta}>Manipulation / toilettage : 60 secondes (T10).</Text>
          </Row>
          <Row>
            <Icon name="nose" size={17} />
            <Text style={s.meta}>Un jeu de flair et une mastication avant la crise du soir.</Text>
          </Row>
        </Card>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 34 },
  body: { paddingHorizontal: 14, paddingTop: 14, gap: 11 },
  h: { ...type.h3, color: colors.ink, flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  meta: { ...type.small, color: colors.ink3, lineHeight: 18, flex: 1 },
  link: { color: colors.accent, fontWeight: '800', fontSize: 12.5 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTxt: { color: '#fff', fontSize: 13, fontWeight: '900' },
  goal: { ...type.body, color: colors.ink, flex: 1, fontSize: 13.5 },
  tutIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qa: { borderRadius: 15, paddingVertical: 12, alignItems: 'center', gap: 3 },
  qaTxt: { color: '#fff', fontSize: 12.5, fontWeight: '800' },
  badge: {
    width: 104,
    backgroundColor: '#fff',
    borderRadius: radius,
    padding: 11,
    alignItems: 'center',
    gap: 5,
  },
  badgeIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeName: { fontSize: 12, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  badgeHint: { fontSize: 9.5, fontWeight: '600', color: colors.ink3, textAlign: 'center' },
});
