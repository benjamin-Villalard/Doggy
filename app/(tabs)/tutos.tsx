import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from '../../components/Icon';
import ScreenHeader from '../../components/ScreenHeader';
import { Card, Chip, Empty, Pill, Row, Sub } from '../../components/UI';
import { tutorialBlocks, tutorials } from '../../lib/content';
import { useStore } from '../../lib/store';
import { colors, shadow, type } from '../../lib/theme';

const norm = (v: string) =>
  v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export default function Tutos() {
  const { state } = useStore();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [block, setBlock] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = norm(q.trim());
    return tutorials.filter((t) => {
      if (block && t.block !== block) return false;
      if (!needle) return true;
      const hay = norm(
        [t.code, t.title, t.meta, t.criteria ?? '', t.alea ?? '', ...t.steps.map((x) => x.text)].join(' '),
      );
      return hay.includes(needle);
    });
  }, [q, block]);

  const mastered = tutorials.filter((t) => (state.skills[t.code] ?? 0) >= 4).length;

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title={`${tutorials.length} tutoriels`}
        subtitle={`${mastered} maîtrisés · étapes, critère de réussite et minuteur`}
        icon="clicker"
      />

      <View style={s.body}>
        <View style={[s.search, shadow.soft]}>
          <Icon name="eye" size={17} color={colors.ink3} />
          <TextInput
            style={s.input}
            value={q}
            onChangeText={setQ}
            placeholder="Rechercher (rappel, laisse, morsure…)"
            placeholderTextColor={colors.ink3}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          <Chip label="Tous" active={block === null} onPress={() => setBlock(null)} />
          {tutorialBlocks.map((b) => (
            <Chip
              key={b}
              label={b.replace(/^Bloc /, '').split(' — ')[1] ?? b}
              active={block === b}
              onPress={() => setBlock(b)}
            />
          ))}
        </ScrollView>

        {list.map((t) => {
          const score = state.skills[t.code] ?? 0;
          return (
            <Card key={t.code} onPress={() => router.push(`/tutos/${t.code}`)}>
              <Row>
                <View style={[s.icon, score >= 4 && { backgroundColor: colors.greenSoft }]}>
                  <Icon name={t.icon} size={20} color={score >= 4 ? colors.green : colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{t.title}</Text>
                  <Text style={s.meta}>
                    {t.code} · {t.steps.length} étapes
                  </Text>
                </View>
                <Pill tone={score >= 4 ? 'green' : score >= 2 ? 'orange' : 'grey'} solid={score >= 4}>
                  {score}/5
                </Pill>
              </Row>
            </Card>
          );
        })}
        {list.length === 0 ? <Empty text="Aucun tutoriel ne correspond à cette recherche." icon="eye" /> : null}
        <Sub>Astuce : 3 à 5 séances de 2 minutes valent mieux qu'une longue séance.</Sub>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 36 },
  body: { paddingHorizontal: 14, paddingTop: 14, gap: 10 },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
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
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
