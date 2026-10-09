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
  const router = useRouter();

  if (!issue) return <Text style={s.wrap}>Fiche introuvable.</Text>;

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
