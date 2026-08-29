export const fontSizes = {
  xs: 11,
  sm: 13,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 30,
  "5xl": 36,
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const lineHeights = {
  tight: 1.2,
  snug: 1.3,
  normal: 1.5,
  relaxed: 1.6,
} as const;

export const typography = { fontSizes, fontWeights, lineHeights } as const;