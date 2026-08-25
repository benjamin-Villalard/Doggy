import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/Icon';
import Rich from '../../components/Rich';
import { Button, Card, Pill, Row, SectionTitle, Sub } from '../../components/UI';
import { clinical, maintenanceMlH, vitalsForAge } from '../../lib/clinical';
import { ageInWeeks, lastWeightG, useStore } from '../../lib/store';
import { colors, grad, gradients, radius, radiusSm, shadow, type } from '../../lib/theme';

const urgencyTone = (u: string) => (u === 'vitale' ? colors.red : u === 'élevée' ? colors.orange : colors.blue);

export default function Clinique() {
  const { state } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [openBreed, setOpenBreed] = useState<string | null>(null);
  const weeks = ageInWeeks(state.profile.birthdate);
  const grams = lastWeightG(state.weights);
  const kg = grams ? grams / 1000 : null;
  const ref = vitalsForAge(weeks);

  const call = (phone: string) => {
    const n = phone.replace(/\s/g, '');
    if (!n) return;
    if (Platform.OS === 'web') window.open(`tel:${n}`);
    else Linking.openURL(`tel:${n}`);
  };

  return (
    <ScrollView contentContainerStyle={s.wrap} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ title: 'Mode clinicien' }} />

      <LinearGradient colors={grad(gradients.hero)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <View style={s.heroBlob} />
        <Row>
          <View style={s.heroIcon}>
            <Icon name="stethoscope" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>Urgences & clinique</Text>
            <Text style={s.heroMeta}>
              {clinical.protocols.length} protocoles · {clinical.drugs.length} molécules · {clinical.toxins.length}{' '}
              toxiques
            </Text>
          </View>
        </Row>
        <Row style={{ flexWrap: 'wrap', marginTop: 2 }}>
          <View style={s.badge}>
            <Text style={s.badgeText}>
              Poids de référence : {kg ? `${kg.toFixed(2)} kg` : 'à peser'}
            </Text>
          </View>
          {kg ? (
            <View style={s.badge}>
              <Text style={s.badgeText}>Entretien ≈ {maintenanceMlH(kg)} ml/h</Text>
            </View>
          ) : null}
        </Row>
      </LinearGradient>

      <Card style={{ backgroundColor: colors.amberSoft }} tone="flat">
        <Row>
          <Icon name="warn" size={17} color={colors.orange} />
          <Text style={[s.h, { color: colors.orange }]}>Cadre d'usage</Text>
        </Row>
        <Sub>{clinical.disclaimer}</Sub>
      </Card>

      <Row>
        <View style={{ flex: 1 }}>
          <Button
            title="Doses & toxiques"
            icon="pill"
            onPress={() => router.push('/sante/doses')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Constantes & douleur"
            icon="pulse"
            tone="coral"
            onPress={() => router.push('/sante/constantes')}
          />
        </View>
      </Row>

      {state.health.vetPhone || state.health.emergencyPhone || state.health.poisonPhone ? (
        <Card style={{ backgroundColor: colors.redSoft }}>
          <Row>
            <Icon name="phone" size={17} color={colors.red} />
            <Text style={[s.h, { color: colors.red }]}>Appels rapides</Text>
          </Row>
          <Row style={{ flexWrap: 'wrap' }}>
            {[
              { label: 'Véto', v: state.health.vetPhone },
              { label: 'Garde', v: state.health.emergencyPhone },
              { label: 'Clinique', v: state.health.clinicPhone },
              { label: 'Antipoison', v: state.health.poisonPhone },
            ]
              .filter((x) => x.v)
              .map((x) => (
                <Text key={x.label} style={s.phone} onPress={() => call(x.v)}>
                  {x.label} : {x.v}
                </Text>
              ))}
          </Row>
        </Card>
      ) : (
        <Card tone="flat">
          <Text style={s.h}>Numéros d'urgence</Text>
          <Sub>
            Renseigne véto, garde, clinique de référence et centre antipoison dans le carnet de santé : ils
            s'afficheront ici, cliquables.
          </Sub>
          <Button small tone="ghost" title="Ouvrir le carnet" onPress={() => router.push('/sante/carnet')} />
        </Card>
      )}

      <SectionTitle icon="pulse">Constantes attendues à cet âge</SectionTitle>
      <Card>
        <Row>
          <Metric label="FC" value={ref.hr} />
          <Metric label="FR" value={ref.rr} />
          <Metric label="T°" value={ref.temp} />
        </Row>
        <Sub>
          Chiot de moins de 3 mois : fréquences physiologiquement hautes, réserve cardiaque quasi nulle et thermogenèse
          limitée. Une bradycardie relative ou une hypothermie sont des signes de gravité.
        </Sub>
      </Card>

      <SectionTitle icon="compass">Triage ABCDE</SectionTitle>
      {clinical.triage.map((t) => (
        <Card key={t.step} tone="flat">
          <Row>
            <View style={s.stepBadge}>
              <Text style={s.stepBadgeText}>{t.step}</Text>
            </View>
            <Text style={s.h}>{t.title}</Text>
          </Row>
          {t.checks.map((c) => (
            <Row key={c} style={{ alignItems: 'flex-start' }}>
              <Icon name="check" size={14} color={colors.ink3} />
              <Rich text={c} style={{ flex: 1 }} />
            </Row>
          ))}
          <View style={[s.red, { backgroundColor: colors.redSoft }]}>
            <Text style={[s.label, { color: colors.red }]}>Drapeau rouge</Text>
            <Rich text={t.red} />
          </View>
        </Card>
      ))}

      <SectionTitle icon="kit">Protocoles d'urgence</SectionTitle>
      {clinical.protocols.map((p) => {
        const isOpen = open === p.code;
        const tone = urgencyTone(p.urgency);
        return (
          <Card key={p.code} onPress={() => setOpen(isOpen ? null : p.code)}>
            <Row>
              <View style={[s.icon, { backgroundColor: `${tone}1a` }]}>
                <Icon name={p.icon} size={19} color={tone} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.h}>{p.title}</Text>
                <Text style={s.meta}>
                  {p.code} · urgence {p.urgency}
                </Text>
              </View>
              <Pill tone={p.urgency === 'vitale' ? 'red' : p.urgency === 'élevée' ? 'orange' : 'blue'}>
                {isOpen ? '−' : '+'}
              </Pill>
            </Row>
            {isOpen ? (
              <View style={{ gap: 9, marginTop: 4 }}>
                <View style={[s.block, { backgroundColor: colors.blueSoft }]}>
                  <Text style={[s.label, { color: colors.blue }]}>Quand</Text>
                  <Rich text={p.indication} />
                </View>
                <View>
                  <Text style={s.label}>Conduite</Text>
                  {p.steps.map((x, i) => (
                    <Row key={i} style={{ alignItems: 'flex-start', marginTop: 4 }}>
                      <View style={s.num}>
                        <Text style={s.numText}>{i + 1}</Text>
                      </View>
                      <Rich text={x} style={{ flex: 1 }} />
                    </Row>
                  ))}
                </View>
                <View style={[s.block, { backgroundColor: colors.redSoft }]}>
                  <Text style={[s.label, { color: colors.red }]}>Pièges</Text>
                  {p.pitfalls.map((x) => (
                    <Row key={x} style={{ alignItems: 'flex-start' }}>
                      <Icon name="cross" size={13} color={colors.red} />
                      <Rich text={x} style={{ flex: 1 }} />
                    </Row>
                  ))}
                </View>
                <Text style={s.ref}>Référence : {p.ref}</Text>
              </View>
            ) : null}
          </Card>
        );
      })}

      <SectionTitle icon="drop">Déshydratation</SectionTitle>
      <Card tone="flat">
        {clinical.dehydration.map((d) => (
          <View key={d.label} style={s.rowLine}>
            <Pill tone="blue">{d.label}</Pill>
            <View style={{ flex: 1 }}>
              <Text style={s.lineTitle}>{d.signs}</Text>
              <Text style={s.meta}>{d.action}</Text>
            </View>
          </View>
        ))}
        <Sub>
          Déficit (ml) = % de déshydratation × poids (kg) × 10. Le calculateur de la page « Doses » applique
          directement ce calcul au poids enregistré.
        </Sub>
      </Card>

      <SectionTitle icon="dog">Spécificités de la race</SectionTitle>
      {clinical.breed.map((b) => {
        const isOpen = openBreed === b.name;
        return (
          <Card key={b.name} onPress={() => setOpenBreed(isOpen ? null : b.name)}>
            <Row>
              <View style={[s.icon, { backgroundColor: colors.accentSoft }]}>
                <Icon name={b.icon} size={18} color={colors.accent} />
              </View>
              <Text style={s.h}>{b.name}</Text>
              <Pill tone="accent">{isOpen ? '−' : '+'}</Pill>
            </Row>
            {isOpen ? (
              <View style={{ gap: 7, marginTop: 4 }}>
                <Line label="Signes d'appel" text={b.signs} />
                <Line label="Démarche diagnostique" text={b.workup} />
                <Line label="Prise en charge" text={b.care} />
                <View style={[s.block, { backgroundColor: colors.accentSoft }]}>
                  <Rich text={b.risk} />
                </View>
              </View>
            ) : null}
          </Card>
        );
      })}

      <SectionTitle icon="book">Sources</SectionTitle>
      <Card tone="flat">
        {clinical.refs.map((r) => (
          <Row key={r} style={{ alignItems: 'flex-start' }}>
            <Icon name="check" size={13} color={colors.ink3} />
            <Text style={s.meta}>{r}</Text>
          </Row>
        ))}
      </Card>
      <View style={{ height: 26 }} />
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metric}>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={s.metricValue}>{value}</Text>
    </View>
  );
}

