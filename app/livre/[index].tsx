import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Blocks from '../../components/Blocks';
import { Title } from '../../components/UI';
import { librarySections } from '../../lib/content';

export default function Chapitre() {
  const { index } = useLocalSearchParams<{ index: string }>();
  const sec = librarySections[Number(index)];
  if (!sec) return <Text style={s.wrap}>Chapitre introuvable.</Text>;
  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Stack.Screen options={{ title: sec.title.slice(0, 28) }} />
      <Title icon={sec.icon}>{sec.title}</Title>
      <Blocks blocks={sec.blocks} />
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14, gap: 12, paddingBottom: 40 },
});
