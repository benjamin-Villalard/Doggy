import { health } from './health';
import type { Health, MealEntry, PottyEntry, StoolColor, WaterEntry } from './store';

/* ---------- besoins du jour ---------- */

/**
 * Énergie : RER = 70 × kg^0,75, facteur selon la part du poids adulte atteinte
 * (Small Animal Clinical Nutrition / AAHA) : × 3 avant 50 %, × 2,5 jusqu'à 80 %, × 2 jusqu'à l'âge adulte,
 * puis × 1,6 (× 1,4 stérilisé).
 */
export function energyFactor(grams: number, adultG: number, weeks: number | null, sterilized: boolean) {
  const p = grams / adultG;
  const adult = (weeks ?? 0) >= 52 || p >= 0.98;
  if (adult) return { factor: sterilized ? 1.4 : 1.6, label: sterilized ? 'adulte stérilisé (× 1,4)' : 'adulte (× 1,6)' };
  if (p < 0.5) return { factor: 3, label: `croissance rapide, ${Math.round(p * 100)} % du poids adulte (× 3)` };
  if (p < 0.8) return { factor: 2.5, label: `croissance, ${Math.round(p * 100)} % du poids adulte (× 2,5)` };
  return { factor: 2, label: `fin de croissance, ${Math.round(p * 100)} % du poids adulte (× 2)` };
}

export const DEFAULT_KCAL_100G = 390;

export function foodPlan(grams: number | null, adultG: number, weeks: number | null, h: Health, meals: number) {
  if (!grams) return null;
  const kg = grams / 1000;
  const rer = 70 * Math.pow(kg, 0.75);
  const f = energyFactor(grams, adultG, weeks, h.sterilized);
  const kcal = rer * f.factor;
  const density = h.foodKcal && h.foodKcal > 0 ? h.foodKcal : DEFAULT_KCAL_100G;
  const total = (kcal / density) * 100;
  const kibble = total * 0.9;
  return {
    kcal: Math.round(kcal),
    rer: Math.round(rer),
    factorLabel: f.label,
    densityEstimated: !(h.foodKcal && h.foodKcal > 0),
    density,
    totalG: Math.round(total),
    kibbleG: Math.round(kibble),
    perMealG: Math.round(kibble / meals),
    treatsG: Math.max(1, Math.round(total * 0.1)),
    low: Math.round(kibble * 0.9),
    high: Math.round(kibble * 1.1),
    meals,
  };
}

/** Eau : 60-90 ml/kg/j chez le chiot, 50-70 chez l'adulte ; > 100 ml/kg/j = polydipsie. */
export function waterPlan(grams: number | null, weeks: number | null) {
  if (!grams) return null;
  const kg = grams / 1000;
  const puppy = (weeks ?? 0) < 26;
  const [lo, hi] = puppy ? [60, 90] : [50, 70];
  const r5 = (v: number) => Math.round(v / 5) * 5;
  return { low: r5(lo * kg), high: r5(hi * kg), alert: r5(100 * kg), perKg: `${lo}-${hi} ml/kg` };
}

/** Nombre de pipis / cacas attendus par jour selon l'âge. */
export function eliminationRef(weeks: number | null) {
  const w = weeks ?? 10;
  if (w < 12) return { pee: [8, 12], poop: [3, 5], tip: 'au réveil, après chaque repas, chaque jeu et chaque sieste' };
  if (w < 17) return { pee: [6, 10], poop: [3, 5], tip: 'toutes les 2 h environ en journée' };
  if (w < 26) return { pee: [5, 8], poop: [2, 4], tip: 'il tient environ (âge en mois + 1) heures' };
  if (w < 52) return { pee: [4, 6], poop: [2, 3], tip: 'sorties régulières, 4 à 6 par jour' };
  return { pee: [3, 5], poop: [1, 3], tip: 'au moins 3 sorties par jour' };
}

/* ---------- journal du jour ---------- */

export const dayKey = (ts: string) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const localToday = () => dayKey(new Date().toISOString());

