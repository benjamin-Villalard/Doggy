import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/Icon';
import Rich from '../../components/Rich';
import { Button, Card, Pill, Row, Sub, Title } from '../../components/UI';
import { issueByCode, tutorialByCode } from '../../lib/content';
import { today, useActions, useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function IssueDetail() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const issue = code ? issueByCode(code) : undefined;
  const { state } = useStore();
  const { bumpIssue } = useActions();
  const router = useRouter();

  if (!issue) return <Text style={s.wrap}>Fiche introuvable.</Text>;

  const counts = state.issueCounts[issue.code] ?? {};
  const days = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(Date.now() - k * 86400000).toISOString().slice(0, 10);
    return { date: d, n: counts[d] ?? 0 };
  });
  const todayN = counts[today()] ?? 0;
  const week = days.reduce((a, d) => a + d.n, 0);
  const prevWeek = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(Date.now() - (k + 7) * 86400000).toISOString().slice(0, 10);
    return counts[d] ?? 0;
  }).reduce((a, b) => a + b, 0);
  const linkedTutos = [...new Set(issue.lines.join(' ').match(/T\d\d/g) ?? [])];

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Stack.Screen options={{ title: issue.code }} />
      <Row>
        <Icon name="warn" size={28} color={colors.orange} />
        <Title>{issue.title}</Title>
      </Row>

      {issue.lines.map((l, i) => (
        <Card key={i}>
          <Rich text={l} />
        </Card>
      ))}

      {linkedTutos.length > 0 ? (
        <Card>
          <Text style={s.h}>Tutoriels à (re)travailler</Text>
          {linkedTutos.map((c) => {
            const t = tutorialByCode(c);
            if (!t) return null;
            return (
              <Row key={c} style={{ paddingVertical: 3 }}>
                <Icon name={t.icon} size={18} />
                <Text style={s.link} onPress={() => router.push(`/tutos/${c}`)}>
                  {c} · {t.title} →
                </Text>
              </Row>
            );
          })}
        </Card>
      ) : null}

      <Card>
        <Row>
          <Icon name="chart" size={20} />
          <Text style={s.h}>Compteur 7 jours</Text>
          <Pill tone={week === 0 ? 'green' : week < prevWeek ? 'blue' : 'orange'}>
            {week} cette semaine
          </Pill>
        </Row>
        <Sub>
          Le livre est clair : sans chiffre, impossible de savoir si le protocole marche. Compte 7 jours avant, 7 jours
          après.
        </Sub>
        <Row>
          <View style={{ flex: 1 }}>
            <Button small tone="ghost" title="−" onPress={() => bumpIssue(issue.code, -1)} />
          </View>
          <Text style={s.count}>{todayN}</Text>
          <View style={{ flex: 1 }}>
            <Button small title="+ 1 aujourd'hui" onPress={() => bumpIssue(issue.code, 1)} />
          </View>
        </Row>
        <View style={s.bars}>
          {days
            .slice()
            .reverse()
            .map((d) => (
              <View key={d.date} style={{ alignItems: 'center', flex: 1, gap: 3 }}>
                <View
                  style={[
                    s.bar,
                    { height: Math.max(3, Math.min(60, d.n * 10)), backgroundColor: d.n ? colors.orange : colors.line },
                  ]}
                />
                <Text style={s.barLabel}>{d.date.slice(8)}</Text>
              </View>
            ))}
        </View>
        {prevWeek > 0 ? (
          <Sub>
            Semaine précédente : {prevWeek} · évolution {week - prevWeek >= 0 ? '+' : ''}
            {week - prevWeek}.
          </Sub>
        ) : null}
      </Card>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 12, paddingBottom: 40 },
  h: { fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 },
  link: { color: colors.accent, fontWeight: '600', fontSize: 13.5, flex: 1 },
  count: { fontSize: 22, fontWeight: '800', color: colors.accent, minWidth: 44, textAlign: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 80, marginTop: 4 },
  bar: { width: 14, borderRadius: 4 },
  barLabel: { fontSize: 10, color: colors.ink3 },
});
