import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useStore, type State } from './store';

const CFG_KEY = 'mon-yorkshire-sync-v1';
const DEBOUNCE_MS = 4000;

export type SyncConfig = {
  enabled: boolean;
  /** Token GitHub fine-grained avec la permission « Contents: read and write » sur le dépôt. */
  token: string;
  /** Dépôt privé dédié, au format « owner/nom ». */
  repo: string;
  /** Chemin du fichier de sauvegarde dans le dépôt. */
  path: string;
  branch: string;
};

export const defaultSyncConfig: SyncConfig = {
  enabled: false,
  token: '',
  repo: '',
  path: 'sauvegardes/mon-yorkshire.json',
  branch: 'main',
};

export type Backup = {
  app: 'mon-yorkshire';
  version: number;
  savedAt: string;
  state: State;
};

export type SyncStatus = {
  phase: 'idle' | 'saving' | 'loading' | 'ok' | 'error';
  message: string;
  lastSavedAt: string | null;
};

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Encode une chaîne UTF-8 en base64 (pas d'atob/btoa garanti sur Hermes). */
function toBase64(input: string): string {
  const bytes = utf8Bytes(input);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += b1 === undefined ? '=' : B64[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    out += b2 === undefined ? '=' : B64[b2 & 63];
  }
  return out;
}

function fromBase64(input: string): string {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const n =
      (B64.indexOf(clean[i]) << 18) |
      (B64.indexOf(clean[i + 1]) << 12) |
      ((clean[i + 2] ? B64.indexOf(clean[i + 2]) : 0) << 6) |
      (clean[i + 3] ? B64.indexOf(clean[i + 3]) : 0);
    bytes.push((n >> 16) & 255);
    if (clean[i + 2]) bytes.push((n >> 8) & 255);
    if (clean[i + 3]) bytes.push(n & 255);
  }
  return utf8String(bytes);
}

