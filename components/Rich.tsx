import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { colors } from '../lib/theme';
import { useVoice } from '../lib/voice';

/** Rend le markup léger produit par l'extracteur : **gras** et retours ligne. */
export default function Rich({
  text,
  style,
  bold = colors.ink,
}: {
  text: string;
  style?: TextStyle;
  bold?: string;
}) {
  const voice = useVoice();
  const parts = voice.t(text).split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== '');
  return (
    <Text style={[s.base, style]}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <Text key={i} style={{ fontWeight: '700', color: bold }}>
            {p.slice(2, -2)}
          </Text>
        ) : (
          <Text key={i}>{p}</Text>
        ),
      )}
    </Text>
  );
}

const s = StyleSheet.create({
  base: { fontSize: 14, lineHeight: 21, color: colors.ink2 },
});
