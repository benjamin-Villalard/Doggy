import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import GrowthChart from '../../components/GrowthChart';
import Icon from '../../components/Icon';
import ScreenHeader from '../../components/ScreenHeader';
import { Button, Card, Pill, Row, SectionTitle, Sub } from '../../components/UI';
import {
  daySummary,
  eliminationAlerts,
  eliminationRef,
  foodPlan,
  localToday,
  waterPlan,
} from '../../lib/daily';
import { centileLabel, fmtG, growthAlerts, growthBasis, growthPoints, projectedAdult } from '../../lib/growth';
import { frDate, healthAlerts, mealsForAge, nextDeworming, vaccinePlan } from '../../lib/health';
import { ageInDays, ageInWeeks, ageLabel, lastWeightG, today, useActions, useStore } from '../../lib/store';
import { colors, radiusSm, type } from '../../lib/theme';
import { useVoice } from '../../lib/voice';

const bgOf = { red: colors.redSoft, orange: colors.orangeSoft, blue: colors.blueSoft, green: colors.greenSoft };
const fgOf = { red: colors.red, orange: colors.orange, blue: colors.blue, green: colors.green };

export default function Carnet() {
  const { state } = useStore();
  const { addPotty, addWater, addMeal, addWeight } = useActions();
  const router = useRouter();
  const voice = useVoice();
  const p = state.profile;
  const weeks = ageInWeeks(p.birthdate);
  const days = ageInDays(p.birthdate);
  const grams = lastWeightG(state.weights);
  const basis = growthBasis(p);
  const points = growthPoints(p.birthdate, state.weights, basis);
  const projected = projectedAdult(points, basis);
  const last = points[points.length - 1];
  const gAlerts = growthAlerts(points, basis, days);
  const meals = state.health.meals || mealsForAge(weeks).meals;
  const food = foodPlan(grams, projected ?? basis.adultG, weeks, state.health, meals);
  const water = waterPlan(grams, weeks);
  const ref = eliminationRef(weeks);
  const todaySum = daySummary(localToday(), state.potty, state.water, state.meals);
  const dAlerts = eliminationAlerts(state.potty, state.water, water);
  const reminders = healthAlerts(state);
  const plan = vaccinePlan(p, state.health);
  const nextVaccine = plan.find((x) => x.status !== 'fait' && x.due && !x.vaccine.optional);
  const worm = nextDeworming(p, state.health);
  const months = days === null ? 4 : days < 110 ? 4 : days < 170 ? 6 : 12;
  const [newWeight, setNewWeight] = useState('');
  const missingParams = !p.birthWeightG || !p.motherWeightG || !p.fatherWeightG;

  const urgent = [
    ...dAlerts,
    ...gAlerts.filter((a) => a.level === 'red' || a.level === 'orange'),
  ];

  const saveWeight = () => {
    const g = Number(newWeight.replace(',', '.'));
    if (!g || g <= 0) return;
    addWeight(today(), g < 20 ? Math.round(g * 1000) : Math.round(g));
    setNewWeight('');
  };

  return (
    <ScrollView contentContainerStyle={s.wrap} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title={`Carnet de ${voice.name}`}
        subtitle={`${p.breed || 'Yorkshire Biewer'} · ${ageLabel(p.birthdate)}`}
        icon="heart"
        right={
          <Pressable onPress={() => router.push('/reglages')} hitSlop={10} accessibilityLabel="Réglages">
            <Icon name="settings" size={22} color="#fff" />
          </Pressable>
        }
      />
      <View style={s.body}>
        {/* Identité */}
        <Card>
          <Row>
            <Text style={s.avatar}>{p.avatar}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{p.name || 'Mon chien'}</Text>
              <Text style={s.meta}>
                {p.breed || 'Yorkshire Biewer'} · {p.sex === 'male' ? 'mâle' : p.sex === 'female' ? 'femelle' : 'sexe ?'}
                {p.birthdate ? ` · né le ${frDate(p.birthdate)}` : ''}
              </Text>
              {state.health.chip ? <Text style={s.meta}>Puce {state.health.chip}</Text> : null}
            </View>
          </Row>
          <Row style={{ gap: 8 }}>
            <Big label="Poids" value={grams ? fmtG(grams) : '—'} sub={last ? centileLabel(last.z) : 'à peser'} />
            <Big label="Adulte attendu" value={fmtG(basis.adultG)} sub={projected ? `projeté ${fmtG(projected)}` : 'selon parents'} />
            <Big label="Âge" value={weeks !== null ? `${weeks} sem.` : '—'} sub={ageLabel(p.birthdate)} />
          </Row>
        </Card>

        {/* Alertes */}
        {urgent.map((a) => (
          <Card key={a.title} style={{ backgroundColor: bgOf[a.level] }}>
            <Row>
              <Icon name="warn" size={18} color={fgOf[a.level]} />
              <Text style={[s.h, { color: fgOf[a.level], flex: 1 }]}>{a.title}</Text>
            </Row>
            <Text style={s.text}>{a.text}</Text>
            {a.level === 'red' ? (
              <Button small tone="red" title="Gestes d'urgence" icon="bolt" onPress={() => router.push('/sante/urgences')} />
            ) : null}
          </Card>
        ))}

        {/* Courbe */}
        <SectionTitle icon="chart" right={<Pill tone="accent">{months} premiers mois</Pill>}>
          Courbe de croissance
        </SectionTitle>
        <Card onPress={() => router.push('/carnet/poids')}>
          <GrowthChart points={points} basis={basis} months={months} ageDays={days} projectedAdultG={projected} height={200} />
          {gAlerts
            .filter((a) => a.level === 'green' || a.level === 'blue')
            .map((a) => (
              <Text key={a.title} style={[s.meta, { color: fgOf[a.level] }]}>
                {a.title} · {a.text}
              </Text>
            ))}
          <Text style={s.link}>Courbe complète, pesées et paramètres ›</Text>
        </Card>
        {missingParams ? (
          <Card onPress={() => router.push('/carnet/poids')} style={{ backgroundColor: colors.amberSoft }}>
            <Row>
              <Icon name="scale" size={18} color={colors.orange} />
              <Text style={[s.h, { flex: 1 }]}>Affine sa courbe attendue</Text>
              <Text style={s.chev}>›</Text>
            </Row>
            <Text style={s.text}>
              Renseigne {[!p.birthWeightG && 'son poids de naissance', !p.motherWeightG && 'le poids de la mère', !p.fatherWeightG && 'le poids du père']
                .filter(Boolean)
                .join(', ')}
              . Base actuelle : {basis.detail}.
            </Text>
          </Card>
        ) : null}
        <Card tone="flat">
          <Row>
            <TextInput
              value={newWeight}
              onChangeText={setNewWeight}
              placeholder="Pesée du jour (g)"
              placeholderTextColor={colors.ink3}
              keyboardType="numeric"
              style={s.input}
              onSubmitEditing={saveWeight}
            />
            <Button small title="Peser" icon="scale" onPress={saveWeight} disabled={!newWeight} />
          </Row>
        </Card>

        {/* Rappels */}
        <SectionTitle icon="syringe">Rappels santé</SectionTitle>
        <Card onPress={() => router.push('/sante/vaccins')}>
          {reminders.length ? (
            reminders.slice(0, 4).map((r) => (
              <Row key={r.label + r.due}>
                <Pill tone={r.days < 0 ? 'red' : 'orange'}>{r.days < 0 ? `retard ${-r.days} j` : r.days === 0 ? "aujourd'hui" : `J-${r.days}`}</Pill>
                <Text style={[s.text, { flex: 1 }]}>
                  {r.label} · {frDate(r.due)}
                </Text>
              </Row>
            ))
          ) : (
            <Text style={s.text}>Rien d'urgent dans les 14 prochains jours.</Text>
          )}
          {nextVaccine && !reminders.some((r) => r.label === nextVaccine.vaccine.label) ? (
            <Text style={s.meta}>
              Prochain vaccin : {nextVaccine.vaccine.label} vers le {frDate(nextVaccine.due as string)}
            </Text>
          ) : null}
          {worm.due && !reminders.some((r) => r.kind === 'vermifuge') ? (
            <Text style={s.meta}>Prochain vermifuge : {frDate(worm.due)}</Text>
          ) : null}
          <Text style={s.link}>Vaccins, vermifuges et calendrier ›</Text>
        </Card>

        {/* Aujourd'hui */}
        <SectionTitle icon="bowl">Aujourd'hui</SectionTitle>
        <Row style={{ gap: 10, alignItems: 'stretch' }}>
          <Card style={{ flex: 1 }} onPress={() => router.push('/sante/nutrition')}>
            <Icon name="bowl" size={18} color={colors.orange} />
            <Text style={s.kpi}>{food ? `${food.kibbleG} g` : '—'}</Text>
            <Text style={s.meta}>croquettes / jour</Text>
            {food ? (
              <Text style={s.small}>
                {food.meals} repas de ~{food.perMealG} g{food.densityEstimated ? ' · aliment à renseigner' : ''}
              </Text>
            ) : (
              <Text style={s.small}>Pèse-le pour calculer</Text>
            )}
            <Text style={s.progress}>Servi : {todaySum.foodG} g</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Icon name="drop" size={18} color={colors.sky} />
            <Text style={s.kpi}>{water ? `${water.low}-${water.high}` : '—'}</Text>
            <Text style={s.meta}>ml d'eau / jour</Text>
            <Text style={s.small}>{water ? `${water.perKg}, eau à volonté` : 'Pèse-le pour calculer'}</Text>
            <Text style={s.progress}>Noté : {todaySum.waterMl} ml</Text>
          </Card>
        </Row>
        <Row style={{ gap: 10, alignItems: 'stretch' }}>
          <Counter
            icon="pee"
            label="Pipis"
            count={todaySum.pee}
            range={ref.pee}
            color={colors.amber}
          />
          <Counter icon="paw" label="Selles" count={todaySum.poop} range={ref.poop} color={colors.orange} />
        </Row>
        <Sub>Repère à son âge : {ref.tip}.</Sub>

        <Card>
          <Text style={s.h}>Saisie rapide</Text>
          <View style={s.quick}>
            <Quick label="Pipi" icon="pee" color={colors.amber} onPress={() => addPotty('pipi')} />
            <Quick label="Caca" icon="paw" color={colors.orange} onPress={() => router.push('/carnet/selle')} />
            <Quick label="Accident" icon="warn" color={colors.red} onPress={() => addPotty('accident-pipi')} />
            <Quick label="+50 ml" icon="drop" color={colors.sky} onPress={() => addWater(50)} />
            <Quick label="+25 ml" icon="drop" color={colors.sky} onPress={() => addWater(25)} />
            <Quick
              label={food ? `Repas ${food.perMealG} g` : 'Repas'}
              icon="bowl"
              color={colors.green}
              onPress={() => addMeal(food?.perMealG ?? 0)}
            />
          </View>
          <Text style={s.link} onPress={() => router.push('/carnet/journal')}>
            Journal du jour et historique ›
          </Text>
        </Card>

        <Card onPress={() => router.push('/carnet/selle')} tone="flat">
          <Row>
            <Icon name="eye" size={18} color={colors.accent} />
            <Text style={[s.h, { flex: 1 }]}>Couleur et aspect des selles : le guide</Text>
            <Text style={s.chev}>›</Text>
          </Row>
        </Card>

        <Sub>
          Estimations indicatives (modèle de croissance toy, besoins énergétiques NRC/AAHA). Elles ne remplacent pas l'avis de
          ton vétérinaire.
        </Sub>
      </View>
    </ScrollView>
  );
}

