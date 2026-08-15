import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/Icon';
import { Card, Progress, Row, Sub } from '../../components/UI';
import { socialization } from '../../lib/content';
import { ageInWeeks, useActions, useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

const GOALS = [
  { weeks: 12, target: 60 },
  { weeks: 22, target: 100 },
  { weeks: 35, target: 120 },
];

export default function Socialisation() {
  const { state } = useStore();
  const { toggleSocial } = useActions();
  const [open, setOpen] = useState<string | null>(socialization[0]?.name ?? null);
  const total = socialization.reduce((a, c) => a + c.items.length, 0);
  const done = Object.keys(state.social).length;
  const weeks = ageInWeeks(state.profile.birthdate) ?? 0;
  const goal = GOALS.find((g) => weeks <= g.weeks) ?? GOALS[GOALS.length - 1];

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Card>
        <Progress value={done} max={total} label="Expériences validées" color={colors.blue} />
        <Sub>
          Objectif à ton âge actuel : {goal.target} avant {goal.weeks} semaines. Ne coche que si l'expérience s'est
          passée sous le seuil (il mangeait, il pouvait se détourner, il n'a pas été forcé).
        </Sub>
      </Card>

      {socialization.map((cat) => {
        const catDone = cat.items.filter((it) => state.social[`${cat.name}:${it}`]).length;
        const expanded = open === cat.name;
        return (
          <Card key={cat.name}>
            <Pressable onPress={() => setOpen(expanded ? null : cat.name)}>
              <Row>
                <Icon name={cat.icon} size={20} />
                <Text style={s.title}>{cat.name}</Text>
                <Text style={s.count}>
                  {catDone}/{cat.items.length}
                </Text>
                <Text style={s.chev}>{expanded ? '⌃' : '⌄'}</Text>
              </Row>
            </Pressable>
            <Progress value={catDone} max={cat.items.length} color={colors.blue} />
            {expanded
              ? cat.items.map((it) => {
                  const key = `${cat.name}:${it}`;
                  const date = state.social[key];
                  return (
                    <Pressable key={it} onPress={() => toggleSocial(key)} style={s.row}>
                      <View style={[s.box, date ? { backgroundColor: colors.blue, borderColor: colors.blue } : null]}>
                        {date ? <Text style={s.tick}>✓</Text> : null}
                      </View>
                      <Text style={[s.item, date && { color: colors.ink3 }]}>{it}</Text>
                      {date ? <Text style={s.date}>{date.slice(5)}</Text> : null}
                    </Pressable>
                  );
                })
              : null}
          </Card>
        );
      })}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 10, paddingBottom: 40 },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 },
  count: { fontSize: 13, fontWeight: '800', color: colors.blue },
  chev: { fontSize: 16, color: colors.ink3, width: 16, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { color: '#fff', fontSize: 13, fontWeight: '800' },
  item: { flex: 1, fontSize: 13.5, color: colors.ink },
  date: { fontSize: 11, color: colors.ink3 },
});
