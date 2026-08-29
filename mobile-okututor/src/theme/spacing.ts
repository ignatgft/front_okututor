export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const;

export type SpacingKey = keyof typeof spacing;

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  "2xl": 24,
  "3xl": 28,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof radius;