function utf8Bytes(str: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.codePointAt(i) as number;
    if (c > 0xffff) i++;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

function utf8String(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i++];
    let c: number;
    if (b < 0x80) c = b;
    else if (b < 0xe0) c = ((b & 31) << 6) | (bytes[i++] & 63);
    else if (b < 0xf0) c = ((b & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    else c = ((b & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
    out += String.fromCodePoint(c);
  }
  return out;
}

export function configError(cfg: SyncConfig): string | null {
  if (!cfg.token.trim()) return 'Token GitHub manquant.';
  if (!/^[\w.-]+\/[\w.-]+$/.test(cfg.repo.trim())) return 'Dépôt attendu au format « pseudo/nom-du-depot ».';
  if (!cfg.path.trim() || cfg.path.startsWith('/')) return 'Chemin de fichier invalide.';
  return null;
}

const apiUrl = (cfg: SyncConfig) =>
  `https://api.github.com/repos/${cfg.repo.trim()}/contents/${cfg.path
    .trim()
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;

const headers = (cfg: SyncConfig) => ({
  Authorization: `Bearer ${cfg.token.trim()}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
});

async function readError(res: Response): Promise<string> {
  if (res.status === 401) return 'Token refusé (401) : vérifie le token et sa validité.';
  if (res.status === 403) return "Accès refusé (403) : le token n'a pas la permission « Contents: write ».";
  if (res.status === 404) return 'Dépôt, branche ou fichier introuvable (404).';
  const body = await res.text().catch(() => '');
  const detail = body.slice(0, 160);
  return `GitHub a répondu ${res.status}${detail ? ` : ${detail}` : ''}`;
}

/** Lit la sauvegarde distante. `sha` est nécessaire pour l'écriture suivante. */
export async function fetchBackup(cfg: SyncConfig): Promise<{ backup: Backup | null; sha: string | null }> {
  const res = await fetch(`${apiUrl(cfg)}?ref=${encodeURIComponent(cfg.branch.trim() || 'main')}`, {
    headers: headers(cfg),
  });
  if (res.status === 404) return { backup: null, sha: null };
  if (!res.ok) throw new Error(await readError(res));
  const json = (await res.json()) as { content?: string; sha?: string };
  if (!json.content || !json.sha) throw new Error('Réponse GitHub inattendue (fichier sans contenu).');
  const parsed = JSON.parse(fromBase64(json.content)) as Backup;
  return { backup: parsed, sha: json.sha };
}

async function putBackup(cfg: SyncConfig, backup: Backup, sha: string | null): Promise<string> {
  const res = await fetch(apiUrl(cfg), {
    method: 'PUT',
    headers: { ...headers(cfg), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Sauvegarde ${backup.savedAt}`,
      content: toBase64(JSON.stringify(backup, null, 2)),
      branch: cfg.branch.trim() || 'main',
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const json = (await res.json()) as { content?: { sha?: string } };
  return json.content?.sha ?? '';
}

type Ctx = {
  cfg: SyncConfig;
  ready: boolean;
  status: SyncStatus;
  setCfg: (patch: Partial<SyncConfig>) => void;
  saveNow: () => Promise<void>;
  restoreNow: () => Promise<void>;
  peek: () => Promise<Backup | null>;
};

const SyncContext = createContext<Ctx>({
  cfg: defaultSyncConfig,
  ready: false,
  status: { phase: 'idle', message: '', lastSavedAt: null },
  setCfg: () => {},
  saveNow: async () => {},
  restoreNow: async () => {},
  peek: async () => null,
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { state, ready: storeReady, replace } = useStore();
  const [cfg, setCfgState] = useState<SyncConfig>(defaultSyncConfig);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<SyncStatus>({
    phase: 'idle',
    message: '',
    lastSavedAt: null,
  });
  const sha = useRef<string | null>(null);
  const pushed = useRef<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(CFG_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<SyncConfig> & {
            lastSavedAt?: string | null;
          };
          setCfgState({ ...defaultSyncConfig, ...saved });
          if (saved.lastSavedAt)
            setStatus((s) => ({
              ...s,
              lastSavedAt: saved.lastSavedAt ?? null,
            }));
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((next: SyncConfig, lastSavedAt: string | null) => {
    AsyncStorage.setItem(CFG_KEY, JSON.stringify({ ...next, lastSavedAt })).catch(() => {});
  }, []);

  const setCfg = useCallback(
    (patch: Partial<SyncConfig>) => {
      setCfgState((prev) => {
        const next = { ...prev, ...patch };
        if (patch.repo !== undefined || patch.path !== undefined || patch.branch !== undefined) sha.current = null;
        persist(next, status.lastSavedAt);
        return next;
      });
    },
    [persist, status.lastSavedAt],
  );

  /** Écrit l'état courant sur GitHub. `silent` = déclenché par la sauvegarde automatique. */
  const push = useCallback(
    async (snapshot: State, silent: boolean) => {
      const err = configError(cfg);
      if (err) {
        setStatus((s) => ({ ...s, phase: 'error', message: err }));
        return;
      }
      if (busy.current) return;
      busy.current = true;
      const payload = JSON.stringify(snapshot);
      setStatus((s) => ({
        ...s,
        phase: 'saving',
        message: silent ? 'Sauvegarde automatique…' : 'Sauvegarde…',
      }));
      try {
        if (sha.current === null) sha.current = (await fetchBackup(cfg)).sha;
        const savedAt = new Date().toISOString();
        sha.current = await putBackup(cfg, { app: 'mon-yorkshire', version: 1, savedAt, state: snapshot }, sha.current);
        pushed.current = payload;
        setStatus({
          phase: 'ok',
          message: 'Sauvegardé sur GitHub.',
          lastSavedAt: savedAt,
        });
        persist(cfg, savedAt);
      } catch (e) {
        sha.current = null;
        setStatus((s) => ({
          ...s,
          phase: 'error',
          message: e instanceof Error ? e.message : 'Échec de la sauvegarde.',
        }));
      } finally {
        busy.current = false;
      }
    },
    [cfg, persist],
  );

  // Sauvegarde automatique : après chaque modification, une fois le calme revenu.
  useEffect(() => {
    if (!ready || !storeReady || !cfg.enabled || configError(cfg)) return;
    const payload = JSON.stringify(state);
    if (pushed.current === payload) return;
    const t = setTimeout(() => void push(state, true), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [state, ready, storeReady, cfg, push]);

  const saveNow = useCallback(() => push(state, false), [push, state]);

  const peek = useCallback(async () => {
    const err = configError(cfg);
    if (err) throw new Error(err);
    const { backup, sha: remoteSha } = await fetchBackup(cfg);
    sha.current = remoteSha;
    return backup;
  }, [cfg]);

  const restoreNow = useCallback(async () => {
    setStatus((s) => ({ ...s, phase: 'loading', message: 'Restauration…' }));
    try {
      const backup = await peek();
      if (!backup?.state) throw new Error('Aucune sauvegarde trouvée dans ce dépôt.');
      replace(backup.state);
      pushed.current = JSON.stringify(backup.state);
      setStatus((s) => ({
        ...s,
        phase: 'ok',
        message: `Restauré depuis la sauvegarde du ${backup.savedAt.slice(0, 16).replace('T', ' à ')}.`,
      }));
    } catch (e) {
      setStatus((s) => ({
        ...s,
        phase: 'error',
        message: e instanceof Error ? e.message : 'Échec de la restauration.',
      }));
    }
  }, [peek, replace]);

  const value = useMemo<Ctx>(
    () => ({ cfg, ready, status, setCfg, saveNow, restoreNow, peek }),
    [cfg, ready, status, setCfg, saveNow, restoreNow, peek],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export const useSync = () => useContext(SyncContext);
