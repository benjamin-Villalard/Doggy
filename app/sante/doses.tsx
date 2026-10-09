import { Stack } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field } from '../../components/Form';
import Icon from '../../components/Icon';
import Rich from '../../components/Rich';
import { Card, Chip, Pill, Row, SectionTitle, Sub } from '../../components/UI';
import { clinical, doseFor, fluidDeficitMl, ingestedDose, maintenanceMlH, toxinBand } from '../../lib/clinical';
import { lastWeightG, useStore } from '../../lib/store';
import { colors, radiusSm, type } from '../../lib/theme';

export default function Doses() {
  const { state } = useStore();
  const stored = lastWeightG(state.weights);
  const [w, setW] = useState(stored ? (stored / 1000).toFixed(2) : '');
  const edited = useRef(false);

  useEffect(() => {
    if (!edited.current && stored) setW((stored / 1000).toFixed(2));
  }, [stored]);

  const kg = Number(w.replace(',', '.'));
  const valid = isFinite(kg) && kg > 0;

  const [toxIdx, setToxIdx] = useState(0);
  const [contentIdx, setContentIdx] = useState(0);
  const [qty, setQty] = useState('');
  const [mgTotal, setMgTotal] = useState('');

  const toxin = clinical.toxins[toxIdx];
  const content = toxin.content[contentIdx];

  const exposure = useMemo(() => {
    if (!valid) return null;
    const direct = Number(mgTotal.replace(',', '.'));
    if (mgTotal && isFinite(direct) && direct > 0) return { mgPerKg: Math.round((direct / kg) * 100) / 100, from: 'mg ingérés' };
    const grams = Number(qty.replace(',', '.'));
    if (content && qty && isFinite(grams) && grams > 0) {
      const d = ingestedDose(grams, content.mgPerG, kg);
      return d === null ? null : { mgPerKg: d, from: `${grams} g de ${content.label.toLowerCase()}` };
    }
    return null;
  }, [valid, kg, qty, mgTotal, content]);

  const band = exposure ? toxinBand(toxin, exposure.mgPerKg) : null;

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Doses & toxiques' }} />

      <Card style={{ backgroundColor: colors.amberSoft }} tone="flat">
        <Row>
          <Icon name="warn" size={17} color={colors.orange} />
          <Text style={[s.h, { color: colors.orange }]}>À vérifier avant toute administration</Text>
        </Row>
        <Sub>
          Ordres de grandeur issus de la littérature vétérinaire, pour un chien. Vérifie systématiquement la
          concentration réelle du flacon, la voie, les contre-indications et l'indication avec ton vétérinaire : chez un
          chien de 2 kg, une erreur de dilution est une erreur de facteur 10.
        </Sub>
      </Card>

      <Card>
        <Field
          label="Poids utilisé pour les calculs (kg)"
          value={w}
          onChangeText={(v) => {
            edited.current = true;
            setW(v);
          }}
          keyboardType="numeric"
          placeholder="2.30"
          hint={
            stored
              ? `Dernier poids enregistré : ${(stored / 1000).toFixed(2)} kg. Pèse avant toute urgence : 200 g d'écart = 10 % de dose.`
              : 'Aucun poids enregistré : ajoute une pesée dans le journal de poids.'
          }
        />
        {valid ? (
          <Row style={{ flexWrap: 'wrap', marginTop: 4 }}>
            <Pill tone="blue">Entretien ≈ {maintenanceMlH(kg)} ml/h</Pill>
            <Pill tone="orange">Déficit 5 % ≈ {fluidDeficitMl(kg, 5)} ml</Pill>
            <Pill tone="red">Déficit 10 % ≈ {fluidDeficitMl(kg, 10)} ml</Pill>
          </Row>
        ) : null}
      </Card>

      <SectionTitle icon="pill">Posologies calculées</SectionTitle>
      {clinical.drugs.map((d) => {
        const r = valid ? doseFor(d, kg) : null;
        return (
          <Card key={d.name} tone="flat">
            <Row>
              <View style={s.icon}>
                <Icon name="pill" size={17} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.h}>{d.name}</Text>
                <Text style={s.meta}>{d.indication}</Text>
              </View>
            </Row>
            <View style={s.doseBox}>
              <Text style={s.doseLine}>
                {d.dose[0] === d.dose[1] ? `${d.dose[0]}` : `${d.dose[0]} – ${d.dose[1]}`} {d.unit}
              </Text>
              {r ? (
                <Text style={s.doseCalc}>
                  → {r.min === r.max ? r.min : `${r.min} – ${r.max}`} {d.unit.split('/')[0]} pour {kg.toFixed(2)} kg
                  {r.mlMin !== null ? ` · ${r.mlMin === r.mlMax ? r.mlMin : `${r.mlMin} – ${r.mlMax}`} ml` : ''}
                </Text>
              ) : (
                <Text style={s.doseCalc}>→ saisis un poids pour calculer</Text>
              )}
            </View>
            <Text style={s.label}>Voie</Text>
            <Rich text={d.route} />
            <Text style={s.label}>Présentation prise en compte</Text>
            <Rich text={d.concLabel} />
            <Text style={s.label}>Note</Text>
            <Rich text={d.note} />
            <View style={[s.block, { backgroundColor: colors.redSoft }]}>
              <Text style={[s.label, { color: colors.red }]}>Contre-indications / précautions</Text>
              <Rich text={d.contra} />
            </View>
          </Card>
        );
      })}

      <SectionTitle icon="cross">Calculateur toxicologique</SectionTitle>
      <Card>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          {clinical.toxins.map((t, i) => (
            <Chip
              key={t.name}
              label={t.name}
              active={i === toxIdx}
              onPress={() => {
                setToxIdx(i);
                setContentIdx(0);
              }}
            />
          ))}
        </ScrollView>

        <Text style={s.h}>{toxin.name}</Text>
        <Text style={s.meta}>{toxin.agent}</Text>

        {toxin.content.length > 0 ? (
          <>
            <Text style={s.label}>Produit ingéré</Text>
            <View style={s.wrapRow}>
              {toxin.content.map((c, i) => (
                <Pressable key={c.label} onPress={() => setContentIdx(i)} style={[s.opt, i === contentIdx && s.optOn]}>
                  <Text style={[s.optText, i === contentIdx && { color: '#fff' }]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
            <Field
              label="Quantité ingérée (g)"
              value={qty}
              onChangeText={setQty}
              keyboardType="numeric"
              placeholder="20"
              hint={content ? `Teneur retenue : ${content.mgPerG} mg/g.` : undefined}
            />
          </>
        ) : null}

        <Field
          label="Ou dose ingérée connue (mg au total)"
          value={mgTotal}
          onChangeText={setMgTotal}
          keyboardType="numeric"
          placeholder="200"
          hint="Utile pour un médicament : nombre de comprimés × dosage."
        />

        {band && exposure ? (
          <View
            style={[
              s.result,
              {
                backgroundColor:
                  band.level >= 3 ? colors.redSoft : band.level === 2 ? colors.orangeSoft : band.level === 1 ? colors.amberSoft : colors.greenSoft,
              },
            ]}
          >
            <Text style={s.resultDose}>
              {exposure.mgPerKg} {toxin.unit || 'mg/kg'}
            </Text>
            <Text style={s.meta}>d'après {exposure.from}</Text>
            <Text style={s.resultEffect}>{band.effect}</Text>
          </View>
        ) : (
          <Sub>Saisis le poids et la quantité pour estimer la dose ingérée en mg/kg.</Sub>
        )}

        <Text style={s.label}>Seuils publiés</Text>
        {toxin.thresholds.length ? (
          toxin.thresholds.map((t) => (
            <Row key={t.dose} style={{ alignItems: 'flex-start' }}>
              <Pill tone="orange">≥ {t.dose}</Pill>
              <Text style={s.meta}>{t.effect}</Text>
            </Row>
          ))
        ) : (
          <Sub>Pas de seuil chiffré consensuel : toute ingestion justifie un appel.</Sub>
        )}
        <Text style={s.label}>Conduite</Text>
        <Rich text={toxin.action} />
        <View style={[s.block, { backgroundColor: colors.accentSoft }]}>
          <Rich text={toxin.note} />
        </View>
        <Sub>
          Les seuils sont indicatifs et la variabilité individuelle est large : l'appel au centre antipoison
          vétérinaire reste la référence, y compris sous les seuils.
        </Sub>
      </Card>
      <View style={{ height: 26 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 11, paddingBottom: 40 },
  h: { fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 },
  meta: { ...type.small, color: colors.ink3, flex: 1 },
  label: { fontSize: 12.5, fontWeight: '800', color: colors.ink2, marginTop: 4 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doseBox: { backgroundColor: colors.blueSoft, borderRadius: radiusSm, padding: 11, gap: 2 },
  doseLine: { fontSize: 15, fontWeight: '800', color: colors.blue },
  doseCalc: { fontSize: 14, fontWeight: '800', color: colors.ink },
  block: { borderRadius: radiusSm, padding: 11, gap: 2, marginTop: 6 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  opt: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f6f4fb',
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  optOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  optText: { fontSize: 12.5, fontWeight: '700', color: colors.ink2 },
  result: { borderRadius: radiusSm, padding: 12, gap: 3, marginTop: 8 },
  resultDose: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  resultEffect: { fontSize: 13.5, fontWeight: '700', color: colors.ink2, marginTop: 2 },
});
