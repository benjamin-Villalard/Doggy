import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/Icon';
import Rich from '../../components/Rich';
import { Button, Card, Pill, Row, SectionTitle, Sub } from '../../components/UI';
import { health } from '../../lib/health';
import { useStore } from '../../lib/store';
import { colors, type } from '../../lib/theme';

export default function Urgences() {
  const { state } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(health.emergency[0]?.code ?? null);

  const call = (phone: string) => {
    const n = phone.replace(/\s/g, '');
    if (!n) return;
    if (Platform.OS === 'web') window.open(`tel:${n}`);
    else Linking.openURL(`tel:${n}`);
  };

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Card style={{ backgroundColor: colors.redSoft }}>
        <Row>
          <Icon name="phone" size={18} color={colors.red} />
          <Text style={[s.h, { color: colors.red }]}>Appeler d'abord, agir ensuite</Text>
        </Row>
        <Sub>
          Un chiot de 1 à 2 kg se décompense en quelques minutes. Le premier geste utile est toujours d'appeler une
          clinique : elle te guide pendant que tu prépares le transport.
        </Sub>
        <Row>
          <View style={{ flex: 1 }}>
            <Button
              small
              tone="red"
              title={state.health.vetPhone ? `Véto : ${state.health.vetPhone}` : 'Ajouter mon véto'}
              onPress={() => call(state.health.vetPhone)}
              disabled={!state.health.vetPhone}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              small
              tone="coral"
              title={state.health.emergencyPhone ? `Garde : ${state.health.emergencyPhone}` : 'Ajouter les urgences'}
              onPress={() => call(state.health.emergencyPhone)}
              disabled={!state.health.emergencyPhone}
            />
          </View>
        </Row>
        {!state.health.vetPhone ? <Sub>Renseigne les numéros dans le carnet de santé pour les avoir ici en un geste.</Sub> : null}
      </Card>

      {state.prefs.clinicianMode ? (
        <Card onPress={() => router.push('/sante/clinique')} style={{ backgroundColor: colors.accentSoft }}>
          <Row>
            <Icon name="stethoscope" size={18} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[s.h, { color: colors.accentDeep }]}>Mode clinicien</Text>
              <Sub>
                Triage ABCDE, protocoles détaillés (RCP RECOVER, hypoglycémie, toxiques), posologies au poids et score
                de douleur.
              </Sub>
            </View>
          </Row>
        </Card>
      ) : null}

      <SectionTitle icon="bolt">7 fiches d'urgence</SectionTitle>
      {health.emergency.map((e) => {
        const isOpen = open === e.code;
        return (
          <Card key={e.code} onPress={() => setOpen(isOpen ? null : e.code)}>
            <Row>
              <View style={s.icon}>
                <Icon name={e.icon} size={18} color={colors.red} />
              </View>
              <Text style={s.h}>{e.title}</Text>
              <Pill tone="red">{isOpen ? '−' : '+'}</Pill>
            </Row>
            {isOpen ? (
              <View style={{ gap: 8, marginTop: 4 }}>
                <View>
                  <Text style={s.label}>Je reconnais</Text>
                  {e.signs.map((x) => (
                    <Row key={x} style={{ alignItems: 'flex-start' }}>
                      <Icon name="eye" size={14} color={colors.ink3} />
                      <Rich text={x} style={s.item} />
                    </Row>
                  ))}
                </View>
                <View style={[s.block, { backgroundColor: colors.greenSoft }]}>
                  <Text style={[s.label, { color: colors.green }]}>Je fais tout de suite</Text>
                  {e.doNow.map((x, i) => (
                    <Row key={x} style={{ alignItems: 'flex-start' }}>
                      <View style={s.num}>
                        <Text style={s.numText}>{i + 1}</Text>
                      </View>
                      <Rich text={x} style={s.item} />
                    </Row>
                  ))}
                </View>
                <View style={[s.block, { backgroundColor: colors.redSoft }]}>
                  <Text style={[s.label, { color: colors.red }]}>Je ne fais jamais</Text>
                  {e.never.map((x) => (
                    <Row key={x} style={{ alignItems: 'flex-start' }}>
                      <Icon name="cross" size={14} color={colors.red} />
                      <Rich text={x} style={s.item} />
                    </Row>
                  ))}
                </View>
              </View>
            ) : null}
          </Card>
        );
      })}

      <SectionTitle icon="kit">Trousse d'urgence</SectionTitle>
      <Card>
        {health.kit.map((k) => (
          <Row key={k} style={{ alignItems: 'flex-start' }}>
            <Icon name="check" size={15} color={colors.accent} />
            <Text style={s.item}>{k}</Text>
          </Row>
        ))}
      </Card>

      <Card tone="flat">
        <Sub>{health.disclaimer}</Sub>
      </Card>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 10, paddingBottom: 40 },
  h: { fontSize: 14.5, fontWeight: '700', color: colors.ink, flex: 1 },
  label: { ...type.micro, color: colors.ink3, textTransform: 'uppercase', marginBottom: 3 },
  item: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink2, lineHeight: 18 },
  block: { borderRadius: 14, padding: 10, gap: 4 },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: {
    width: 19,
    height: 19,
    borderRadius: 7,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: '#fff', fontWeight: '800', fontSize: 11 },
});
