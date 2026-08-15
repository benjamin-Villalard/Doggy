import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Blocks from '../../components/Blocks';
import Icon from '../../components/Icon';
import ScreenHeader from '../../components/ScreenHeader';
import { Card, Empty, Pill, Row, Sub } from '../../components/UI';
import { issueTree, issues } from '../../lib/content';
import { useStore } from '../../lib/store';
import { colors, shadow, type } from '../../lib/theme';

const norm = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Aleas() {
  const [q, setQ] = useState('');
  const [showTree, setShowTree] = useState(false);
  const router = useRouter();
  const { state } = useStore();

  const list = useMemo(() => {
    const needle = norm(q.trim());
    if (!needle) return issues;
    return issues.filter((i) => norm([i.code, i.title, ...i.lines].join(' ')).includes(needle));
  }, [q]);

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Dépannage"
        subtitle={`${issues.length} fiches · « mon chiot fait X », le protocole en 3 étapes`}
        icon="warn"
      />

      <View style={s.body}>
        <View style={[s.search, shadow.soft]}>
          <Icon name="eye" size={17} color={colors.ink3} />
          <TextInput
            style={s.input}
            value={q}
            onChangeText={setQ}
            placeholder="Ex. pipi, aboie, nuit, mordille, tire…"
            placeholderTextColor={colors.ink3}
          />
        </View>

        <Card onPress={() => setShowTree((v) => !v)} style={{ backgroundColor: colors.accentSoft }}>
          <Row>
            <Icon name="brain" size={19} color={colors.accent} />
            <Text style={[s.title, { color: colors.accent }]}>Arbre de décision universel</Text>
            <Pill tone="accent" solid>{showTree ? 'masquer' : 'ouvrir'}</Pill>
          </Row>
          {showTree ? <Blocks blocks={issueTree} /> : null}
        </Card>

        {list.map((i) => {
          const counts = state.issueCounts[i.code] ?? {};
          const total7 = Object.entries(counts)
            .filter(([d]) => Date.now() - new Date(d).getTime() < 7 * 86400000)
            .reduce((a, [, n]) => a + n, 0);
          const watched = state.watchedIssues.includes(i.code);
          return (
            <Card key={i.code} onPress={() => router.push(`/aleas/${i.code}`)}>
              <Row>
                <View style={s.icon}>
                  <Icon name="warn" size={19} color={colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{i.title}</Text>
                  <Text style={s.meta}>{i.code}</Text>
                </View>
                {watched ? <Pill tone="blue">suivi</Pill> : null}
                {total7 > 0 ? <Pill tone="orange" solid>{total7}/7j</Pill> : null}
              </Row>
            </Card>
          );
        })}
        {list.length === 0 ? <Empty text="Aucune fiche ne correspond." icon="warn" /> : null}
        <Sub>Compte les occurrences pendant 7 jours : c'est la seule façon de savoir si le protocole marche.</Sub>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 36 },
  body: { paddingHorizontal: 14, paddingTop: 14, gap: 10 },
  title: { fontSize: 14.5, fontWeight: '700', color: colors.ink, flex: 1, letterSpacing: -0.2 },
  meta: { ...type.small, color: colors.ink3 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 13,
  },
  input: { flex: 1, paddingVertical: 13, color: colors.ink, fontSize: 14, minWidth: 0, outlineStyle: 'none' } as never,
  icon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
