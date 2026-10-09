import raw from '../content/health.json';
import { ageInWeeks, type Health, type Profile, type State, type WeightEntry } from './store';

export type Vaccine = {
  code: string;
  label: string;
  weeks: number;
  valences: string;
  note: string;
  optional: boolean;
};

export type EmergencySheet = {
  code: string;
  title: string;
  icon: string;
  signs: string[];
  doNow: string[];
  never: string[];
};

export type Urgency = 'urgent' | 'rapide' | 'surveiller';
export type ClinicalSign = { code: string; title: string; urgency: Urgency; why: string };

export type DewormingStep = { code: string; label: string; note: string };

export type HealthContent = {
  disclaimer: string;
  vaccines: Vaccine[];
  vaccineRules: string[];
  deworming: DewormingStep[];
  nutrition: {
    rules: string[];
    treats: string[];
    meals: { untilWeeks: number; meals: number; label: string }[];
  };
  emergency: EmergencySheet[];
  signs: ClinicalSign[];
  kit: string[];
  yorkSpecific: { title: string; icon: string; text: string }[];
};

export const health = raw as HealthContent;

export const emergencyByCode = (code: string) => health.emergency.find((e) => e.code === code);

/* ---------- dates ---------- */

export const iso = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return iso(d);
}

export const addWeeks = (date: string, weeks: number) => addDays(date, weeks * 7);
export const addMonths = (date: string, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return iso(d);
};

export function daysUntil(date: string): number {
  return Math.round((new Date(date).getTime() - new Date(iso(new Date())).getTime()) / 86400000);
}

export function frDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

/* ---------- plan vaccinal ---------- */

export type PlanStatus = 'fait' | 'retard' | 'bientot' | 'aVenir' | 'inconnu';

export type PlanItem = {
  vaccine: Vaccine;
  due: string | null;
  doneDate: string | null;
  status: PlanStatus;
  days: number | null;
};

export function vaccinePlan(profile: Profile, healthState: Health): PlanItem[] {
  return health.vaccines.map((vaccine) => {
    const done = healthState.entries.find((e) => e.kind === 'vaccin' && e.ref === vaccine.code);
    const due = profile.birthdate ? addWeeks(profile.birthdate, vaccine.weeks) : null;
    const days = due ? daysUntil(due) : null;
    const status: PlanStatus = done
      ? 'fait'
      : due === null
        ? 'inconnu'
        : days === null
          ? 'inconnu'
          : days < 0
            ? 'retard'
            : days <= 14
              ? 'bientot'
              : 'aVenir';
    return { vaccine, due, doneDate: done?.date ?? null, status, days };
  });
}

/** Prochaine échéance de vermifuge selon ESCCAP (mensuel jusqu'à 6 mois, puis trimestriel). */
export function nextDeworming(profile: Profile, healthState: Health): { due: string | null; last: string | null } {
  const last = healthState.entries.filter((e) => e.kind === 'vermifuge').map((e) => e.date).sort().pop() ?? null;
  const weeks = ageInWeeks(profile.birthdate);
  const everyMonths = weeks !== null && weeks < 26 ? 1 : 3;
  if (last) return { due: addMonths(last, everyMonths), last };
  return { due: profile.arrival ?? (profile.birthdate ? addWeeks(profile.birthdate, 8) : null), last: null };
}

/** Rappels de santé à venir ou en retard, tous types confondus, triés par date. */
export function healthAlerts(state: State): { label: string; due: string; days: number; kind: string }[] {
  const out: { label: string; due: string; days: number; kind: string }[] = [];
  vaccinePlan(state.profile, state.health)
    .filter((p) => p.due && (p.status === 'retard' || p.status === 'bientot'))
    .forEach((p) => out.push({ label: p.vaccine.label, due: p.due as string, days: p.days ?? 0, kind: 'vaccin' }));
  const worm = nextDeworming(state.profile, state.health);
  if (worm.due && daysUntil(worm.due) <= 14) {
    out.push({ label: 'Vermifuge', due: worm.due, days: daysUntil(worm.due), kind: 'vermifuge' });
  }
  state.health.entries
    .filter((e) => e.nextDate)
    .forEach((e) => {
      const days = daysUntil(e.nextDate as string);
      if (days <= 14) out.push({ label: e.label, due: e.nextDate as string, days, kind: e.kind });
    });
  return out.sort((a, b) => a.days - b.days);
}

/* ---------- nutrition ---------- */

export function mealsForAge(weeks: number | null): { meals: number; label: string } {
  const w = weeks ?? 8;
  const row = health.nutrition.meals.find((m) => w < m.untilWeeks) ?? health.nutrition.meals[health.nutrition.meals.length - 1];
  return { meals: row.meals, label: row.label };
}

/**
 * Besoin énergétique : RER = 70 × kg^0,75, puis facteur d'entretien
 * (× 3 avant 4 mois, × 2 jusqu'à la fin de la croissance, × 1,6 adulte — 1,4 si stérilisé).
 */
export function energyNeeds(grams: number | null, weeks: number | null, sterilized: boolean) {
  if (!grams || grams <= 0) return null;
  const kg = grams / 1000;
  const rer = 70 * Math.pow(kg, 0.75);
  const w = weeks ?? 8;
  const factor = w < 17 ? 3 : w < 52 ? 2 : sterilized ? 1.4 : 1.6;
  const phase = w < 17 ? 'croissance rapide (× 3 RER)' : w < 52 ? 'croissance (× 2 RER)' : sterilized ? 'adulte stérilisé (× 1,4 RER)' : 'adulte (× 1,6 RER)';
  return { rer: Math.round(rer), kcal: Math.round(rer * factor), factor, phase };
}

export function ration(kcal: number, kcalPer100g: number | null) {
  if (!kcalPer100g || kcalPer100g <= 0) return null;
  return Math.round((kcal / kcalPer100g) * 100);
}

/** Ration en g/jour + par repas + part réservée aux friandises d'éducation (10 %). */
export function rationPlan(
  weights: WeightEntry[],
  weeks: number | null,
  healthState: Health,
) {
  const grams = weights.length ? weights[weights.length - 1].grams : null;
  const needs = energyNeeds(grams, weeks, healthState.sterilized);
  if (!needs) return null;
  const { meals, label } = mealsForAge(weeks);
  const perDay = ration(needs.kcal, healthState.foodKcal);
  return {
    weightG: grams as number,
    kcal: needs.kcal,
    phase: needs.phase,
    meals,
    mealsLabel: label,
    perDay,
    perMeal: perDay ? Math.round(perDay / meals) : null,
    treatsG: perDay ? Math.max(1, Math.round(perDay * 0.1)) : null,
  };
}

export const urgencyTone: Record<Urgency, { label: string; tone: 'red' | 'orange' | 'blue' }> = {
  urgent: { label: 'Véto tout de suite', tone: 'red' },
  rapide: { label: 'Véto sous 24-48 h', tone: 'orange' },
  surveiller: { label: 'À surveiller', tone: 'blue' },
};
