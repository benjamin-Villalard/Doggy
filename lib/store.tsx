import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'mon-yorkshire-v1';

export type PottyKind = 'pipi' | 'caca' | 'accident-pipi' | 'accident-caca';
export type PottyEntry = { id: string; ts: string; kind: PottyKind };
export type WeightEntry = { id: string; date: string; grams: number };
export type SessionEntry = {
  id: string;
  ts: string;
  code: string;
  ok: number;
  ko: number;
  seconds: number;
  note?: string;
};

export type Sex = 'male' | 'female' | 'inconnu';
export type Tone = 'fun' | 'neutre' | 'expert';

export type Profile = {
  name: string;
  nickname: string;
  sex: Sex;
  birthdate: string | null;
  arrival: string | null;
  avatar: string;
  ownerName: string;
  adultWeightG: number | null;
};

/** Tout ce que l'utilisateur peut personnaliser (mots, objectifs, affichage). */
export type Prefs = {
  tone: Tone;
  emoji: boolean;
  recallWord: string;
  marker: string;
  releaseWord: string;
  treatWord: string;
  matWord: string;
  sessionSeconds: number;
  goalSessions: number;
  goalPotty: number;
  goalSocialWeek: number;
  weightUnit: 'g' | 'kg';
  showToyBoxes: boolean;
  showCriteria: boolean;
  reduceMotion: boolean;
  /** Mode clinicien : déverrouille constantes, protocoles détaillés et calculateur de doses. */
  clinicianMode: boolean;
};

export type HealthKind =
  | 'vaccin'
  | 'vermifuge'
  | 'antiparasitaire'
  | 'visite'
  | 'traitement'
  | 'soin'
  | 'autre';

export type HealthEntry = {
  id: string;
  date: string;
  kind: HealthKind;
  label: string;
  /** Code du protocole de référence (ex. « V2 » pour la 2e injection). */
  ref?: string | null;
  nextDate?: string | null;
  note?: string;
};

export type SymptomEntry = { id: string; ts: string; code: string; note?: string };

/** Relevé de constantes (mode clinicien). */
export type VitalEntry = {
  id: string;
  ts: string;
  weightG: number | null;
  temp: number | null;
  hr: number | null;
  rr: number | null;
  crt: number | null;
  glycemia: number | null;
  mucosa: string;
  pain: number | null;
  context: string;
  note?: string;
};

export type Health = {
  entries: HealthEntry[];
  symptoms: SymptomEntry[];
  vitals: VitalEntry[];
  clinicPhone: string;
  poisonPhone: string;
  vetName: string;
  vetPhone: string;
  emergencyName: string;
  emergencyPhone: string;
  chip: string;
  insurance: string;
  allergies: string;
  foodBrand: string;
  foodKcal: number | null;
  meals: number;
  sterilized: boolean;
};

export type State = {
  profile: Profile;
  prefs: Prefs;
  health: Health;
  skills: Record<string, number>;
  /** Palier atteint par tour (0 = pas commencé, 3 = maîtrisé). */
  tricks: Record<string, number>;
  social: Record<string, string>;
  potty: PottyEntry[];
  weights: WeightEntry[];
  sessions: SessionEntry[];
  issueCounts: Record<string, Record<string, number>>;
  watchedIssues: string[];
  notes: Record<string, string>;
  onboarded: boolean;
};

export const defaultPrefs: Prefs = {
  tone: 'fun',
  emoji: true,
  recallWord: 'Viens',
  marker: 'Oui',
  releaseWord: 'Ok',
  treatWord: 'friandise',
  matWord: 'panier',
  sessionSeconds: 120,
  goalSessions: 3,
  goalPotty: 6,
  goalSocialWeek: 7,
  weightUnit: 'g',
  showToyBoxes: true,
  showCriteria: true,
  reduceMotion: false,
  clinicianMode: false,
};

