export const colors = {
  bg: '#f7f5ff',
  bgAlt: '#eee9ff',
  card: '#ffffff',
  ink: '#150f2e',
  ink2: '#4a4468',
  ink3: '#8e88a8',
  line: '#e9e3ff',
  accent: '#7c3aed',
  accentDeep: '#4c1d95',
  accentSoft: '#f1e9ff',
  coral: '#ff5d73',
  coralSoft: '#ffe9ee',
  amber: '#ffab00',
  amberSoft: '#fff4dc',
  green: '#00b389',
  greenSoft: '#dcfbf1',
  orange: '#f97316',
  orangeSoft: '#fff0e2',
  red: '#e11d48',
  redSoft: '#ffe6ec',
  blue: '#2563eb',
  blueSoft: '#e6efff',
  sky: '#0ea5e9',
  skySoft: '#e2f5ff',
  pink: '#ec4899',
  pinkSoft: '#ffe8f5',
  lime: '#84cc16',
  limeSoft: '#f2fce0',
  mint: '#14c39a',
  white: '#ffffff',
};

export const gradients = {
  hero: ['#8b5cf6', '#6d28d9', '#4c1d95'] as const,
  accent: ['#a855f7', '#6d28d9'] as const,
  coral: ['#ff8f6b', '#ff4d6d'] as const,
  amber: ['#ffd166', '#ff9f1c'] as const,
  green: ['#34e0b0', '#00b389'] as const,
  blue: ['#60a5fa', '#2563eb'] as const,
  sky: ['#67e8f9', '#0ea5e9'] as const,
  pink: ['#f9a8d4', '#ec4899'] as const,
  sunset: ['#fbbf24', '#f472b6', '#8b5cf6'] as const,
  candy: ['#a78bfa', '#f0abfc', '#fda4af'] as const,
};

/** `LinearGradient.colors` attend un tuple d'au moins deux couleurs. */
export type GradientColors = readonly [string, string, ...string[]];
export const grad = (g: readonly string[]): GradientColors => g as unknown as GradientColors;

export const boxStyles: Record<string, { bg: string; border: string; fg: string; label: string }> = {
  tip: { bg: colors.greenSoft, border: colors.green, fg: colors.green, label: 'Astuce' },
  warn: { bg: colors.amberSoft, border: colors.amber, fg: colors.orange, label: 'Vigilance' },
  stop: { bg: colors.redSoft, border: colors.red, fg: colors.red, label: 'À ne jamais faire' },
  york: { bg: colors.accentSoft, border: colors.accent, fg: colors.accent, label: 'Spécial Yorkshire' },
  neutral: { bg: '#f6f4fb', border: colors.line, fg: colors.ink2, label: '' },
};

export const radius = 22;
export const radiusSm = 14;
export const space = (n: number) => n * 4;

export const shadow = {
  card: {
    shadowColor: '#3a1a8a',
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  soft: {
    shadowColor: '#3a1a8a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  lift: {
    shadowColor: '#4c1d95',
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
};

export const type = {
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.6 },
  h2: { fontSize: 19, fontWeight: '800' as const, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 14.5, fontWeight: '500' as const },
  small: { fontSize: 12.5, fontWeight: '600' as const },
  micro: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.3 },
};