export function daySummary(day: string, potty: PottyEntry[], water: WaterEntry[], meals: MealEntry[]) {
  const p = potty.filter((e) => dayKey(e.ts) === day);
  return {
    pee: p.filter((e) => e.kind === 'pipi' || e.kind === 'accident-pipi').length,
    poop: p.filter((e) => e.kind === 'caca' || e.kind === 'accident-caca').length,
    accidents: p.filter((e) => e.kind.startsWith('accident')).length,
    waterMl: water.filter((e) => dayKey(e.ts) === day).reduce((a, e) => a + e.ml, 0),
    foodG: meals.filter((e) => dayKey(e.ts) === day).reduce((a, e) => a + e.grams, 0),
    mealsCount: meals.filter((e) => dayKey(e.ts) === day).length,
    stools: p.filter((e) => e.kind === 'caca' || e.kind === 'accident-caca'),
  };
}

/* ---------- selles ---------- */

export type StoolInfo = { label: string; swatch: string; level: 'green' | 'blue' | 'orange' | 'red'; meaning: string };

export const stoolColors: Record<StoolColor, StoolInfo> = {
  brun: { label: 'Brun chocolat', swatch: '#6b3e1f', level: 'green', meaning: 'Normal.' },
  brunClair: {
    label: 'Brun clair / beige',
    swatch: '#b58652',
    level: 'blue',
    meaning: "Souvent lié à l'aliment (changement, riche en céréales). À surveiller s'il dure.",
  },
  jaune: {
    label: 'Jaune / orangé',
    swatch: '#e0a526',
    level: 'orange',
    meaning: 'Transit trop rapide, parfois atteinte du foie ou de la vésicule. Véto sous 24-48 h si ça se répète.',
  },
  vert: {
    label: 'Vert',
    swatch: '#6e8b2f',
    level: 'blue',
    meaning: "Herbe mangée ou transit accéléré ; parfois giardiose. Véto si ça dure plus de 24 h ou avec diarrhée.",
  },
  noir: {
    label: 'Noir goudron',
    swatch: '#151515',
    level: 'red',
    meaning: 'Sang digéré (saignement de l\'estomac ou de l\'intestin grêle). Vétérinaire en urgence.',
  },
  rouge: {
    label: 'Rouge / filets de sang',
    swatch: '#b3261e',
    level: 'red',
    meaning:
      "Sang frais (colite, parasites, parvovirose chez un chiot pas encore vacciné). Véto le jour même, en urgence s'il est abattu ou vomit.",
  },
  gris: {
    label: 'Gris / gras',
    swatch: '#9a958c',
    level: 'orange',
    meaning: 'Mauvaise digestion des graisses (pancréas, foie). Véto sous 24-48 h.',
  },
  blanc: {
    label: 'Blanc crayeux / grains blancs',
    swatch: '#e9e4d8',
    level: 'orange',
    meaning: 'Crayeux = excès de calcium ou d\'os. Grains de riz = anneaux de ténia : vermifuge adapté + véto.',
  },
};

/** Échelle de consistance Purina (1 à 7) : 2 est l'idéal. */
export const consistencyScale: { score: number; label: string; level: 'green' | 'blue' | 'orange' | 'red' }[] = [
  { score: 1, label: 'Très dures, sèches, en billes', level: 'orange' },
  { score: 2, label: 'Fermes, moulées, se ramassent bien (idéal)', level: 'green' },
  { score: 3, label: 'Humides mais gardent leur forme', level: 'green' },
  { score: 4, label: 'Très humides, perdent leur forme', level: 'blue' },
  { score: 5, label: 'Molles, en tas sans forme', level: 'orange' },
  { score: 6, label: 'Diarrhée en flaque, un peu de texture', level: 'red' },
  { score: 7, label: 'Diarrhée liquide', level: 'red' },
];

export const stoolFlags: { key: string; label: string }[] = [
  { key: 'mucus', label: 'Glaires' },
  { key: 'sang', label: 'Sang' },
  { key: 'vers', label: 'Vers / grains' },
  { key: 'objet', label: 'Objet / fil' },
  { key: 'effort', label: 'Pousse sans résultat' },
];

export type DailyAlert = { level: 'red' | 'orange' | 'blue'; title: string; text: string };