function Line({ label, text }: { label: string; text: string }) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <Rich text={text} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 11, paddingBottom: 40 },
  hero: { borderRadius: radius, padding: 16, gap: 8, overflow: 'hidden', ...shadow.lift },
  heroBlob: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -74,
    right: -40,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...type.h2, color: '#fff', fontSize: 19 },
  heroMeta: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '700' },
  badge: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  badgeText: { color: '#fff', fontSize: 11.5, fontWeight: '800' },
  h: { fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 },
  meta: { ...type.small, color: colors.ink3, flex: 1 },
  label: { fontSize: 12.5, fontWeight: '800', color: colors.ink2, marginBottom: 2 },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  num: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: '#fff', fontWeight: '800', fontSize: 11.5 },
  block: { borderRadius: radiusSm, padding: 11, gap: 3 },
  red: { borderRadius: radiusSm, padding: 11, gap: 2, marginTop: 4 },
  ref: { ...type.micro, color: colors.ink3, fontStyle: 'italic' },
  rowLine: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  lineTitle: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  metric: { flex: 1, backgroundColor: colors.accentSoft, borderRadius: radiusSm, padding: 11, gap: 2 },
  metricLabel: { ...type.micro, color: colors.accent, fontWeight: '800' },
  metricValue: { fontSize: 13.5, fontWeight: '800', color: colors.ink },
  phone: { color: colors.red, fontWeight: '800', fontSize: 13 },
});
