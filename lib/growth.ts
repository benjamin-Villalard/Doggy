import type { Profile, Sex, WeightEntry } from './store';

/**
 * Modèle de croissance du chiot toy (Yorkshire / Biewer) : courbe de Gompertz
 *   W(t) = A · exp( ln(W0 / A) · e^(−k·t) )
 * A = poids adulte attendu, W0 = poids de naissance, t en jours.
 * k est calé pour qu'un chien toy atteigne ~45 % de son poids adulte à 12 semaines,
 * ~85 % à 6 mois et ~99 % à 12 mois (fin de croissance des petites races vers 9-10 mois).
 */
export const GROWTH_K = 0.0161;
/** Un chiot toy naît à environ 4,5 % de son poids adulte (100-140 g pour 2,2-3 kg). */
export const BIRTH_RATIO = 0.045;
const DAY = 86400000;

export type AdultSource = 'parents' | 'mere' | 'pere' | 'naissance' | 'cible';

export type GrowthBasis = {
  adultG: number;
  birthG: number;
  birthEstimated: boolean;
  source: AdultSource;
  detail: string;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const sexFactor = (sex: Sex) => (sex === 'male' ? 1.04 : sex === 'female' ? 0.96 : 1);

/** Poids adulte attendu, sur le principe de la « taille cible parentale » en pédiatrie. */
export function growthBasis(profile: Profile): GrowthBasis {
  const m = profile.motherWeightG && profile.motherWeightG > 0 ? profile.motherWeightG : null;
  const f = profile.fatherWeightG && profile.fatherWeightG > 0 ? profile.fatherWeightG : null;
  const birth = profile.birthWeightG && profile.birthWeightG > 0 ? profile.birthWeightG : null;
  const sf = sexFactor(profile.sex);
  let adultG: number;
  let source: AdultSource;
  let detail: string;
  if (m && f) {
    adultG = ((m + f) / 2) * sf;
    source = 'parents';
    detail = `moyenne des parents (${m} g et ${f} g)${sf !== 1 ? `, ${sf > 1 ? '+' : '−'}4 % pour le sexe` : ''}`;
  } else if (m || f) {
    const one = (m ?? f) as number;
    const adj = m ? (profile.sex === 'male' ? 1.08 : 1) : profile.sex === 'female' ? 0.92 : 1;
    adultG = one * adj;
    source = m ? 'mere' : 'pere';
    detail = `poids ${m ? 'de la mère' : 'du père'} (${one} g)${adj !== 1 ? ', ajusté au sexe' : ''}`;
  } else if (birth) {
    adultG = birth / BIRTH_RATIO;
    source = 'naissance';
    detail = `poids de naissance × 22 (parents non renseignés)`;
  } else {
    adultG = profile.adultWeightG ?? 2500;
    source = 'cible';
    detail = 'poids adulte visé des réglages (renseigne parents et naissance)';
  }
  adultG = Math.round(clamp(adultG, 1000, 5000));
  const birthG = birth ?? Math.round(adultG * BIRTH_RATIO);
  return { adultG, birthG, birthEstimated: !birth, source, detail };
}

export function ageDaysAt(birthdate: string, date: string): number {
  return Math.max(0, Math.round((new Date(date).getTime() - new Date(birthdate).getTime()) / DAY));
}

export function gompertz(t: number, adultG: number, birthG: number): number {
  return adultG * Math.exp(Math.log(birthG / adultG) * Math.exp(-GROWTH_K * t));
}

/** Dispersion (en log) : faible à la naissance (poids mesuré), elle s'élargit avec l'âge comme en pédiatrie. */
export function spread(t: number): number {
  return 0.045 + 0.075 * (1 - Math.exp(-GROWTH_K * t));
}

export const CENTILES = [
  { key: 'P3', z: -1.88 },
  { key: 'P15', z: -1.04 },
  { key: 'P50', z: 0 },
  { key: 'P85', z: 1.04 },
  { key: 'P97', z: 1.88 },
] as const;

export function centileAt(t: number, basis: GrowthBasis, z: number): number {
  return gompertz(t, basis.adultG, basis.birthG) * Math.exp(z * spread(t));
}

export function zScore(t: number, grams: number, basis: GrowthBasis): number {
  return Math.log(grams / gompertz(t, basis.adultG, basis.birthG)) / spread(t);
}

/** Fonction de répartition de la loi normale (Abramowitz-Stegun). */
export function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function centileLabel(z: number): string {
  const pct = Math.round(normCdf(z) * 100);
  if (pct < 3) return '< P3';
  if (pct > 97) return '> P97';
  return `P${pct}`;
}

/** Gain attendu (g/jour) à l'âge t : dW/dt = k · W · ln(A / W). */
export function expectedGainPerDay(t: number, basis: GrowthBasis): number {
  const w = gompertz(t, basis.adultG, basis.birthG);
  return GROWTH_K * w * Math.log(basis.adultG / w);
}

export type GrowthPoint = WeightEntry & { t: number; z: number; expected: number };

export function growthPoints(birthdate: string | null, weights: WeightEntry[], basis: GrowthBasis): GrowthPoint[] {
  if (!birthdate) return [];
  return [...weights]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((w) => {
      const t = ageDaysAt(birthdate, w.date);
      return { ...w, t, z: zScore(t, w.grams, basis), expected: Math.round(gompertz(t, basis.adultG, basis.birthG)) };
    });
}

/**
 * Poids adulte projeté à partir des vraies pesées (moindres carrés sur ln A, W0 fixé) :
 * ln W = ln A · (1 − e) + ln W0 · e, avec e = e^(−k·t).
 */
export function projectedAdult(points: GrowthPoint[], basis: GrowthBasis): number | null {
  const usable = points.filter((p) => p.t >= 14);
  if (!usable.length) return null;
  let num = 0;
  let den = 0;
  for (const p of usable.slice(-6)) {
    const e = Math.exp(-GROWTH_K * p.t);
    num += (1 - e) * (Math.log(p.grams) - e * Math.log(basis.birthG));
    den += (1 - e) * (1 - e);
  }
  if (den <= 0) return null;
  return Math.round(clamp(Math.exp(num / den), 600, 7000));
}

export type GrowthAlert = { level: 'red' | 'orange' | 'blue' | 'green'; title: string; text: string };

/** Lecture de la courbe façon carnet pédiatrique : perte, stagnation, cassure de couloir, hors couloirs. */
export function growthAlerts(points: GrowthPoint[], basis: GrowthBasis, ageDays: number | null): GrowthAlert[] {
  const out: GrowthAlert[] = [];
  if (!points.length) {
    out.push({ level: 'blue', title: 'Aucune pesée', text: 'Pèse-le sur une balance de cuisine au gramme pour démarrer sa courbe.' });
    return out;
  }
  const last = points[points.length - 1];
  const prev = points.length > 1 ? points[points.length - 2] : null;
  if (prev && last.t > prev.t) {
    const days = last.t - prev.t;
    const gain = last.grams - prev.grams;
    const expGain = last.expected - prev.expected;
    if (gain < 0 && -gain >= Math.max(10, prev.grams * 0.02)) {
      out.push({
        level: 'red',
        title: `Perte de poids : ${gain} g en ${days} j`,
        text: "Un chiot toy ne doit jamais maigrir. Vérifie qu'il mange, boit et que ses selles sont normales, et appelle le vétérinaire (risque d'hypoglycémie).",
      });
    } else if (ageDays !== null && ageDays < 270 && days >= 4 && expGain > 10 && gain < expGain * 0.3) {
      out.push({
        level: 'orange',
        title: 'Croissance qui stagne',
        text: `+${gain} g en ${days} j alors qu'on attend environ +${Math.round(expGain)} g. Repèse dans 3-4 jours ; si ça se confirme, parle-en au vétérinaire (parasites, ration, dents).`,
      });
    }
  }
  const recent = points.filter((p) => p.t >= last.t - 42 && p.t >= 14);
  if (recent.length >= 2) {
    const dz = last.z - recent[0].z;
    if (dz <= -1) {
      out.push({
        level: 'orange',
        title: 'Cassure de courbe vers le bas',
        text: `Il a perdu environ un couloir en ${last.t - recent[0].t} jours (${centileLabel(recent[0].z)} → ${centileLabel(last.z)}). C'est le signal qu'on surveille en pédiatrie : à montrer au vétérinaire.`,
      });
    } else if (dz >= 1.2) {
      out.push({
        level: 'blue',
        title: 'Accélération au-dessus de sa courbe',
        text: 'Il gagne un couloir vers le haut. Vérifie la ration et la part de friandises : un toy en surpoids abîme ses rotules.',
      });
    }
  }
  if (last.z < -1.88) {
    out.push({ level: 'orange', title: 'Sous le couloir P3', text: "Plus léger qu'attendu pour ses parents et son poids de naissance. Contrôle vétérinaire conseillé si ça persiste sur 2 pesées." });
  } else if (last.z > 1.88) {
    out.push({ level: 'blue', title: 'Au-dessus du couloir P97', text: 'Plus lourd que prévu : regarde sa silhouette (taille visible, côtes palpables) avant de parler de surpoids.' });
  }
  if (ageDays !== null) {
    const interval = weighingInterval(ageDays);
    const since = ageDays - last.t;
    if (since > interval.days) {
      out.push({ level: 'blue', title: `Dernière pesée il y a ${since} jours`, text: `À son âge : ${interval.label}.` });
    }
  }
  if (!out.length) {
    out.push({ level: 'green', title: 'Croissance harmonieuse', text: `Il suit son couloir (${centileLabel(last.z)}). Continue les pesées régulières.` });
  }
  return out;
}

export function weighingInterval(ageDays: number): { days: number; label: string } {
  if (ageDays < 90) return { days: 7, label: 'une pesée par semaine (idéalement 2)' };
  if (ageDays < 183) return { days: 8, label: 'une pesée par semaine' };
  if (ageDays < 365) return { days: 16, label: 'une pesée toutes les 2 semaines' };
  return { days: 35, label: 'une pesée par mois' };
}

export const fmtG = (g: number) =>
  g >= 1000 ? `${(g / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} kg` : `${Math.round(g)} g`;
