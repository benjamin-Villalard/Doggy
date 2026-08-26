import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from '../../components/Icon';
import ScreenHeader from '../../components/ScreenHeader';
import { Card, Empty, Row, Sub } from '../../components/UI';
import { issues, librarySections, tutorials } from '../../lib/content';
import { colors, shadow, type } from '../../lib/theme';

const norm = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const blockText = (b: unknown): string => JSON.stringify(b);

export default function Livre() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const needle = norm(q.trim());
    if (needle.length < 2) return null;
    const tuts = tutorials
      .filter((t) => norm(JSON.stringify(t)).includes(needle))
      .map((t) => ({ kind: 'tuto' as const, title: `${t.code} · ${t.title}`, href: `/tutos/${t.code}`, icon: t.icon }));
    const isses = issues
      .filter((i) => norm(JSON.stringify(i)).includes(needle))
      .map((i) => ({ kind: 'alea' as const, title: `${i.code} · ${i.title}`, href: `/aleas/${i.code}`, icon: 'warn' }));
    const secs = librarySections
      .map((sec, idx) => ({ sec, idx }))
      .filter(({ sec }) => norm(sec.title + blockText(sec.blocks)).includes(needle))
      .map(({ sec, idx }) => ({ kind: 'chapitre' as const, title: sec.title, href: `/livre/${idx}`, icon: sec.icon }));
    return [...tuts, ...isses, ...secs];
  }, [q]);

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Le livre complet"
        subtitle={`${librarySections.length} chapitres · fiche race, lois de l'apprentissage, annexes`}
        icon="book"
      />

      <View style={s.body}>
      <View style={[s.search, shadow.soft]}>
        <Icon name="eye" size={17} color={colors.ink3} />
        <TextInput
          style={s.input}
          value={q}
          onChangeText={setQ}
          placeholder="Recherche dans tout le livre…"
          placeholderTextColor={colors.ink3}
        />
      </View>

      {results
        ? results.map((r) => (
            <Card key={r.href} onPress={() => router.push(r.href as never)}>
              <Row>
                <View style={s.icon}>
                  <Icon name={r.icon} size={19} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{r.title}</Text>
                  <Text style={s.meta}>{r.kind}</Text>
                </View>
              </Row>
            </Card>
          ))
        : librarySections.map((sec, i) => (
            <Card key={sec.title} onPress={() => router.push(`/livre/${i}`)}>
              <Row>
                <View style={s.icon}>
                  <Icon name={sec.icon} size={19} color={colors.accent} />
                </View>
                <Text style={s.title}>{sec.title}</Text>
                <Text style={s.chev}>›</Text>
              </Row>
            </Card>
          ))}
      {results?.length === 0 ? <Empty text="Aucun résultat dans le livre." icon="book" /> : null}
      <Sub>Le livre PDF complet reste la référence : ici tu le lis chapitre par chapitre, hors ligne.</Sub>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 36 },
  body: { paddingHorizontal: 14, paddingTop: 14, gap: 10 },
  title: { fontSize: 14.5, fontWeight: '700', color: colors.ink, flex: 1, letterSpacing: -0.2 },
  meta: { ...type.small, color: colors.ink3, textTransform: 'capitalize' },
  chev: { fontSize: 22, color: colors.ink3 },
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
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
