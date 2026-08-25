import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from '../../components/Icon';
import ScreenHeader from '../../components/ScreenHeader';
import { Card, Chip, Empty, Pill, Progress, Row, Sub } from '../../components/UI';
import { tricks, trickCategories, tutorialBlocks, tutorials } from '../../lib/content';
import { weeklyTrickPlan } from '../../lib/coach';
import { ageInWeeks, useStore } from '../../lib/store';
import { colors, gradients, shadow, type } from '../../lib/theme';

const norm = (v: string) =>
  v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export default function Tutos() {
  const { state } = useStore();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'tutos' | 'tours'>('tutos');
  const [block, setBlock] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const weeks = ageInWeeks(state.profile.birthdate);
  const plan = useMemo(() => weeklyTrickPlan(state), [state]);

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

  const trickList = useMemo(() => {
    const needle = norm(q.trim());
    return tricks.filter((t) => {
      if (cat && t.category !== cat) return false;
      if (!needle) return true;
      return norm([t.code, t.title, t.category, t.cue, t.why, ...t.steps].join(' ')).includes(needle);
    });
  }, [q, cat]);

  const mastered = tutorials.filter((t) => (state.skills[t.code] ?? 0) >= 4).length;
  const trickPoints = tricks.reduce((a, t) => a + (state.tricks[t.code] ?? 0), 0);
  const tricksDone = tricks.filter((t) => (state.tricks[t.code] ?? 0) >= 3).length;

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title={mode === 'tutos' ? `${tutorials.length} tutoriels` : `${tricks.length} tours à apprendre`}
        subtitle={
          mode === 'tutos'
            ? `${mastered} maîtrisés · étapes, critère de réussite et minuteur`
            : `${tricksDone} tours validés · ${trickPoints}/${tricks.length * 3} paliers franchis`
        }
        icon={mode === 'tutos' ? 'clicker' : 'trophy'}
      />

      <View style={s.body}>
        <View style={[s.seg, shadow.soft]}>
          {(
            [
              { k: 'tutos' as const, label: 'Éducation', icon: 'clicker' },
              { k: 'tours' as const, label: 'Tours & tricks', icon: 'medal' },
            ]
          ).map((o) => (
            <Pressable
              key={o.k}
              onPress={() => setMode(o.k)}
              style={[s.segItem, mode === o.k && s.segItemActive]}
            >
              <Icon name={o.icon} size={16} color={mode === o.k ? '#fff' : colors.ink3} />
              <Text style={[s.segText, mode === o.k && { color: '#fff' }]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[s.search, shadow.soft]}>
          <Icon name="eye" size={17} color={colors.ink3} />
          <TextInput
            style={s.input}
            value={q}
            onChangeText={setQ}
            placeholder={mode === 'tutos' ? 'Rechercher (rappel, laisse, morsure…)' : 'Rechercher (patte, roule, slalom…)'}
            placeholderTextColor={colors.ink3}
          />
        </View>

        {mode === 'tutos' ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
            >
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
          </>
        ) : (
          <>
            <Card style={{ backgroundColor: colors.accentSoft }} tone="flat">
              <Row>
                <Icon name="calendar" size={17} color={colors.accent} />
                <Text style={[s.title, { flex: 1, color: colors.accentDeep }]}>Plan de la semaine</Text>
              </Row>
              {plan.map((p) => (
                <Pressable
                  key={p.trick.code}
                  onPress={() => router.push(`/tours/${p.trick.code}`)}
                  style={s.planRow}
                >
                  <Icon name={p.trick.icon} size={18} color={colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.planTitle}>{p.trick.title}</Text>
                    <Text style={s.meta}>{p.reason}</Text>
                  </View>
                  <Pill tone="accent">{p.level}/3</Pill>
                </Pressable>
              ))}
              <Sub>3 tours à travailler d'ici dimanche, choisis selon l'âge et les paliers déjà validés.</Sub>
            </Card>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
            >
              <Chip label="Tous" active={cat === null} onPress={() => setCat(null)} />
              {trickCategories.map((c) => (
                <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />
              ))}
            </ScrollView>

            {trickList.map((t) => {
              const level = state.tricks[t.code] ?? 0;
              const locked = weeks !== null && weeks < t.minAgeWeeks;
              return (
                <Card key={t.code} onPress={() => router.push(`/tours/${t.code}`)}>
                  <Row>
                    <View
                      style={[
                        s.icon,
                        { backgroundColor: colors.pinkSoft },
                        level >= 3 && { backgroundColor: colors.greenSoft },
                        locked && { backgroundColor: colors.bgAlt },
                      ]}
                    >
                      <Icon
                        name={t.icon}
                        size={22}
                        color={locked ? colors.ink3 : level >= 3 ? colors.green : colors.pink}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 5 }}>
                      <Text style={s.title}>{t.title}</Text>
                      <Text style={s.meta}>
                        {'★'.repeat(t.stars)}
                        {'☆'.repeat(3 - t.stars)} · {t.category}
                        {locked ? ` · dès ${Math.round(t.minAgeWeeks / 4.35)} mois` : ''}
                      </Text>
                      <Progress
                        value={level}
                        max={3}
                        height={7}
                        hideValue
                        gradient={level >= 3 ? gradients.green : gradients.pink}
                      />
                    </View>
                    <Pill tone={level >= 3 ? 'green' : level > 0 ? 'accent' : 'grey'} solid={level >= 3}>
                      {level}/3
                    </Pill>
                  </Row>
                </Card>
              );
            })}
            {trickList.length === 0 ? <Empty text="Aucun tour ne correspond à cette recherche." icon="medal" /> : null}
            <Sub>
              Les tours ne sont pas du décor : ils construisent l'attention, la coordination et la manipulation sans
              stress. 2 minutes par tour, 2 fois par jour.
            </Sub>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 36 },
  body: { paddingHorizontal: 14, paddingTop: 14, gap: 10 },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  meta: { ...type.small, color: colors.ink3 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 5 },
  planTitle: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  seg: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 999, padding: 4, gap: 4 },
  segItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 999,
  },
  segItemActive: { backgroundColor: colors.accent },
  segText: { fontSize: 13.5, fontWeight: '800', color: colors.ink3 },
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
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
