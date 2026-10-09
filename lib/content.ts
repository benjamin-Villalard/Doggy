import icons from '../content/icons.json';
import iconsExtra from '../content/icons-extra.json';
import iconsTricks from '../content/icons-tricks.json';
import tricksRaw from '../content/tricks.json';
import intro from '../content/intro.json';
import phasesRaw from '../content/phases.json';
import tutorialsRaw from '../content/tutorials.json';
import issuesRaw from '../content/issues.json';
import issueTreeRaw from '../content/issueTree.json';
import skillsRaw from '../content/skills.json';
import skillLegendRaw from '../content/skillLegend.json';
import socializationRaw from '../content/socialization.json';
import carnet from '../content/carnet.json';
import extras from '../content/extras.json';

export type Block =
  | { type: 'h'; level: number; text: string; icon?: string | null }
  | { type: 'p'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'step'; n: string; text: string }
  | { type: 'table'; rows: { header: boolean; cells: string[] }[] }
  | { type: 'tutref'; code: string }
  | {
      type: 'box';
      variant: string;
      title?: string | null;
      icon?: string | null;
      text?: string | null;
      blocks: Block[];
    };

export type Section = { title: string; icon?: string | null; blocks: Block[] };

export type Tutorial = {
  code: string;
  title: string;
  icon: string | null;
  meta: string;
  block: string | null;
  steps: { n: string; text: string }[];
  criteria: string | null;
  alea: string | null;
  boxes: { variant: string; title?: string | null; text: string }[];
};

export type Trick = {
  code: string;
  title: string;
  icon: string;
  category: string;
  stars: number;
  minAgeWeeks: number;
  why: string;
  gear: string;
  cue: string;
  steps: string[];
  levels: { name: string; goal: string; criteria: string }[];
  criteria: string;
  fix: { problem: string; solution: string }[];
  toy: string;
};

export const tricks = tricksRaw as Trick[];
export const trickByCode = (code: string) => tricks.find((t) => t.code === code);
export const trickCategories = Array.from(new Set(tricks.map((t) => t.category)));

export type Issue = { code: string; title: string; lines: string[] };
export type Skill = { code: string; name: string; key: boolean; target: string };
export type SocialCategory = { name: string; icon: string | null; items: string[] };

export type IconShape = { viewBox: string; els: { tag: string; attrs: Record<string, string | undefined> }[] };
export const iconLibrary = { ...icons, ...iconsExtra, ...iconsTricks } as unknown as Record<string, IconShape>;
export const tutorials = tutorialsRaw as Tutorial[];
export const issues = issuesRaw as Issue[];
export const issueTree = issueTreeRaw as Block[];
export const skills = skillsRaw as Skill[];
export const skillLegend = skillLegendRaw as string[];
export const socialization = socializationRaw as SocialCategory[];

const allPhases = phasesRaw as Section[];
/** Les vraies phases du programme (le calendrier des périodes sensibles est traité à part). */
export const phases = allPhases.filter((p) => /^Phase/.test(p.title));
export const sensitivePeriods = allPhases.find((p) => !/^Phase/.test(p.title));

export const introSections = intro as Section[];
export const carnetSections = carnet as Section[];
export const extraSections = extras as Section[];

export const librarySections: Section[] = [
  ...introSections,
  ...(sensitivePeriods ? [sensitivePeriods] : []),
  ...carnetSections,
  ...extraSections,
];

export const tutorialByCode = (code: string) => tutorials.find((t) => t.code === code);
export const issueByCode = (code: string) => issues.find((i) => i.code === code);
export const skillByCode = (code: string) => skills.find((s) => s.code === code);

export const tutorialBlocks = Array.from(
  new Set(tutorials.map((t) => t.block).filter((b): b is string => !!b)),
);

/** Bornes d'âge (en semaines) de chaque phase, dans l'ordre du livre. */
export const phaseRanges: { title: string; from: number; to: number }[] = [
  { title: 'Phase 0', from: 0, to: 8 },
  { title: 'Phase 1', from: 8, to: 13 },
  { title: 'Phase 2', from: 13, to: 18 },
  { title: 'Phase 3', from: 18, to: 26 },
  { title: 'Phase 4', from: 26, to: 39 },
  { title: 'Phase 5', from: 39, to: 999 },
];

/** Tutoriels conseillés par phase (ordre pédagogique du livre). */
export const phaseTutorials: Record<string, string[]> = {
  'Phase 0': ['T01', 'T02', 'T06', 'T08'],
  'Phase 1': ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T20', 'T22', 'T26'],
  'Phase 2': ['T04', 'T09', 'T12', 'T13', 'T14', 'T16', 'T17', 'T18', 'T19', 'T24', 'T25'],
  'Phase 3': ['T13', 'T15', 'T16', 'T17', 'T18', 'T19', 'T21', 'T22', 'T23', 'T27'],
  'Phase 4': ['T13', 'T15', 'T16', 'T17', 'T21', 'T23', 'T27', 'T28'],
  'Phase 5': ['T13', 'T15', 'T21', 'T23', 'T27', 'T28'],
};

/** Âge cible (en semaines) pour atteindre 4/5 sur chaque compétence. */
export const skillTargetWeeks: Record<string, number> = {
  T01: 10, T02: 12, T03: 12, T04: 17, T05: 17, T06: 22, T07: 26, T08: 17, T09: 26,
  T10: 26, T11: 17, T12: 21, T13: 45, T14: 21, T15: 39, T16: 39, T17: 30, T18: 26,
  T19: 26, T20: 21, T21: 39, T22: 26, T23: 52, T24: 26, T25: 26, T26: 17, T27: 39, T28: 52,
};
