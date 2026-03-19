/**
 * Tokens de design (Inself) – espaçamentos, raios e tipografia.
 * Use em StyleSheet ou como referência para classes Tailwind.
 */

/** Raio de borda padrão (1rem = 16px no mobile) */
export const RADIUS = {
  sm: 12,  // calc(1rem - 4px)
  md: 14,  // calc(1rem - 2px)
  lg: 16,  // 1rem
} as const;

/** Espaçamentos comuns (em px) – alinhados ao Inself */
export const SPACING = {
  /** 0.5rem = 8px */
  xs: 8,
  /** 0.75rem = 12px */
  sm: 12,
  /** 1rem = 16px */
  md: 16,
  /** 1.25rem = 20px */
  lg: 20,
  /** 1.5rem = 24px */
  xl: 24,
  /** 2rem = 32px */
  "2xl": 32,
  /** 2.5rem = 40px */
  "2.5xl": 40,
  /** 3rem = 48px */
  "3xl": 48,
  /** 4rem = 64px */
  "4xl": 64,
  /** Container horizontal (2rem) */
  container: 32,
} as const;

/** Tamanhos de fonte (em px) – Inself / Tailwind */
export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
} as const;

/** Line height (múltiplos ou px) */
export const LINE_HEIGHT = {
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
} as const;

/** Letter spacing (tracking) em px */
export const TRACKING = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  /** 0.2em para labels uppercase (ex: "Check-in Emocional") */
  label: 3.2,
} as const;
