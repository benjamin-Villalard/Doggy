import { useMemo } from 'react';
import flavorRaw from '../content/flavor.json';
import { useStore, type Prefs, type Profile, type State } from './store';

export type Flavor = { game: string; pitch: string; mission: string; win: string };
type FlavorFile = {
  tutorials: Record<string, Flavor>;
  praise: string[];
  nudges: string[];
  levelUp: string[];
};

const flavorFile = flavorRaw as FlavorFile;

export type Voice = {
  /** Nom affiché du chiot (surnom si renseigné). */
  name: string;
  /** Pronom sujet adapté au sexe. */
  il: string;
  /** Remplace les jetons d'un texte et adapte le vocabulaire aux réglages. */
  t: (text: string) => string;
  fun: boolean;
  emoji: (e: string) => string;
  praise: (seed?: number) => string;
  nudge: (seed?: number) => string;
  flavor: (code: string) => Flavor | null;
};

const pick = (list: string[], seed = 0) => list[Math.abs(Math.round(seed)) % list.length];

/** Remplace les jetons {name}, {il}, {treat}, {mat}, {marker}, {recall}, {release}. */
function fill(text: string, profile: Profile, prefs: Prefs): string {
  const name = (profile.nickname || profile.name || 'ton chiot').trim();
  const female = profile.sex === 'female';
  return text
    .replace(/\{name\}/g, name)
    .replace(/\{il\}/g, female ? 'elle' : 'il')
    .replace(/\{Il\}/g, female ? 'Elle' : 'Il')
    .replace(/\{le\}/g, female ? 'la' : 'le')
    .replace(/\{treat\}/g, prefs.treatWord)
    .replace(/\{mat\}/g, prefs.matWord)
    .replace(/\{marker\}/g, prefs.marker)
    .replace(/\{recall\}/g, prefs.recallWord)
    .replace(/\{release\}/g, prefs.releaseWord);
}

/** Adapte un texte du livre : nom du chiot, sexe et mots choisis par l'utilisateur. */
function localize(text: string, profile: Profile, prefs: Prefs): string {
  const name = (profile.nickname || profile.name).trim();
  let out = fill(text, profile, prefs);

  if (name) {
    out = out
      .replace(/\bLe chiot\b/g, name)
      .replace(/\ble chiot\b/g, name)
      .replace(/\bdu chiot\b/g, `de ${name}`)
      .replace(/\bau chiot\b/g, `à ${name}`)
      .replace(/\bton chiot\b/g, name)
      .replace(/\bvotre chiot\b/g, name);
  }
  if (profile.sex === 'female') {
    out = out
      .replace(/\bil\b(?! y a| faut| vaut| s'agit| est temps)/g, 'elle')
      .replace(/\bIl\b(?! y a| faut| vaut| s'agit| est temps)/g, 'Elle')
      .replace(/\bqu'il\b/g, "qu'elle")
      .replace(/\bs'il\b/g, "si elle");
  }
  if (prefs.marker && prefs.marker.toLowerCase() !== 'marqueur') {
    out = out.replace(/\bmarqueur\b/g, `marqueur « ${prefs.marker} »`);
  }
  if (prefs.treatWord && prefs.treatWord !== 'friandise') {
    out = out.replace(/\bfriandises\b/g, `${prefs.treatWord}s`).replace(/\bfriandise\b/g, prefs.treatWord);
  }
  if (prefs.recallWord) {
    out = out.replace(/«\s*ici\s*!?\s*»/gi, `« ${prefs.recallWord} »`);
  }
  if (prefs.matWord && prefs.matWord !== 'panier') {
    out = out.replace(/\bpanier\b/g, prefs.matWord);
  }
  return out;
}

/** Voix du coach : tout le texte affiché passe par ici. */
export function makeVoice(state: State): Voice {
  const { profile, prefs } = state;
  const name = (profile.nickname || profile.name || 'ton chiot').trim();
  const fun = prefs.tone === 'fun';
  return {
    name,
    il: profile.sex === 'female' ? 'elle' : 'il',
    fun,
    t: (text: string) => localize(text, profile, prefs),
    emoji: (e: string) => (prefs.emoji ? e : ''),
    praise: (seed = Date.now() / 86400000) => fill(pick(flavorFile.praise, seed), profile, prefs),
    nudge: (seed = Date.now() / 86400000) => fill(pick(flavorFile.nudges, seed), profile, prefs),
    flavor: (code: string) => {
      if (prefs.tone === 'expert') return null;
      const f = flavorFile.tutorials[code];
      if (!f) return null;
      return {
        game: fill(f.game, profile, prefs),
        pitch: fill(f.pitch, profile, prefs),
        mission: fill(f.mission, profile, prefs),
        win: fill(f.win, profile, prefs),
      };
    },
  };
}

/** Hook pratique : la voix du coach dérivée de l'état courant. */
export function useVoice(): Voice {
  const { state } = useStore();
  return useMemo(() => makeVoice(state), [state]);
}

export const levelUpLine = (state: State) =>
  fill(pick(flavorFile.levelUp, state.sessions.length), state.profile, state.prefs);
