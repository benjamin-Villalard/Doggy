import clinicalRaw from '../content/clinical.json';

export type Vital = { label: string; range: string; note: string; icon: string };
export type TriageStep = { step: string; title: string; checks: string[]; red: string };
export type Protocol = {
  code: string;
  title: string;
  icon: string;
  urgency: 'vitale' | 'élevée' | 'modérée';
  indication: string;
  steps: string[];
  pitfalls: string[];
  ref: string;
};
export type Drug = {
  name: string;
  indication: string;
  /** [min, max] dans l'unité indiquée. */
  dose: [number, number];
  unit: string;
  route: string;
  /** Concentration en mg/ml quand un volume est calculable. */
  conc: number | null;
  concLabel: string;
  note: string;
  contra: string;
};
export type Toxin = {
  name: string;
  agent: string;
  thresholds: { dose: number; effect: string }[];
  unit: string;
  content: { label: string; mgPerG: number }[];
  action: string;
  note: string;
};
export type PainScale = {
  name: string;
  note: string;
  threshold: number;
  items: { category: string; options: { label: string; score: number }[] }[];
};
export type BreedCondition = {
  name: string;
  icon: string;
  signs: string;
  workup: string;
  care: string;
  risk: string;
};

export type Clinical = {
  disclaimer: string;
  vitals: Vital[];
  triage: TriageStep[];
  protocols: Protocol[];
  drugs: Drug[];
  toxins: Toxin[];
  pain: PainScale;
  dehydration: { label: string; signs: string; action: string }[];
  breed: BreedCondition[];
  refs: string[];
};

export const clinical = clinicalRaw as unknown as Clinical;

export const protocolByCode = (code: string) => clinical.protocols.find((p) => p.code === code);

/** Arrondi « utilisable » : on garde 2 chiffres significatifs sous 1, sinon 1 décimale. */
export function round(v: number): number {
  if (!isFinite(v)) return 0;
  if (v === 0) return 0;
  if (Math.abs(v) < 0.1) return Math.round(v * 1000) / 1000;
  if (Math.abs(v) < 1) return Math.round(v * 100) / 100;
  if (Math.abs(v) < 10) return Math.round(v * 10) / 10;
  return Math.round(v);
}

export type DoseResult = {
  /** Quantité totale dans l'unité de la posologie (mg, g ou ml selon le médicament). */
  min: number;
  max: number;
  /** Volume en ml quand la concentration est connue et l'unité en mg/kg. */
  mlMin: number | null;
  mlMax: number | null;
};

/** Calcule la dose totale pour un poids donné, et le volume si la concentration le permet. */
export function doseFor(drug: Drug, weightKg: number): DoseResult | null {
  if (!weightKg || weightKg <= 0) return null;
  const min = drug.dose[0] * weightKg;
  const max = drug.dose[1] * weightKg;
  const isMg = drug.unit.startsWith('mg/kg');
  const ml = isMg && drug.conc ? { mlMin: min / drug.conc, mlMax: max / drug.conc } : { mlMin: null, mlMax: null };
  return { min: round(min), max: round(max), mlMin: ml.mlMin === null ? null : round(ml.mlMin), mlMax: ml.mlMax === null ? null : round(ml.mlMax) };
}

/** Dose ingérée en mg/kg à partir d'une quantité de produit et d'une teneur en mg/g. */
export function ingestedDose(grams: number, mgPerG: number, weightKg: number): number | null {
  if (!grams || !weightKg || weightKg <= 0) return null;
  return round((grams * mgPerG) / weightKg);
}

/** Palier de gravité atteint pour un toxique et une dose en mg/kg. */
export function toxinBand(toxin: Toxin, mgPerKg: number): { level: number; effect: string } {
  let level = 0;
  let effect = 'Sous les seuils publiés — cela ne signifie pas « sans risque » : appeler quand même.';
  toxin.thresholds
    .slice()
    .sort((a, b) => a.dose - b.dose)
    .forEach((t, i) => {
      if (mgPerKg >= t.dose) {
        level = i + 1;
        effect = t.effect;
      }
    });
  return { level, effect };
}

export function painTotal(answers: Record<string, number>): number {
  return Object.values(answers).reduce((a, b) => a + b, 0);
}

export function painAdvice(total: number): { tone: 'green' | 'orange' | 'red'; text: string } {
  if (total >= 12)
    return {
      tone: 'red',
      text: 'Douleur sévère probable : analgésie multimodale et réévaluation rapprochée, avis vétérinaire immédiat.',
    };
  if (total >= clinical.pain.threshold)
    return {
      tone: 'orange',
      text: `Seuil d'intervention analgésique atteint (${clinical.pain.threshold}/24) : traitement antalgique à discuter avec le vétérinaire.`,
    };
  return { tone: 'green', text: 'Sous le seuil d\'intervention. Réévaluer après tout soin, transport ou changement d\'état.' };
}

/** Fréquences cardiaque et respiratoire de référence selon l'âge, pour un chien de petit format. */
export function vitalsForAge(weeks: number | null): { hr: string; rr: string; temp: string } {
  if (weeks !== null && weeks < 12) return { hr: '120–180 /min', rr: '20–40 /min', temp: '38,3–39,2 °C' };
  if (weeks !== null && weeks < 26) return { hr: '110–170 /min', rr: '18–36 /min', temp: '38,3–39,2 °C' };
  return { hr: '100–160 /min', rr: '18–34 /min', temp: '38,3–39,2 °C' };
}

/** Déficit hydrique en ml pour un pourcentage de déshydratation estimé. */
export function fluidDeficitMl(weightKg: number, pct: number): number {
  return Math.round(weightKg * pct * 10);
}

/** Débit d'entretien (formule allométrique, ml/h). */
export function maintenanceMlH(weightKg: number): number {
  if (weightKg <= 0) return 0;
  return Math.round((70 * Math.pow(weightKg, 0.75)) / 24 * 10) / 10;
}