/** Signaux d'alerte sur les 48 dernières heures (selles, eau). */
export function eliminationAlerts(
  potty: PottyEntry[],
  water: WaterEntry[],
  waterRef: { alert: number } | null,
  now = Date.now(),
): DailyAlert[] {
  const out: DailyAlert[] = [];
  const within = (ts: string, h: number) => now - new Date(ts).getTime() <= h * 3600000;
  const stools = potty.filter((p) => (p.kind === 'caca' || p.kind === 'accident-caca') && within(p.ts, 48));
  const s24 = stools.filter((p) => within(p.ts, 24));
  if (stools.some((p) => p.color === 'noir')) {
    out.push({ level: 'red', title: 'Selles noires', text: stoolColors.noir.meaning });
  }
  const blood = stools.filter((p) => p.color === 'rouge' || p.flags?.includes('sang'));
  if (blood.length) {
    out.push({
      level: blood.length > 1 || blood.some((p) => (p.consistency ?? 0) >= 6) ? 'red' : 'orange',
      title: 'Sang dans les selles',
      text: stoolColors.rouge.meaning,
    });
  }
  const diarrhea24 = s24.filter((p) => (p.consistency ?? 0) >= 6);
  if (diarrhea24.length >= 2) {
    out.push({
      level: 'red',
      title: `${diarrhea24.length} diarrhées en 24 h`,
      text: "Chez un chiot toy, la déshydratation et l'hypoglycémie arrivent vite : vétérinaire aujourd'hui. Eau à volonté, surveille gencives et énergie.",
    });
  } else {
    const soft = stools.filter((p) => (p.consistency ?? 0) >= 5);
    if (soft.length >= 2 && Math.abs(new Date(soft[0].ts).getTime() - new Date(soft[soft.length - 1].ts).getTime()) >= 20 * 3600000) {
      out.push({
        level: 'orange',
        title: 'Selles molles depuis plus de 24 h',
        text: "Si ça continue, ou s'il mange moins, appelle le vétérinaire. Pas de jeûne prolongé chez un toy.",
      });
    }
  }
  if (stools.some((p) => p.flags?.includes('vers') || p.color === 'blanc')) {
    out.push({ level: 'orange', title: 'Vers ou grains blancs', text: stoolColors.blanc.meaning });
  }
  if (stools.some((p) => p.flags?.includes('objet') || p.flags?.includes('effort'))) {
    out.push({
      level: 'orange',
      title: 'Objet ou efforts pour faire',
      text: "Ne tire jamais sur un fil qui dépasse. S'il pousse sans résultat, vomit ou a mal au ventre : vétérinaire.",
    });
  }
  const gray = stools.filter((p) => p.color === 'gris' || p.color === 'jaune');
  if (gray.length >= 2) {
    out.push({ level: 'orange', title: 'Selles jaunes ou grises répétées', text: stoolColors.gris.meaning });
  }
  const anyPoop = potty.some((p) => p.kind === 'caca' || p.kind === 'accident-caca');
  if (anyPoop && !s24.length && potty.some((p) => within(p.ts, 72) && p.kind !== 'caca')) {
    out.push({ level: 'blue', title: 'Pas de selles notées depuis 24 h', text: 'Oubli de saisie ? Sinon surveille : un chiot fait plusieurs selles par jour.' });
  }
  if (waterRef) {
    const ml24 = water.filter((w) => within(w.ts, 24)).reduce((a, w) => a + w.ml, 0);
    if (ml24 > waterRef.alert) {
      out.push({
        level: 'orange',
        title: `Boit beaucoup : ${ml24} ml en 24 h`,
        text: `Au-delà de ${waterRef.alert} ml/j (100 ml/kg) on parle de polydipsie : à signaler au vétérinaire, surtout s'il urine beaucoup.`,
      });
    }
  }
  return out;
}

export const mealsAdvice = (weeks: number | null) => {
  const w = weeks ?? 8;
  return health.nutrition.meals.find((m) => w < m.untilWeeks) ?? health.nutrition.meals[health.nutrition.meals.length - 1];
};