export const defaultHealth: Health = {
  entries: [],
  symptoms: [],
  vitals: [],
  clinicPhone: '',
  poisonPhone: '',
  vetName: '',
  vetPhone: '',
  emergencyName: '',
  emergencyPhone: '',
  chip: '',
  insurance: '',
  allergies: '',
  foodBrand: '',
  foodKcal: null,
  meals: 4,
  sterilized: false,
};

const defaultProfile: Profile = {
  name: '',
  nickname: '',
  sex: 'inconnu',
  birthdate: null,
  arrival: null,
  avatar: '🐶',
  ownerName: '',
  adultWeightG: 2600,
};

const initial: State = {
  profile: defaultProfile,
  prefs: defaultPrefs,
  health: defaultHealth,
  skills: {},
  tricks: {},
  social: {},
  potty: [],
  weights: [],
  sessions: [],
  issueCounts: {},
  watchedIssues: [],
  notes: {},
  onboarded: false,
};

/** Fusionne un état sauvegardé (possiblement d'une version antérieure) avec les valeurs par défaut. */
function hydrate(raw: unknown): State {
  const saved = (raw ?? {}) as Partial<State>;
  return {
    ...initial,
    ...saved,
    tricks: saved.tricks ?? {},
    profile: { ...defaultProfile, ...(saved.profile ?? {}) },
    prefs: { ...defaultPrefs, ...(saved.prefs ?? {}) },
    health: { ...defaultHealth, ...(saved.health ?? {}) },
  };
}

type Ctx = {
  state: State;
  ready: boolean;
  update: (fn: (s: State) => State) => void;
  reset: () => void;
};

const StoreContext = createContext<Ctx>({ state: initial, ready: false, update: () => {}, reset: () => {} });

const uid = () => Math.random().toString(36).slice(2, 10);
export const newId = uid;
export const today = () => new Date().toISOString().slice(0, 10);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState(hydrate(JSON.parse(raw)));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      update: (fn) => setState((s) => fn(s)),
      reset: () => setState(initial),
    }),
    [state, ready],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);

/* ---------- actions ---------- */

export function useActions() {
  const { update } = useStore();
  return useMemo(
    () => ({
      setProfile: (p: Partial<Profile>) => update((s) => ({ ...s, profile: { ...s.profile, ...p } })),
      setPrefs: (p: Partial<Prefs>) => update((s) => ({ ...s, prefs: { ...s.prefs, ...p } })),
      setHealth: (h: Partial<Health>) => update((s) => ({ ...s, health: { ...s.health, ...h } })),
      addHealthEntry: (e: Omit<HealthEntry, 'id'>) =>
        update((s) => ({
          ...s,
          health: {
            ...s.health,
            entries: [{ ...e, id: uid() }, ...s.health.entries].sort((a, b) => (a.date < b.date ? 1 : -1)),
          },
        })),
      removeHealthEntry: (id: string) =>
        update((s) => ({ ...s, health: { ...s.health, entries: s.health.entries.filter((e) => e.id !== id) } })),
      addSymptom: (code: string, note?: string) =>
        update((s) => ({
          ...s,
          health: {
            ...s.health,
            symptoms: [{ id: uid(), ts: new Date().toISOString(), code, note }, ...s.health.symptoms].slice(0, 500),
          },
        })),
      removeSymptom: (id: string) =>
        update((s) => ({ ...s, health: { ...s.health, symptoms: s.health.symptoms.filter((e) => e.id !== id) } })),
      finishOnboarding: () => update((s) => ({ ...s, onboarded: true })),
      setSkill: (code: string, score: number) =>
        update((s) => ({ ...s, skills: { ...s.skills, [code]: score } })),
      setTrickLevel: (code: string, level: number) =>
        update((s) => ({ ...s, tricks: { ...s.tricks, [code]: Math.max(0, Math.min(3, level)) } })),
      addVital: (v: Omit<VitalEntry, 'id' | 'ts'>) =>
        update((s) => ({
          ...s,
          health: {
            ...s.health,
            vitals: [{ ...v, id: uid(), ts: new Date().toISOString() }, ...s.health.vitals].slice(0, 500),
          },
        })),
      removeVital: (id: string) =>
        update((s) => ({ ...s, health: { ...s.health, vitals: s.health.vitals.filter((v) => v.id !== id) } })),
      toggleSocial: (key: string) =>
        update((s) => {
          const next = { ...s.social };
          if (next[key]) delete next[key];
          else next[key] = today();
          return { ...s, social: next };
        }),
      addPotty: (kind: PottyKind) =>
        update((s) => ({
          ...s,
          potty: [{ id: uid(), ts: new Date().toISOString(), kind }, ...s.potty].slice(0, 2000),
        })),
      removePotty: (id: string) =>
        update((s) => ({ ...s, potty: s.potty.filter((p) => p.id !== id) })),
      addWeight: (date: string, grams: number) =>
        update((s) => ({
          ...s,
          weights: [...s.weights.filter((w) => w.date !== date), { id: uid(), date, grams }].sort((a, b) =>
            a.date < b.date ? -1 : 1,
          ),
        })),
      removeWeight: (id: string) =>
        update((s) => ({ ...s, weights: s.weights.filter((w) => w.id !== id) })),
      addSession: (e: Omit<SessionEntry, 'id' | 'ts'>) =>
        update((s) => ({
          ...s,
          sessions: [{ ...e, id: uid(), ts: new Date().toISOString() }, ...s.sessions].slice(0, 2000),
        })),
      bumpIssue: (code: string, delta: number) =>
        update((s) => {
          const day = today();
          const cur = s.issueCounts[code] ?? {};
          const n = Math.max(0, (cur[day] ?? 0) + delta);
          return { ...s, issueCounts: { ...s.issueCounts, [code]: { ...cur, [day]: n } } };
        }),
      toggleWatchIssue: (code: string) =>
        update((s) => ({
          ...s,
          watchedIssues: s.watchedIssues.includes(code)
            ? s.watchedIssues.filter((c) => c !== code)
            : [...s.watchedIssues, code],
        })),
      setNote: (key: string, text: string) =>
        update((s) => ({ ...s, notes: { ...s.notes, [key]: text } })),
    }),
    [update],
  );
}

