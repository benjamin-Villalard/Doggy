import {
  phaseRanges,
  phaseTutorials,
  phases,
  skillTargetWeeks,
  skills,
  tricks,
  tutorialByCode,
  type Section,
  type Trick,
  type Tutorial,
} from './content';
import { ageInWeeks, type State } from './store';

export function currentPhaseIndex(birthdate: string | null): number {
  const w = ageInWeeks(birthdate);
  if (w === null) return 1;
  const i = phaseRanges.findIndex((r) => w >= r.from && w < r.to);
  return i === -1 ? phaseRanges.length - 1 : i;
}

export function currentPhase(birthdate: string | null): Section | undefined {
  return phases[currentPhaseIndex(birthdate)];
}

export function phaseKey(index: number): string {
  return phaseRanges[Math.min(index, phaseRanges.length - 1)].title;
}

/** Les 3 priorités du jour : compétences de la phase en cours les moins avancées. */
export function todaysFocus(state: State, limit = 3): { tutorial: Tutorial; score: number; reason: string }[] {
  const idx = currentPhaseIndex(state.profile.birthdate);
  const key = phaseKey(idx);
  const weeks = ageInWeeks(state.profile.birthdate) ?? 8;
  const codes = phaseTutorials[key] ?? [];
  const scored = codes
    .map((code) => {
      const tutorial = tutorialByCode(code);
      const score = state.skills[code] ?? 0;
      const skill = skills.find((s) => s.code === code);
      const target = skillTargetWeeks[code] ?? 52;
      const late = weeks > target && score < 4;
      const reason = late
        ? `En retard sur la cible (${skill?.target ?? '—'})`
        : score === 0
          ? 'Jamais travaillé'
          : `Niveau ${score}/5 — à consolider`;
      return { tutorial, score, late, priority: (late ? 0 : 10) + score, reason };
    })
    .filter((x): x is { tutorial: Tutorial; score: number; late: boolean; priority: number; reason: string } => !!x.tutorial)
    .sort((a, b) => a.priority - b.priority || a.tutorial.code.localeCompare(b.tutorial.code));
  return scored.slice(0, limit).map(({ tutorial, score, reason }) => ({ tutorial, score, reason }));
}

/** Compétences clés (en gras dans le livre) en retard sur l'âge cible. */
export function lateKeySkills(state: State): { code: string; name: string; score: number; target: string }[] {
  const weeks = ageInWeeks(state.profile.birthdate);
  if (weeks === null) return [];
  return skills
    .filter((s) => s.key && weeks > (skillTargetWeeks[s.code] ?? 52) && (state.skills[s.code] ?? 0) < 3)
    .map((s) => ({ code: s.code, name: s.name, score: state.skills[s.code] ?? 0, target: s.target }));
}

export const MILESTONES = [
  { key: 'M3', weeks: 13, min: 25 },
  { key: 'M4', weeks: 17, min: 45 },
  { key: 'M6', weeks: 26, min: 75 },
  { key: 'M9', weeks: 39, min: 100 },
  { key: 'M12', weeks: 52, min: 120 },
];

export function nextMilestone(birthdate: string | null) {
  const w = ageInWeeks(birthdate) ?? 0;
  return MILESTONES.find((m) => w <= m.weeks) ?? MILESTONES[MILESTONES.length - 1];
}

/** Numéro de semaine ISO, utilisé pour faire tourner le plan d'entraînement. */
export function isoWeek(d = new Date()): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - start.getTime()) / 86400000 + 1) / 7);
}

/**
 * Plan d'entraînement de la semaine : 3 tours accessibles à l'âge du chien,
 * en priorisant ceux déjà entamés puis les plus faciles, avec une rotation
 * hebdomadaire pour ne pas proposer toujours les mêmes.
 */
export function weeklyTrickPlan(state: State, count = 3): { trick: Trick; level: number; reason: string }[] {
  const weeks = ageInWeeks(state.profile.birthdate);
  const eligible = tricks.filter((t) => weeks === null || weeks >= t.minAgeWeeks);
  const pool = eligible.filter((t) => (state.tricks[t.code] ?? 0) < 3);
  const source = pool.length ? pool : eligible;
  const scored = source
    .map((t) => {
      const level = state.tricks[t.code] ?? 0;
      return { trick: t, level, weight: level > 0 ? 0 : 1 };
    })
    .sort((a, b) => a.weight - b.weight || a.trick.stars - b.trick.stars || a.trick.code.localeCompare(b.trick.code));

  const started = scored.filter((x) => x.level > 0).slice(0, count);
  const fresh = scored.filter((x) => x.level === 0);
  const offset = fresh.length ? (isoWeek() * count) % fresh.length : 0;
  const rotated = fresh.slice(offset).concat(fresh.slice(0, offset));
  const picked = [...started, ...rotated].slice(0, count);

  return picked.map(({ trick, level }) => ({
    trick,
    level,
    reason:
      level === 0
        ? 'à découvrir cette semaine'
        : level < 3
          ? `palier ${level + 1} à valider : ${trick.levels[level]?.goal ?? ''}`
          : 'à entretenir',
  }));
}

/** Poids indicatif d'un Yorkshire standard (g) selon l'âge, pour situer la courbe. */
export function expectedWeightRange(weeks: number): [number, number] {
  const table: [number, number, number][] = [
    [8, 500, 900],
    [12, 800, 1400],
    [16, 1100, 1900],
    [20, 1400, 2300],
    [26, 1700, 2800],
    [39, 1900, 3100],
    [52, 2000, 3200],
  ];
  let lo = table[0];
  for (const row of table) {
    if (weeks >= row[0]) lo = row;
  }
  return [lo[1], lo[2]];
}
