import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/Icon';
import { Button, Card, Pill, Row, Sub } from '../../components/UI';
import { addDays, daysUntil, frDate } from '../../lib/health';
import { today, useActions, useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

type Care = { code: string; label: string; icon: string; every: number; rhythm: string; tips: string[] };

const cares: Care[] = [
  {
    code: 'dents',
    label: 'Brossage des dents',
    icon: 'tooth',
    every: 1,
    rhythm: 'tous les jours (au minimum 3 fois par semaine)',
    tips: [
      'Les toys font du tartre très tôt et perdent leurs dents : c’est le soin le plus important.',
      'Doigtier ou brosse souple + dentifrice vétérinaire (jamais celui des humains).',
      'Vérifie vers 6-7 mois que les crocs de lait sont tombés, sinon parles-en au vétérinaire.',
    ],
  },
  {
    code: 'yeux',
    label: 'Yeux',
    icon: 'eye',
    every: 1,
    rhythm: 'tous les jours',
    tips: [
      'Compresse et sérum physiologique, du coin interne vers l’extérieur.',
      'Attache la mèche au-dessus des yeux (couette) pour éviter les irritations.',
      'Œil rouge, fermé ou qui coule jaune : vétérinaire.',
    ],
  },
  {
    code: 'oreilles',
    label: 'Oreilles',
    icon: 'ear',
    every: 7,
    rhythm: 'une fois par semaine',
    tips: [
      'Nettoyant auriculaire sur coton, uniquement la partie visible, pas de coton-tige.',
      'Les poils du conduit peuvent être retirés par le toiletteur si besoin.',
      'Odeur, rougeur, secoue la tête : vétérinaire.',
    ],
  },
  {
    code: 'griffes',
    label: 'Griffes et ergots',
    icon: 'paw',
    every: 21,
    rhythm: 'toutes les 2 à 4 semaines',
    tips: [
      'Coupe-griffes pour petit chien, juste la pointe, en évitant la partie rose.',
      'N’oublie pas les ergots (le doigt en haut de la patte avant), ils peuvent s’incarner.',
      'Si elles cliquettent sur le carrelage, c’est le moment.',
    ],
  },
  {
    code: 'coussinets',
    label: 'Poils des coussinets',
    icon: 'paw',
    every: 30,
    rhythm: 'une fois par mois',
    tips: ['Ciseaux à bouts ronds : les poils entre les coussinets font glisser et retiennent les épillets.'],
  },
  {
    code: 'bain',
    label: 'Bain',
    icon: 'drop',
    every: 28,
    rhythm: 'toutes les 3 à 6 semaines',
    tips: [
      'Shampooing chiot doux, rinçage abondant, puis démêlant pour le poil long du Biewer.',
      'Sèche complètement au sèche-cheveux tiède : un toy mouillé se refroidit très vite.',
      'Pas de bain dans les jours qui suivent un vaccin si ton vétérinaire le déconseille.',
    ],
  },
  {
    code: 'brossage',
    label: 'Brossage du poil',
    icon: 'brush',
    every: 2,
    rhythm: 'tous les 1 à 2 jours',
    tips: ['Peigne métal + brosse à picots, mèche par mèche pour éviter les nœuds derrière les oreilles et sous les pattes.'],
  },
  {
    code: 'toilettage',
    label: 'Coupe chez le toiletteur',
    icon: 'sparkle',
    every: 56,
    rhythm: 'toutes les 6 à 10 semaines',
    tips: ['Premières visites courtes et positives dès que les vaccins le permettent, pour l’habituer.'],
  },
];

export default function Soins() {
  const { state } = useStore();
  const { addHealthEntry, removeHealthEntry } = useActions();

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Sub>Touche « Fait aujourd’hui » après chaque soin : l’app calcule la prochaine fois. L’historique apparaît dans le carnet.</Sub>
      {cares.map((c) => {
        const done = state.health.entries
          .filter((e) => e.kind === 'soin' && e.ref === c.code)
          .sort((a, b) => (a.date < b.date ? 1 : -1));
        const last = done[0];
        const next = last ? addDays(last.date, c.every) : null;
        const days = next ? daysUntil(next) : null;
        const tone = days === null ? 'grey' : days < 0 ? 'orange' : days === 0 ? 'blue' : 'green';
        return (
          <Card key={c.code}>
            <Row>
              <Icon name={c.icon} size={20} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={s.h}>{c.label}</Text>
                <Text style={s.meta}>
                  {c.rhythm}
                  {last ? ` · dernier le ${frDate(last.date)}` : ''}
                </Text>
              </View>
              <Pill tone={tone}>
                {days === null ? 'jamais noté' : days < 0 ? `en retard ${-days} j` : days === 0 ? "aujourd'hui" : `dans ${days} j`}
              </Pill>
            </Row>
            {c.tips.map((t) => (
              <Text key={t} style={s.tip}>
                • {t}
              </Text>
            ))}
            <Row>
              <Button
                small
                icon="check"
                title="Fait aujourd'hui"
                disabled={last?.date === today()}
                onPress={() => addHealthEntry({ date: today(), kind: 'soin', label: c.label, ref: c.code, nextDate: null })}
              />
              {last?.date === today() ? <Button small tone="ghost" title="Annuler" onPress={() => removeHealthEntry(last.id)} /> : null}
            </Row>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, gap: 12, paddingBottom: 40 },
  h: { fontSize: 15, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 12.5, color: colors.ink3 },
  tip: { fontSize: 13, lineHeight: 18.5, color: colors.ink2 },
});
