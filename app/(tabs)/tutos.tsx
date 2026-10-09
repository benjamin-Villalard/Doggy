import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from '../../components/Icon';
import ScreenHeader from '../../components/ScreenHeader';
import { Card, Chip, Empty, Row, Sub } from '../../components/UI';
import { issues, tricks, trickCategories, tutorialBlocks, tutorials } from '../../lib/content';
import { ageInWeeks, useActions, useStore } from '../../lib/store';
import { colors, radiusSm } from '../../lib/theme';

type Mode = 'tours' | 'bases' | 'soucis' | 'liste';
type Item = { code: string; title: string; meta: string; icon: string; href: string; group: string; dim?: boolean; text: string };

const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Education() {
  const { state } = useStore();
  const { toggleWish } = useActions();
  const router = useRouter();
  const weeks = ageInWeeks(state.profile.birthdate);
  const [mode, setMode] = useState<Mode>('tours');
  const [group, setGroup] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const all = useMemo(() => {
    const t: Item[] = tricks.map((x) => ({
      code: x.code,
      title: x.title,
      meta: `${'★'.repeat(x.stars)}${'☆'.repeat(3 - x.stars)} · dès ${Math.round(x.minAgeWeeks / 4.35)} mois · mot « ${x.cue} »`,
      icon: x.icon,
      href: `/tours/${x.code}`,
      group: x.category,
      dim: weeks !== null && weeks < x.minAgeWeeks,
      text: `${x.title} ${x.why} ${x.cue}`,
    }));
    const b: Item[] = tutorials.map((x) => ({
      code: x.code,
      title: x.title,
      meta: `${x.steps.length} étapes`,
      icon: x.icon ?? 'paw',
      href: `/tutos/${x.code}`,
      group: x.block ?? 'Autres',
      text: `${x.title} ${x.meta}`,
    }));
    const i: Item[] = issues.map((x) => ({
      code: x.code,
      title: x.title,
      meta: 'Comprendre et corriger',
      icon: 'warn',
      href: `/aleas/${x.code}`,
      group: 'Comportement',
      text: `${x.title} ${x.lines.join(' ')}`,
    }));
    return { tours: t, bases: b, soucis: i };
  }, [weeks]);

  const groups = mode === 'tours' ? trickCategories : mode === 'bases' ? tutorialBlocks : [];
  const base = mode === 'liste' ? [...all.tours, ...all.bases, ...all.soucis].filter((x) => state.wishlist.includes(x.code)) : all[mode];
  const words = norm(q).split(/\s+/).filter(Boolean);
  const list = base.filter((x) => (!group || x.group === group) && words.every((w) => norm(x.text).includes(w)));

  const modes: { value: Mode; label: string }[] = [
    { value: 'tours', label: `Tours (${all.tours.length})` },
    { value: 'bases', label: `Bases (${all.bases.length})` },
    { value: 'soucis', label: `Soucis (${all.soucis.length})` },
    { value: 'liste', label: `★ À lui apprendre (${state.wishlist.length})` },
  ];

  return (
    <ScrollView contentContainerStyle={s.wrap} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Éducation" subtitle="Tours, bases et conseils : étapes et astuces pour y arriver" icon="clicker" />
      <View style={s.body}>
        <View style={s.modes}>
          {modes.map((m) => (
            <Chip
              key={m.value}
              label={m.label}
              active={mode === m.value}
              onPress={() => {
                setMode(m.value);
                setGroup(null);
              }}
            />
          ))}
        </View>
        <TextInput value={q} onChangeText={setQ} placeholder="Rechercher (ex. assis, laisse, mordille…)" placeholderTextColor={colors.ink3} style={s.search} />
        {groups.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            <Chip label="Tout" active={!group} onPress={() => setGroup(null)} />
            {groups.map((g) => (
              <Chip key={g} label={g} active={group === g} onPress={() => setGroup(g)} />
            ))}
          </ScrollView>
        ) : null}
        {mode === 'tours' ? <Sub>Les tours grisés sont prévus pour plus tard, vu son âge.</Sub> : null}
        {list.length === 0 ? (
          <Empty text={mode === 'liste' ? 'Touche l’étoile d’une fiche pour la garder ici.' : 'Aucun résultat.'} icon="star" />
        ) : null}
        {list.map((x) => {
          const wished = state.wishlist.includes(x.code);
          return (
            <Card key={x.code} onPress={() => router.push(x.href as never)} style={x.dim ? { opacity: 0.55 } : undefined}>
              <Row>
                <View style={s.icon}>
                  <Icon name={x.icon} size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{x.title}</Text>
                  <Text style={s.meta}>{x.meta}</Text>
                </View>
                <Pressable onPress={() => toggleWish(x.code)} hitSlop={12} accessibilityLabel="À lui apprendre">
                  <Text style={[s.star, wished && { color: colors.amber }]}>{wished ? '★' : '☆'}</Text>
                </Pressable>
              </Row>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 40 },
  body: { padding: 16, gap: 10, marginTop: -18 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  search: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: '#fff',
  },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 12.5, color: colors.ink3, marginTop: 1 },
  star: { fontSize: 24, color: colors.ink3 },
});
