import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { level, streak } from '../lib/gamification';
import { ageLabel, useStore } from '../lib/store';
import { colors, grad, gradients, shadow } from '../lib/theme';
import Icon from './Icon';

function MiniRing({ value, max, label }: { value: number; max: number; label: string }) {
  const size = 54;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#fff"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={s.ringCenter}>
          <Text style={s.ringTxt}>{Math.round(pct * 100)}%</Text>
        </View>
      </View>
      <Text style={s.ringLabel}>{label}</Text>
    </View>
  );
}

export default function Hero({
  phaseTitle,
  skillValue,
  skillMax,
  socialValue,
  socialMax,
}: {
  phaseTitle: string;
  skillValue: number;
  skillMax: number;
  socialValue: number;
  socialMax: number;
}) {
  const { state } = useStore();
  const router = useRouter();
  const lvl = level(state);
  const st = streak(state);
  const initial = (state.profile.name || '?').trim().charAt(0).toUpperCase();

  return (
    <LinearGradient colors={grad(gradients.hero)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.wrap}>
      <View style={s.blob1} />
      <View style={s.blob2} />

      <View style={s.topRow}>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.hello}>Salut {state.profile.name || 'toi'} !</Text>
          <Text style={s.age}>{ageLabel(state.profile.birthdate)}</Text>
        </View>
        <Pressable onPress={() => router.push('/reglages')} style={s.iconBtn} hitSlop={8}>
          <Icon name="hand" size={18} color="#fff" />
        </Pressable>
      </View>

      <View style={s.badgeRow}>
        <View style={s.tag}>
          <Icon name="flame" size={13} color="#ffd76a" />
          <Text style={s.tagTxt}>{st} j de série</Text>
        </View>
        <View style={s.tag}>
          <Icon name="bolt" size={13} color="#ffd76a" />
          <Text style={s.tagTxt}>{lvl.xp} XP</Text>
        </View>
        <View style={s.tag}>
          <Text style={s.tagTxt}>Niv. {lvl.index} · {lvl.name}</Text>
        </View>
      </View>

      <View style={s.levelTrack}>
        <View style={[s.levelFill, { width: `${Math.min(100, (lvl.into / lvl.span) * 100)}%` }]} />
      </View>
      <Text style={s.levelHint}>
        {lvl.nextName ? `${lvl.span - lvl.into} XP avant « ${lvl.nextName} »` : 'Niveau maximum atteint'}
      </Text>

      <Pressable style={s.phase} onPress={() => router.push('/programme')}>
        <Icon name="target" size={15} color="#fff" />
        <Text style={s.phaseTxt} numberOfLines={1}>
          {phaseTitle}
        </Text>
        <Text style={s.phaseChev}>›</Text>
      </Pressable>

      <View style={s.rings}>
        <MiniRing value={skillValue} max={skillMax} label="COMPÉTENCES" />
        <MiniRing value={socialValue} max={socialMax} label="SOCIALISATION" />
        <MiniRing value={lvl.into} max={lvl.span} label="NIVEAU" />
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    gap: 10,
    overflow: 'hidden',
    ...shadow.lift,
  },
  blob1: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -70,
    right: -50,
  },
  blob2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -50,
    left: -30,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarTxt: { color: '#fff', fontSize: 21, fontWeight: '800' },
  hello: { color: '#fff', fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  age: { color: 'rgba(255,255,255,0.75)', fontSize: 12.5, fontWeight: '600' },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tagTxt: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
  levelTrack: { height: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  levelFill: { height: 7, borderRadius: 999, backgroundColor: '#ffd76a' },
  levelHint: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
  phase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  phaseTxt: { color: '#fff', fontSize: 13.5, fontWeight: '700', flex: 1 },
  phaseChev: { color: '#fff', fontSize: 20, fontWeight: '700' },
  rings: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 2 },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  ringLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
});