function Big({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={s.big}>
      <Text style={s.bigLabel}>{label}</Text>
      <Text style={s.bigValue}>{value}</Text>
      <Text style={s.bigSub}>{sub}</Text>
    </View>
  );
}

function Counter({ icon, label, count, range, color }: { icon: string; label: string; count: number; range: number[]; color: string }) {
  const ok = count >= range[0];
  return (
    <Card style={{ flex: 1 }}>
      <Row>
        <Icon name={icon} size={18} color={color} />
        <Text style={[s.h, { flex: 1 }]}>{label}</Text>
        <Pill tone={ok ? 'green' : 'grey'}>
          {range[0]}-{range[1]}
        </Pill>
      </Row>
      <Text style={s.kpi}>{count}</Text>
      <Text style={s.meta}>aujourd'hui</Text>
    </Card>
  );
}

function Quick({ label, icon, color, onPress }: { label: string; icon: string; color: string; onPress: () => void }) {
  const [flash, setFlash] = useState(false);
  return (
    <Pressable
      onPress={() => {
        onPress();
        setFlash(true);
        setTimeout(() => setFlash(false), 700);
      }}
      style={[s.qbtn, flash && { backgroundColor: colors.greenSoft, borderColor: colors.green }]}
    >
      <Icon name={flash ? 'check' : icon} size={20} color={flash ? colors.green : color} />
      <Text style={s.qlabel}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 40 },
  body: { padding: 16, gap: 12, marginTop: -18 },
  avatar: { fontSize: 40 },
  name: { ...type.h2, color: colors.ink },
  h: { fontSize: 15, fontWeight: '800', color: colors.ink },
  text: { fontSize: 13.5, lineHeight: 19, color: colors.ink2 },
  meta: { fontSize: 12.5, color: colors.ink3, lineHeight: 17 },
  small: { fontSize: 11.5, color: colors.ink3, lineHeight: 15 },
  link: { fontSize: 13, fontWeight: '800', color: colors.accent, marginTop: 4 },
  chev: { fontSize: 22, color: colors.ink3 },
  big: { flex: 1, backgroundColor: colors.accentSoft, borderRadius: radiusSm, padding: 10, gap: 1 },
  bigLabel: { fontSize: 11, fontWeight: '700', color: colors.ink3 },
  bigValue: { fontSize: 17, fontWeight: '900', color: colors.accentDeep },
  bigSub: { fontSize: 11, color: colors.ink2 },
  kpi: { fontSize: 24, fontWeight: '900', color: colors.ink, marginTop: 4 },
  progress: { fontSize: 12, fontWeight: '700', color: colors.ink2, marginTop: 4 },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: '#fff',
  },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qbtn: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: radiusSm,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: '#fff',
  },
  qlabel: { fontSize: 12, fontWeight: '800', color: colors.ink },
});
