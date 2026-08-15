import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/Icon';
import ScreenHeader from '../../components/ScreenHeader';
import { Card, FadeIn, Pill, Progress, Row, Sub } from '../../components/UI';
import { currentPhaseIndex } from '../../lib/coach';
import { phaseRanges, phaseTutorials, phases } from '../../lib/content';
import { ageInWeeks, useStore } from '../../lib/store';
import { colors, gradients, shadow, type } from '../../lib/theme';

export default function Programme() {
  const { state } = useStore();
  const router = useRouter();
  const weeks = ageInWeeks(state.profile.birthdate);
  const idx = currentPhaseIndex(state.profile.birthdate);

  return (
    <ScrollView contentContainerStyle={s.wrap} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Ton parcours"
        subtitle={`${phases.length} phases · phase ${idx} en cours${weeks !== null ? ` (${weeks} sem.)` : ''}`}
        icon="target"
      />

      <View style={s.body}>
        <Sub>
          Chaque étape du chemin a ses objectifs, ses tutoriels et ses aléas typiques. Les étapes passées restent
          accessibles : on entretient toujours les acquis.
        </Sub>

        {phases.map((p, i) => {
          const codes = phaseTutorials[phaseRanges[i].title] ?? [];
          const done = codes.filter((c) => (state.skills[c] ?? 0) >= 4).length;
          const active = i === idx;
          const past = i < idx;
          const complete = codes.length > 0 && done === codes.length;
          const state_ = complete ? 'done' : active ? 'active' : past ? 'past' : 'locked';

          return (
            <FadeIn key={p.title} delay={i * 50}>
              <View style={s.step}>
                <View style={s.rail}>
                  <View
                    style={[
                      s.node,
                      state_ === 'done' && { backgroundColor: colors.green },
                      state_ === 'active' && { backgroundColor: colors.accent },
                      state_ === 'past' && { backgroundColor: colors.blue },
                    ]}
                  >
                    {state_ === 'done' ? (
                      <Text style={s.nodeTxt}>✓</Text>
                    ) : state_ === 'locked' ? (
                      <Icon name="lock" size={14} color={colors.ink3} />
                    ) : (
                      <Text style={s.nodeTxt}>{i + 1}</Text>
                    )}
                  </View>
                  {i < phases.length - 1 ? <View style={s.line} /> : null}
                </View>

                <Pressable style={{ flex: 1 }} onPress={() => router.push(`/programme/${i}`)}>
                  <Card
                    style={
                      active
                        ? { borderWidth: 2, borderColor: colors.accent, ...shadow.card }
                        : state_ === 'locked'
                          ? { opacity: 0.72 }
                          : undefined
                    }
                  >
                    <Row>
                      <View style={[s.pIcon, active && { backgroundColor: colors.accent }]}>
                        <Icon name={p.icon} size={19} color={active ? '#fff' : colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.title}>{p.title}</Text>
                        <Text style={s.meta}>
                          {phaseRanges[i].from}
                          {phaseRanges[i].to < 900 ? `–${phaseRanges[i].to}` : '+'} semaines · {codes.length} tutoriels
                        </Text>
                      </View>
                      {active ? <Pill tone="accent" solid>en cours</Pill> : complete ? <Pill tone="green" solid>validée</Pill> : null}
                    </Row>
                    <Progress
                      value={done}
                      max={codes.length}
                      label="Compétences à 4/5"
                      gradient={active ? gradients.accent : gradients.blue}
                    />
                  </Card>
                </Pressable>
              </View>
            </FadeIn>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 36 },
  body: { paddingHorizontal: 14, paddingTop: 14, gap: 4 },
  step: { flexDirection: 'row', gap: 11 },
  rail: { alignItems: 'center', width: 30, paddingTop: 20 },
  node: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#e6e0f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeTxt: { color: '#fff', fontSize: 13, fontWeight: '900' },
  line: { flex: 1, width: 3, backgroundColor: colors.line, marginVertical: 3, borderRadius: 3 },
  pIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.h3, color: colors.ink, fontSize: 15 },
  meta: { ...type.small, color: colors.ink3 },
});
