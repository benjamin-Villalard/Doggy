import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DateField, Field, Segmented } from '../../components/Form';
import GrowthChart from '../../components/GrowthChart';
import Icon from '../../components/Icon';
import { Button, Card, Pill, Row, SectionTitle, Sub } from '../../components/UI';
import { frDate } from '../../lib/health';
import {
  centileLabel,
  expectedGainPerDay,
  fmtG,
  growthAlerts,
  growthBasis,
  growthPoints,
  projectedAdult,
  weighingInterval,
} from '../../lib/growth';
import { ageInDays, today, useActions, useStore } from '../../lib/store';
import { colors, type } from '../../lib/theme';

const num = (v: string) => {
  const n = Number(v.replace(',', '.'));
  return v.trim() === '' || !n || n <= 0 ? null : Math.round(n);
};
const fgOf = { red: colors.red, orange: colors.orange, blue: colors.blue, green: colors.green };
const bgOf = { red: colors.redSoft, orange: colors.orangeSoft, blue: colors.blueSoft, green: colors.greenSoft };

export default function Poids() {
  const { state } = useStore();
  const { addWeight, removeWeight, setProfile } = useActions();
  const p = state.profile;
  const days = ageInDays(p.birthdate);
  const basis = growthBasis(p);
  const points = growthPoints(p.birthdate, state.weights, basis);
  const projected = projectedAdult(points, basis);
  const alerts = growthAlerts(points, basis, days);
  const [months, setMonths] = useState<number>(days !== null && days > 170 ? 12 : days !== null && days > 110 ? 6 : 4);
  const [date, setDate] = useState(today());
  const [grams, setGrams] = useState('');
  const [birth, setBirth] = useState(p.birthWeightG ? String(p.birthWeightG) : '');
  const [mother, setMother] = useState(p.motherWeightG ? String(p.motherWeightG) : '');
  const [father, setFather] = useState(p.fatherWeightG ? String(p.fatherWeightG) : '');

  const save = () => {
    const g = Number(grams.replace(',', '.'));
    if (!g) return;
    addWeight(date, g < 20 ? Math.round(g * 1000) : Math.round(g));
    setGrams('');
  };

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Card>
        <Segmented<number>
          value={months}
          onChange={setMonths}
          options={[
            { value: 4, label: '0-4 mois' },
            { value: 6, label: '0-6 mois' },
            { value: 12, label: '0-12 mois' },
          ]}
        />
        <GrowthChart points={points} basis={basis} months={months} ageDays={days} projectedAdultG={projected} />
        {!p.birthdate ? <Text style={[s.text, { color: colors.red }]}>Renseigne sa date de naissance dans les réglages.</Text> : null}
      </Card>

      {alerts.map((a) => (
        <Card key={a.title} style={{ backgroundColor: bgOf[a.level] }}>
          <Text style={[s.h, { color: fgOf[a.level] }]}>{a.title}</Text>
          <Text style={s.text}>{a.text}</Text>
        </Card>
      ))}

      <SectionTitle icon="scale">Nouvelle pesée</SectionTitle>
      <Card>
        <DateField label="Date de la pesée" value={date} onChange={setDate} allowFuture={false} />
        <Field label="Poids (grammes)" value={grams} onChangeText={setGrams} keyboardType="numeric" placeholder="ex. 850" hint="Balance de cuisine au gramme, toujours à la même heure, avant le repas." />
        <Button title="Enregistrer la pesée" icon="check" onPress={save} disabled={!grams} />
        {days !== null ? <Sub>Rythme conseillé : {weighingInterval(days).label}.</Sub> : null}
      </Card>

      <SectionTitle icon="target">Courbe attendue</SectionTitle>
      <Card>
        <Row style={{ gap: 8 }}>
          <View style={s.box}>
            <Text style={s.boxLabel}>Adulte attendu</Text>
            <Text style={s.boxValue}>{fmtG(basis.adultG)}</Text>
          </View>
          <View style={s.box}>
            <Text style={s.boxLabel}>Projeté (pesées)</Text>
            <Text style={s.boxValue}>{projected ? fmtG(projected) : '—'}</Text>
          </View>
          <View style={s.box}>
            <Text style={s.boxLabel}>Naissance</Text>
            <Text style={s.boxValue}>{fmtG(basis.birthG)}</Text>
          </View>
        </Row>
        <Text style={s.meta}>Calcul : {basis.detail}{basis.birthEstimated ? ' ; poids de naissance estimé' : ''}.</Text>
        <Field label="Poids à la naissance (g)" value={birth} onChangeText={setBirth} keyboardType="numeric" placeholder="ex. 110" hint="Noté par l'éleveur. Un Biewer naît en général entre 90 et 150 g." />
        <Field label="Poids adulte de la mère (g)" value={mother} onChangeText={setMother} keyboardType="numeric" placeholder="ex. 2300" />
        <Field label="Poids adulte du père (g)" value={father} onChangeText={setFather} keyboardType="numeric" placeholder="ex. 2700" />
        <Button
          title="Mettre à jour la courbe"
          onPress={() => setProfile({ birthWeightG: num(birth), motherWeightG: num(mother), fatherWeightG: num(father) })}
        />
      </Card>

      <SectionTitle icon="chart">Historique</SectionTitle>
      {points.length === 0 ? <Sub>Aucune pesée pour l'instant.</Sub> : null}
      {[...points].reverse().map((pt, i, arr) => {
        const prev = arr[i + 1];
        const gainDay = prev && pt.t > prev.t ? (pt.grams - prev.grams) / (pt.t - prev.t) : null;
        const exp = expectedGainPerDay(pt.t, basis);
        return (
          <Card key={pt.id} tone="flat">
            <Row>
              <View style={{ flex: 1 }}>
                <Text style={s.h}>
                  {fmtG(pt.grams)} <Text style={s.meta}>· {frDate(pt.date)} · {Math.floor(pt.t / 7)} sem. {pt.t % 7} j</Text>
                </Text>
                <Text style={s.meta}>
                  attendu {fmtG(pt.expected)}
                  {gainDay !== null ? ` · ${gainDay >= 0 ? '+' : ''}${gainDay.toFixed(1)} g/j (attendu ~${exp.toFixed(0)})` : ''}
                </Text>
              </View>
              <Pill tone={pt.z < -1.88 || pt.z > 1.88 ? 'orange' : 'accent'}>{centileLabel(pt.z)}</Pill>
              <Button small tone="ghost" title="Suppr." onPress={() => removeWeight(pt.id)} />
            </Row>
          </Card>
        );
      })}

      <Card style={{ backgroundColor: colors.blueSoft }}>
        <Row>
          <Icon name="book" size={17} color={colors.blue} />
          <Text style={[s.h, { color: colors.blue }]}>Comment lire la courbe</Text>
        </Row>
        <Text style={s.text}>• Comme en pédiatrie, ce qui compte est qu'il reste dans son couloir. Changer d'un couloir entier (ex. P50 → P15) en quelques semaines est un signal.</Text>
        <Text style={s.text}>• La courbe attendue suit un modèle de Gompertz calé sur les races toy : environ 45 % du poids adulte à 3 mois, 85 % à 6 mois, croissance terminée vers 10-12 mois.</Text>
        <Text style={s.text}>• Les couloirs s'élargissent avec l'âge : à la naissance on connaît son poids, à l'âge adulte l'incertitude est d'environ ± 20 %.</Text>
        <Text style={s.text}>• Un chiot toy ne doit jamais perdre de poids : appelle le vétérinaire.</Text>
        <Sub>Courbes indicatives, elles ne remplacent pas le suivi vétérinaire.</Sub>
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, gap: 12, paddingBottom: 40 },
  h: { fontSize: 15, fontWeight: '800', color: colors.ink },
  text: { ...type.body, fontSize: 13.5, lineHeight: 19, color: colors.ink2 },
  meta: { fontSize: 12.5, color: colors.ink3, fontWeight: '500' },
  box: { flex: 1, backgroundColor: colors.accentSoft, borderRadius: 14, padding: 10 },
  boxLabel: { fontSize: 11, color: colors.ink3, fontWeight: '700' },
  boxValue: { fontSize: 17, fontWeight: '900', color: colors.accentDeep },
});
