import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, Stepper, Toggle } from '../../components/Form';
import Icon from '../../components/Icon';
import { Card, Pill, Row, SectionTitle, Stat, Sub } from '../../components/UI';
import { foodPlan, waterPlan } from '../../lib/daily';
import { growthBasis, growthPoints, projectedAdult } from '../../lib/growth';
import { health, mealsForAge } from '../../lib/health';
import { ageInWeeks, lastWeightG, useActions, useStore } from '../../lib/store';
import { colors, type } from '../../lib/theme';
import { useVoice } from '../../lib/voice';

export default function Nutrition() {
  const { state } = useStore();
  const { setHealth } = useActions();
  const voice = useVoice();
  const weeks = ageInWeeks(state.profile.birthdate);
  const grams = lastWeightG(state.weights);
  const meals = state.health.meals || mealsForAge(weeks).meals;
  const basis = growthBasis(state.profile);
  const adult = projectedAdult(growthPoints(state.profile.birthdate, state.weights, basis), basis) ?? basis.adultG;
  const needs = foodPlan(grams, adult, weeks, state.health, meals);
  const water = waterPlan(grams, weeks);
  const perDay = needs ? needs.kibbleG : null;
  const perMeal = needs ? needs.perMealG : null;
  const treats = needs ? needs.treatsG : null;

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Card>
        <Row>
          <Icon name="bowl" size={18} color={colors.green} />
          <Text style={s.h}>La ration de {voice.name}</Text>
          <Pill tone={perDay ? 'green' : 'grey'}>{perDay ? `${perDay} g/j` : 'à compléter'}</Pill>
        </Row>
        {needs ? (
          <>
            <Row style={{ justifyContent: 'space-between' }}>
              <Stat label="Poids" value={`${grams} g`} />
              <Stat label="Besoin" value={`${needs.kcal} kcal`} tone="green" />
              <Stat label="Repas" value={`${meals}/j`} tone="accent" />
            </Row>
            <Sub>
              Calcul : RER = 70 × ({(grams as number) / 1000} kg)^0,75 = {needs.rer} kcal, puis {needs.factorLabel} (poids adulte attendu {adult} g). Croquettes = 90 % des kcal à {needs.density} kcal/100 g{needs.densityEstimated ? ' (valeur moyenne, renseigne ton paquet)' : ''}, fourchette {needs.low}-{needs.high} g. Ajuste selon sa silhouette.
            </Sub>
            {perDay ? (
              <Card tone="flat">
                <Text style={s.big}>
                  {perDay} g par jour → {perMeal} g par repas
                </Text>
                {water ? (
                  <Text style={s.big}>
                    Eau : {water.low}-{water.high} ml par jour ({water.perKg}), toujours à volonté
                  </Text>
                ) : null}
                <Sub>
                  Les friandises d'éducation comptent dans la ration : garde environ {treats} g par jour prélevés sur les
                  croquettes de {voice.name}, sinon la balance grimpe vite chez un toy.
                </Sub>
              </Card>
            ) : (
              <Sub>Renseigne les kcal/100 g de l'aliment (sur le paquet) pour obtenir la ration en grammes.</Sub>
            )}
          </>
        ) : (
          <Sub>Ajoute une pesée dans le carnet Poids pour calculer le besoin énergétique et la ration.</Sub>
        )}
      </Card>

      <SectionTitle icon="settings">Mon aliment</SectionTitle>
      <Card>
        <Field
          label="Marque / référence"
          value={state.health.foodBrand}
          onChangeText={(v) => setHealth({ foodBrand: v })}
          placeholder="ex. croquettes junior mini"
        />
        <Field
          label="Densité énergétique (kcal / 100 g)"
          value={state.health.foodKcal === null ? '' : String(state.health.foodKcal)}
          onChangeText={(v) => setHealth({ foodKcal: v.trim() === '' ? null : Number(v.replace(',', '.')) })}
          placeholder="ex. 390"
          keyboardType="numeric"
          hint="Indiqué sur l'emballage, souvent « énergie métabolisable »."
        />
        <Stepper
          label="Nombre de repas par jour"
          value={meals}
          min={1}
          max={6}
          suffix=" repas"
          onChange={(v) => setHealth({ meals: v })}
          hint={`Repère à cet âge : ${mealsForAge(weeks).meals} repas ${mealsForAge(weeks).label}`}
        />
        <Toggle
          label="Stérilisé(e)"
          value={state.health.sterilized}
          onChange={(v) => setHealth({ sterilized: v })}
          hint="Réduit le besoin énergétique d'environ 15 % à l'âge adulte."
        />
      </Card>

      <SectionTitle icon="check">Les règles Yorkshire</SectionTitle>
      <Card>
        {health.nutrition.rules.map((r) => (
          <Text key={r} style={s.bullet}>
            • {r}
          </Text>
        ))}
      </Card>

      <SectionTitle icon="treat">Friandises d'éducation</SectionTitle>
      <Card style={{ backgroundColor: colors.greenSoft }}>
        {health.nutrition.treats.map((t) => (
          <Text key={t} style={s.bullet}>
            • {t}
          </Text>
        ))}
      </Card>

      <SectionTitle icon="clock">Repas selon l'âge</SectionTitle>
      <Card>
        {health.nutrition.meals.map((m) => {
          const active = (weeks ?? 8) < m.untilWeeks;
          return (
            <Row key={m.label} style={active ? { backgroundColor: colors.accentSoft, borderRadius: 10, padding: 6 } : undefined}>
              <Text style={[s.line, active && { color: colors.accent, fontWeight: '800' }]}>{m.label}</Text>
              <Pill tone={active ? 'accent' : 'grey'}>{m.meals} repas</Pill>
            </Row>
          );
        })}
        <Sub>{health.disclaimer}</Sub>
      </Card>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 10, paddingBottom: 40 },
  h: { fontSize: 14.5, fontWeight: '700', color: colors.ink, flex: 1 },
  big: { fontSize: 17, fontWeight: '800', color: colors.green },
  bullet: { fontSize: 13, fontWeight: '600', color: colors.ink2, lineHeight: 19 },
  line: { ...type.small, color: colors.ink2, flex: 1 },
});
