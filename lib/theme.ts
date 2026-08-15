export const colors = {
  bg: '#f6f4fb',
  bgAlt: '#efeaf9',
  card: '#ffffff',
  ink: '#1b1725',
  ink2: '#524c61',
  ink3: '#8b8599',
  line: '#ece7f6',
  accent: '#6d3fd6',
  accentDeep: '#4a1fa8',
  accentSoft: '#f0eaff',
  coral: '#ff6b57',
  coralSoft: '#ffeeeb',
  amber: '#f5a524',
  amberSoft: '#fff5e3',
  green: '#0f9d6d',
  greenSoft: '#e4f8f0',
  orange: '#c26a08',
  orangeSoft: '#fdf1e0',
  red: '#e0393e',
  redSoft: '#fdecec',
  blue: '#2a6df4',
  blueSoft: '#e9f1ff',
  mint: '#14c39a',
  white: '#ffffff',
};

export const gradients = {
  hero: ['#7b46e8', '#5a2bc4', '#3f1a95'] as const,
  accent: ['#7b46e8', '#5a2bc4'] as const,
  coral: ['#ff8a6b', '#ff5f57'] as const,
  amber: ['#ffc457', '#f59218'] as const,
  green: ['#2fd39a', '#0f9d6d'] as const,
  blue: ['#5b9bff', '#2a6df4'] as const,
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
    shadowColor: '#2a1258',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  soft: {
    shadowColor: '#2a1258',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  lift: {
    shadowColor: '#3d1a8c',
    shadowOpacity: 0.22,
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
