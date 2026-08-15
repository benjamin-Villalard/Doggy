import { skills, socialization, tutorials } from './content';
import type { State } from './store';

/** XP : 10 par point de compétence, 5 par socialisation validée, 4 par séance, 2 par réussite propreté. */
export function xpTotal(state: State): number {
  const skillXp = Object.values(state.skills).reduce((a, b) => a + b, 0) * 10;
  const socialXp = Object.keys(state.social).length * 5;
  const sessionXp = state.sessions.length * 4;
  const pottyXp = state.potty.filter((p) => !p.kind.startsWith('accident')).length * 2;
  const weightXp = state.weights.length * 3;
  return skillXp + socialXp + sessionXp + pottyXp + weightXp;
}

const LEVELS = [
  { name: 'Nouveau-né', min: 0 },
  { name: 'Chiot curieux', min: 120 },
  { name: 'Apprenti', min: 320 },
  { name: 'Élève sérieux', min: 620 },
  { name: 'Bon élève', min: 1000 },
  { name: 'Chien de ville', min: 1500 },
  { name: 'Compagnon fiable', min: 2100 },
  { name: 'Yorkshire modèle', min: 2800 },
];

export function level(state: State) {
  const xp = xpTotal(state);
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (xp >= LEVELS[k].min) i = k;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  return {
    index: i + 1,
    name: cur.name,
    xp,
    into: xp - cur.min,
    span: next ? next.min - cur.min : 1,
    nextName: next?.name ?? null,
  };
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Jours consécutifs (jusqu'à aujourd'hui ou hier) avec au moins une séance ou une entrée propreté. */
export function streak(state: State): number {
  const days = new Set<string>();
  state.sessions.forEach((s) => days.add(s.ts.slice(0, 10)));
  state.potty.forEach((p) => days.add(p.ts.slice(0, 10)));
  Object.values(state.social).forEach((d) => days.add(d));
  if (days.size === 0) return 0;

  const t = new Date();
  let cursor = days.has(dayKey(t)) ? t : new Date(Date.now() - 86400000);
  if (!days.has(dayKey(cursor))) return 0;
  let n = 0;
  while (days.has(dayKey(cursor))) {
    n += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return n;
}

export type DailyGoal = { key: string; label: string; done: boolean; icon: string };

/** Les 4 objectifs quotidiens du livre : 3 séances, 1 socialisation, 1 manipulation, journal propreté. */
export function dailyGoals(state: State): DailyGoal[] {
  const d = dayKey(new Date());
  const sessionsToday = state.sessions.filter((s) => s.ts.slice(0, 10) === d).length;
  const socialToday = Object.values(state.social).filter((v) => v === d).length;
  const pottyToday = state.potty.filter((p) => p.ts.slice(0, 10) === d).length;
  const handlingToday = state.sessions.some((s) => s.ts.slice(0, 10) === d && ['T10', 'T21', 'T22'].includes(s.code));
  return [
    { key: 'sessions', label: `3 séances de 2 min (${Math.min(sessionsToday, 3)}/3)`, done: sessionsToday >= 3, icon: 'clock' },
    { key: 'social', label: `1 nouvelle socialisation (${socialToday})`, done: socialToday >= 1, icon: 'people' },
    { key: 'handling', label: 'Manipulation / toilettage 60 s', done: handlingToday, icon: 'brush' },
    { key: 'potty', label: `Journal propreté tenu (${pottyToday})`, done: pottyToday >= 1, icon: 'drop' },
  ];
}

export type Badge = { code: string; name: string; hint: string; icon: string; got: boolean };

export function badges(state: State): Badge[] {
  const socialCount = Object.keys(state.social).length;
  const socialTotal = socialization.reduce((a, c) => a + c.items.length, 0);
  const at4 = Object.values(state.skills).filter((v) => v >= 4).length;
  const sessions = state.sessions.length;
  const bestStreak = streak(state);
  const noAccident7 = (() => {
    const last = state.potty.find((p) => p.kind.startsWith('accident'));
    if (!last) return state.potty.length > 0;
    return Date.now() - new Date(last.ts).getTime() > 7 * 86400000;
  })();

  return [
    { code: 'b1', name: 'Premier clic', hint: '1re séance enregistrée', icon: 'clicker', got: sessions >= 1 },
    { code: 'b2', name: 'Régulier', hint: '3 jours de suite', icon: 'flame', got: bestStreak >= 3 },
    { code: 'b3', name: 'Marathon', hint: '7 jours de suite', icon: 'flame', got: bestStreak >= 7 },
    { code: 'b4', name: 'Explorateur', hint: '25 socialisations', icon: 'people', got: socialCount >= 25 },
    { code: 'b5', name: 'Citoyen du monde', hint: `${socialTotal} socialisations`, icon: 'city', got: socialCount >= socialTotal },
    { code: 'b6', name: 'Propre', hint: '7 jours sans accident', icon: 'drop', got: noAccident7 },
    { code: 'b7', name: 'Studieux', hint: '20 séances', icon: 'clock', got: sessions >= 20 },
    { code: 'b8', name: 'Cinq à quatre', hint: '5 compétences à 4/5', icon: 'star', got: at4 >= 5 },
    { code: 'b9', name: 'Moitié du chemin', hint: `${Math.ceil(tutorials.length / 2)} compétences à 4/5`, icon: 'trophy', got: at4 >= Math.ceil(tutorials.length / 2) },
    { code: 'b10', name: 'Diplômé', hint: `${skills.length} compétences à 4/5`, icon: 'trophy', got: at4 >= skills.length },
  ];
}
