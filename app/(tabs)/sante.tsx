import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/Icon';
import ScreenHeader from '../../components/ScreenHeader';
import { Card, Pill, Row, SectionTitle, Sub } from '../../components/UI';
import { clinical } from '../../lib/clinical';
import { expectedWeightRange } from '../../lib/coach';
import { frDate, health, healthAlerts, mealsForAge, nextDeworming, rationPlan, vaccinePlan } from '../../lib/health';
import { ageInWeeks, formatWeight, lastWeightG, useStore } from '../../lib/store';
import { colors, grad, gradients, radius, shadow, type } from '../../lib/theme';
import { useVoice } from '../../lib/voice';

export default function Sante() {
  const { state } = useStore();
  const router = useRouter();
  const voice = useVoice();
  const weeks = ageInWeeks(state.profile.birthdate);
  const plan = vaccinePlan(state.profile, state.health);
  const doneVaccines = plan.filter((p) => p.status === 'fait').length;
  const coreVaccines = plan.filter((p) => !p.vaccine.optional).length;
  const alerts = healthAlerts(state);
  const worm = nextDeworming(state.profile, state.health);
  const ration = rationPlan(state.weights, weeks, state.health);
  const meals = mealsForAge(weeks);
  const grams = lastWeightG(state.weights);
  const range = expectedWeightRange(weeks ?? 8);

  const call = (phone: string) => {
    const n = phone.replace(/\s/g, '');
    if (!n) return;
    if (Platform.OS === 'web') window.open(`tel:${n}`);
    else Linking.openURL(`tel:${n}`);
  };

  return (
    <ScrollView contentContainerStyle={s.wrap} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title={`Santé de ${voice.name}`}
        subtitle={`${doneVaccines}/${coreVaccines} vaccins du protocole · ${state.health.entries.length} actes au carnet`}
        icon="heart"
      />

      <View style={s.body}>
        <Card onPress={() => router.push('/sante/urgences')} style={{ backgroundColor: colors.redSoft }}>
          <Row>
            <View style={[s.sosIcon, { backgroundColor: colors.red }]}>
              <Icon name="bolt" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: colors.red }]}>Gestes d'urgence {voice.emoji('🚨')}</Text>
              <Text style={s.meta}>7 fiches : hypoglycémie, étouffement, chute, toxique, respiration, chaud/froid, plaie</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </Row>
          {state.health.vetPhone || state.health.emergencyPhone ? (
            <Row style={{ flexWrap: 'wrap' }}>
              {state.health.vetPhone ? (
                <Text style={s.phone} onPress={() => call(state.health.vetPhone)}>
                  Véto : {state.health.vetPhone}
                </Text>
              ) : null}
              {state.health.emergencyPhone ? (
                <Text style={s.phone} onPress={() => call(state.health.emergencyPhone)}>
                  Urgences : {state.health.emergencyPhone}
                </Text>
              ) : null}
            </Row>
          ) : (
            <Sub>Ajoute les numéros de ton vétérinaire dans le carnet : ils s'afficheront ici, cliquables.</Sub>
          )}
        </Card>

        {alerts.length > 0 ? (
          <Card style={{ backgroundColor: colors.amberSoft }}>
            <Row>
              <Icon name="calendar" size={18} color={colors.orange} />
              <Text style={[s.title, { color: colors.orange }]}>À faire bientôt</Text>
            </Row>
            {alerts.slice(0, 4).map((a) => (
              <Row key={`${a.kind}-${a.due}-${a.label}`}>
                <Pill tone={a.days < 0 ? 'red' : 'orange'}>
                  {a.days < 0 ? `retard ${-a.days} j` : a.days === 0 ? "aujourd'hui" : `dans ${a.days} j`}
                </Pill>
                <Text style={s.alertText}>
                  {a.label} · {frDate(a.due)}
                </Text>
              </Row>
            ))}
          </Card>
        ) : (
          <Card style={{ backgroundColor: colors.greenSoft }}>
            <Row>
              <Icon name="check" size={18} color={colors.green} />
              <Text style={[s.title, { color: colors.green }]}>Rien d'urgent dans les 15 jours</Text>
            </Row>
            <Sub>
              {state.profile.birthdate
                ? 'Le protocole vaccinal et les vermifuges sont à jour selon les dates saisies.'
                : "Renseigne la date de naissance dans les réglages pour calculer le calendrier de santé."}
            </Sub>
          </Card>
        )}

        <SectionTitle icon="compass">Les pages santé</SectionTitle>
        <Item
          icon="syringe"
          tone={gradients.blue}
          title="Prévention : vaccins, vermifuges, antiparasitaires"
          sub={
            worm.due
              ? `${doneVaccines}/${coreVaccines} vaccins · prochain vermifuge ${frDate(worm.due)}`
              : `${doneVaccines}/${coreVaccines} vaccins du protocole`
          }
          onPress={() => router.push('/sante/vaccins')}
        />
        <Item
          icon="bowl"
          tone={gradients.green}
          title="Nutrition & ration calculée"
          sub={
            ration?.perDay
              ? `${ration.perDay} g/jour en ${ration.meals} repas (${ration.kcal} kcal)`
              : `${meals.meals} repas/jour ${meals.label} · ajoute les kcal de tes croquettes`
          }
          onPress={() => router.push('/sante/nutrition')}
        />
        <Item
          icon="kit"
          tone={gradients.accent}
          title="Carnet de santé"
          sub={`${state.health.entries.length} actes · identité, véto, traitements, trousse`}
          onPress={() => router.push('/sante/carnet')}
        />
        <Item
          icon="pulse"
          tone={gradients.coral}
          title="Signes cliniques : quand s'inquiéter"
          sub={`${health.signs.length} signes triés par urgence · ${state.health.symptoms.length} notés`}
          onPress={() => router.push('/sante/signes')}
        />
        {state.prefs.clinicianMode ? (
          <>
            <Item
              icon="stethoscope"
              tone={gradients.hero}
              title="Mode clinicien : urgences & protocoles"
              sub={`${clinical.protocols.length} protocoles · triage ABCDE · spécificités de la race`}
              onPress={() => router.push('/sante/clinique')}
            />
            <Item
              icon="pill"
              tone={gradients.sky}
              title="Doses au poids & toxicologie"
              sub={`${clinical.drugs.length} molécules en mg/kg avec volume · ${clinical.toxins.length} toxiques chiffrés`}
              onPress={() => router.push('/sante/doses')}
            />
            <Item
              icon="pulse"
              tone={gradients.pink}
              title="Constantes, douleur et relevés"
              sub={`CMPS-SF · ${state.health.vitals.length} relevés enregistrés`}
              onPress={() => router.push('/sante/constantes')}
            />
          </>
        ) : (
          <Card tone="flat" onPress={() => router.push('/reglages')}>
            <Row>
              <Icon name="stethoscope" size={17} color={colors.ink3} />
              <View style={{ flex: 1 }}>
                <Text style={s.title}>Mode clinicien</Text>
                <Text style={s.meta}>
                  Protocoles d'urgence détaillés, doses en mg/kg, toxicologie, constantes et score de douleur — à
                  activer dans les réglages.
                </Text>
              </View>
              <Text style={s.chev}>›</Text>
            </Row>
          </Card>
        )}

        <SectionTitle icon="scale">Poids et croissance</SectionTitle>
        <Card onPress={() => router.push('/suivi/poids')}>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>
                {grams ? formatWeight(grams, state.prefs.weightUnit) : 'Aucune pesée'}
              </Text>
              <Text style={s.meta}>
                Fourchette indicative à {weeks ?? '—'} semaines : {range[0]}–{range[1]} g
              </Text>
            </View>
            <Pill tone={!grams ? 'grey' : grams < range[0] ? 'orange' : grams > range[1] ? 'orange' : 'green'}>
              {!grams ? 'à peser' : grams < range[0] ? 'sous la courbe' : grams > range[1] ? 'au-dessus' : 'dans la norme'}
            </Pill>
          </Row>
          <Sub>La pesée hebdomadaire est le meilleur indicateur de santé d'un chiot toy. Elle sert aussi à calculer la ration.</Sub>
        </Card>

        <SectionTitle icon="dog">Spécificités Yorkshire</SectionTitle>
        <View style={s.grid}>
          {health.yorkSpecific.map((y) => (
            <View key={y.title} style={[s.tile, shadow.soft]}>
              <View style={s.tileIcon}>
                <Icon name={y.icon} size={17} color={colors.accent} />
              </View>
              <Text style={s.tileTitle}>{y.title}</Text>
              <Text style={s.tileText}>{y.text}</Text>
            </View>
          ))}
        </View>

        <Card tone="flat">
          <Row>
            <Icon name="vet" size={17} color={colors.ink3} />
            <Text style={s.disclaimer}>{health.disclaimer}</Text>
          </Row>
        </Card>
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
  sosIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  phone: { fontSize: 13, fontWeight: '800', color: colors.red },
  alertText: { ...type.small, color: colors.ink2, flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  tile: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: radius,
    padding: 12,
    gap: 5,
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: { fontSize: 13, fontWeight: '800', color: colors.ink },
  tileText: { fontSize: 11.5, fontWeight: '600', color: colors.ink3, lineHeight: 16 },
  disclaimer: { flex: 1, fontSize: 11.5, fontWeight: '600', color: colors.ink3, lineHeight: 16 },
});
