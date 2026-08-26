import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Block } from '../lib/content';
import { boxStyles, colors, radius } from '../lib/theme';
import Icon from './Icon';
import Rich from './Rich';

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'h':
      return (
        <View style={s.hRow}>
          {block.icon ? <Icon name={block.icon} size={18} /> : null}
          <Text style={block.level <= 3 ? s.h3 : s.h4}>{block.text.replace(/\*\*/g, '')}</Text>
        </View>
      );
    case 'p':
      return <Rich text={block.text} style={s.p} />;
    case 'list':
      return (
        <View style={{ gap: 4 }}>
          {block.items.map((it, i) => (
            <View key={i} style={s.liRow}>
              <Text style={s.bullet}>{block.ordered ? `${i + 1}.` : '•'}</Text>
              <Rich text={it} style={{ flex: 1 }} />
            </View>
          ))}
        </View>
      );
    case 'step':
      return (
        <View style={s.stepRow}>
          <View style={s.stepNum}>
            <Text style={s.stepNumText}>{block.n}</Text>
          </View>
          <Rich text={block.text} style={{ flex: 1 }} />
        </View>
      );
    case 'table':
      return <TableView rows={block.rows} />;
    case 'tutref':
      return (
        <Link href={`/tutos/${block.code}`} style={s.link}>
          Ouvrir le tutoriel {block.code} →
        </Link>
      );
    case 'box':
      return <BoxView block={block} />;
    default:
      return null;
  }
}

function BoxView({ block }: { block: Extract<Block, { type: 'box' }> }) {
  const v = boxStyles[block.variant] ?? boxStyles.neutral;
  return (
    <View style={[s.box, { backgroundColor: v.bg, borderLeftColor: v.border }]}>
      {block.title ? (
        <View style={s.hRow}>
          {block.icon ? <Icon name={block.icon} size={17} color={v.fg} /> : null}
          <Text style={[s.boxTitle, { color: v.fg }]}>{block.title.replace(/\*\*/g, '')}</Text>
        </View>
      ) : null}
      {block.text ? <Rich text={block.text} /> : null}
      {block.blocks?.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </View>
  );
}

function TableView({ rows }: { rows: { header: boolean; cells: string[] }[] }) {
  const cols = Math.max(...rows.map((r) => r.cells.length));
  const wide = cols > 3;
  const table = (
    <View style={[s.table, wide && { minWidth: cols * 110 }]}>
      {rows.map((r, i) => (
        <View key={i} style={[s.tr, r.header && s.trHeader, i > 0 && s.trBorder]}>
          {r.cells.map((c, j) => (
            <View key={j} style={[s.td, wide ? { width: 110 } : { flex: j === 0 ? 1.1 : 1 }]}>
              <Rich
                text={c || '—'}
                style={[s.tdText, r.header && s.thText] as never}
                bold={r.header ? colors.accent : colors.ink}
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
  if (!wide) return table;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginVertical: 2 }}>
      {table}
    </ScrollView>
  );
}

export default function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <View style={{ gap: 10 }}>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  hRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  h3: { fontSize: 15.5, fontWeight: '800', color: colors.accent, flex: 1 },
  h4: { fontSize: 14, fontWeight: '700', color: colors.ink, flex: 1 },
  p: { fontSize: 14, lineHeight: 21 },
  liRow: { flexDirection: 'row', gap: 8 },
  bullet: { color: colors.accent, fontWeight: '700' },
  stepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  box: {
    borderRadius: radius,
    borderLeftWidth: 4,
    padding: 12,
    gap: 6,
  },
  boxTitle: { fontSize: 14, fontWeight: '800', flex: 1 },
  table: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, overflow: 'hidden' },
  tr: { flexDirection: 'row' },
  trHeader: { backgroundColor: colors.accentSoft },
  trBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  td: { padding: 8 },
  tdText: { fontSize: 12.5, lineHeight: 18 },
  thText: { fontWeight: '800', color: colors.accent },
  link: { color: colors.accent, fontWeight: '700', fontSize: 14 },
});
