import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { CENTILES, centileAt, type GrowthBasis, type GrowthPoint, gompertz } from '../lib/growth';
import { colors } from '../lib/theme';

const MONTH = 30.44;

export default function GrowthChart({
  points,
  basis,
  months,
  ageDays,
  projectedAdultG,
  height = 240,
}: {
  points: GrowthPoint[];
  basis: GrowthBasis;
  months: number;
  ageDays: number | null;
  projectedAdultG?: number | null;
  height?: number;
}) {
  const [width, setWidth] = useState(320);
  const padL = 38;
  const padR = 34;
  const padT = 10;
  const padB = 24;
  const maxT = Math.round(months * MONTH);
  const visible = points.filter((p) => p.t <= maxT);
  const topCurve = centileAt(maxT, basis, 1.88);
  const maxY = Math.max(topCurve, ...visible.map((p) => p.grams)) * 1.06;
  const stepY = maxY > 2500 ? 500 : maxY > 1200 ? 250 : 100;
  const x = (t: number) => padL + (t / maxT) * (width - padL - padR);
  const y = (g: number) => padT + (1 - g / maxY) * (height - padT - padB);
  const samples = Array.from({ length: 61 }, (_, i) => (i / 60) * maxT);
  const curve = (z: number) => samples.map((t) => [x(t), y(centileAt(t, basis, z))] as const);
  const line = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const band = (zLo: number, zHi: number) => {
    const hi = curve(zHi);
    const lo = curve(zLo).reverse();
    return `${line(hi)} ${lo.map(([px, py]) => `L${px.toFixed(1)},${py.toFixed(1)}`).join(' ')} Z`;
  };
  const projection =
    projectedAdultG && Math.abs(projectedAdultG - basis.adultG) > basis.adultG * 0.03
      ? line(samples.map((t) => [x(t), y(gompertz(t, projectedAdultG, basis.birthG))] as const))
      : null;
  const monthStep = months > 6 ? 2 : 1;
  const yTicks: number[] = [];
  for (let g = 0; g <= maxY; g += stepY) yTicks.push(g);

  return (
    <View onLayout={(e) => setWidth(Math.max(260, e.nativeEvent.layout.width))}>
      <Svg width={width} height={height}>
        <Rect x={padL} y={padT} width={width - padL - padR} height={height - padT - padB} fill="#fbfaff" />
        {yTicks.map((g) => (
          <G key={`y${g}`}>
            <Line x1={padL} x2={width - padR} y1={y(g)} y2={y(g)} stroke={colors.line} strokeWidth={1} />
            <SvgText x={padL - 4} y={y(g) + 3} fontSize={9} fill={colors.ink3} textAnchor="end">
              {g >= 1000 ? `${(g / 1000).toLocaleString('fr-FR')} kg` : `${g}`}
            </SvgText>
          </G>
        ))}
        {Array.from({ length: Math.floor(months / monthStep) + 1 }, (_, i) => i * monthStep).map((m) => (
          <G key={`x${m}`}>
            <Line x1={x(m * MONTH)} x2={x(m * MONTH)} y1={padT} y2={height - padB} stroke={colors.line} strokeWidth={1} />
            <SvgText x={x(m * MONTH)} y={height - padB + 13} fontSize={9} fill={colors.ink3} textAnchor="middle">
              {m === 0 ? 'naiss.' : `${m} m`}
            </SvgText>
          </G>
        ))}
        <Path d={band(-1.88, 1.88)} fill={colors.accent} opacity={0.08} />
        <Path d={band(-1.04, 1.04)} fill={colors.accent} opacity={0.12} />
        {CENTILES.filter((c) => c.z !== 0).map((c) => (
          <Path key={c.key} d={line(curve(c.z))} stroke={colors.accent} strokeOpacity={0.35} strokeWidth={1} fill="none" />
        ))}
        <Path d={line(curve(0))} stroke={colors.accent} strokeWidth={2.4} strokeDasharray="6 4" fill="none" />
        {projection ? <Path d={projection} stroke={colors.coral} strokeWidth={1.6} strokeDasharray="2 3" fill="none" /> : null}
        {CENTILES.map((c) => (
          <SvgText
            key={`l${c.key}`}
            x={width - padR + 3}
            y={y(centileAt(maxT, basis, c.z)) + 3}
            fontSize={8.5}
            fill={c.z === 0 ? colors.accent : colors.ink3}
            fontWeight={c.z === 0 ? '700' : '400'}
          >
            {c.key}
          </SvgText>
        ))}
        {ageDays !== null && ageDays <= maxT ? (
          <Line x1={x(ageDays)} x2={x(ageDays)} y1={padT} y2={height - padB} stroke={colors.green} strokeWidth={1.2} strokeDasharray="3 3" />
        ) : null}
        {visible.length > 1 ? (
          <Path d={line(visible.map((p) => [x(p.t), y(p.grams)] as const))} stroke={colors.ink} strokeWidth={2} fill="none" />
        ) : null}
        {visible.map((p) => (
          <Circle key={p.id} cx={x(p.t)} cy={y(p.grams)} r={3.6} fill="#fff" stroke={colors.ink} strokeWidth={2} />
        ))}
      </Svg>
      <View style={s.legend}>
        <Legend color={colors.ink} label="Ses pesées" />
        <Legend color={colors.accent} label="Courbe attendue (P50)" dashed />
        {projection ? <Legend color={colors.coral} label="Projection selon ses pesées" dashed /> : null}
        <Legend color={colors.accent} label="Couloirs P3-P97" band />
      </View>
    </View>
  );
}

function Legend({ color, label, dashed, band }: { color: string; label: string; dashed?: boolean; band?: boolean }) {
  return (
    <View style={s.item}>
      <View
        style={[
          s.swatch,
          band
            ? { backgroundColor: color, opacity: 0.2, height: 10 }
            : { borderTopWidth: 2, borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' },
        ]}
      />
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 18, height: 0 },
  label: { fontSize: 11, color: colors.ink2 },
});