/* ---------- sélecteurs ---------- */

export function ageInWeeks(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const ms = Date.now() - new Date(birthdate).getTime();
  return Math.max(0, Math.floor(ms / (7 * 24 * 3600 * 1000)));
}

export function ageInDays(birthdate: string | null): number | null {
  if (!birthdate) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(birthdate).getTime()) / 86400000));
}

export function ageLabel(birthdate: string | null): string {
  const w = ageInWeeks(birthdate);
  if (w === null) return 'âge inconnu';
  const months = Math.floor((w * 7) / 30.44);
  return w < 16 ? `${w} semaines` : `${months} mois (${w} sem.)`;
}

export function skillTotal(skills: Record<string, number>): number {
  return Object.values(skills).reduce((a, b) => a + b, 0);
}

export function lastWeightG(weights: WeightEntry[]): number | null {
  return weights.length ? weights[weights.length - 1].grams : null;
}

export function formatWeight(grams: number, unit: 'g' | 'kg'): string {
  return unit === 'kg' ? `${(grams / 1000).toFixed(2)} kg` : `${Math.round(grams)} g`;
}

export function daysWithoutAccident(potty: PottyEntry[]): number {
  const last = potty.find((p) => p.kind.startsWith('accident'));
  if (!last) return potty.length ? Math.floor((Date.now() - new Date(potty[potty.length - 1].ts).getTime()) / 86400000) : 0;
  return Math.floor((Date.now() - new Date(last.ts).getTime()) / 86400000);
}

/** Heures de la journée où les accidents se répètent (≥ 2) : sortie manquante. */
export function accidentHotHours(potty: PottyEntry[]): { hour: number; count: number }[] {
  const map = new Map<number, number>();
  potty
    .filter((p) => p.kind.startsWith('accident'))
    .forEach((p) => {
      const h = new Date(p.ts).getHours();
      map.set(h, (map.get(h) ?? 0) + 1);
    });
  return [...map.entries()]
    .filter(([, c]) => c >= 2)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count);
}
