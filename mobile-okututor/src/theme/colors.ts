export interface Palette {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryLighter: string;
  primaryForeground: string;

  secondary: string;
  secondaryLight: string;

  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;

  bg: string;
  bgLight: string;
  bgSecondary: string;
  background: string;

  surface: string;
  surfaceHover: string;
  surfaceActive: string;

  border: string;
  borderLight: string;
  borderStrong: string;

  success: string;
  warning: string;
  danger: string;
  info: string;

  overlay: string;
  disabled: string;

  card: string;
  input: string;
  tabActive: string;
}

export const lightColors: Palette = {
  primary: "#3563E9",
  primaryHover: "#1A3BC7",
  primaryLight: "#EDF2FF",
  primaryLighter: "#F5F8FF",
  primaryForeground: "#FFFFFF",

  secondary: "#667085",
  secondaryLight: "#F5F7FA",

  text: "#101727",
  textSecondary: "#475367",
  textTertiary: "#667085",
  textMuted: "#98A6BE",

  bg: "#FFFFFF",
  bgLight: "#F7F9FC",
  bgSecondary: "#F2F4F7",
  background: "#F7F9FC",

  surface: "#FFFFFF",
  surfaceHover: "#F8FAFB",
  surfaceActive: "#F2F4F7",

  border: "#E5E9F0",
  borderLight: "#F0F2F5",
  borderStrong: "#D0D4D8",

  success: "#12B76A",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3563E9",

  overlay: "rgba(16, 23, 39, 0.5)",
  disabled: "#D0D4D8",

  card: "#FFFFFF",
  input: "#FFFFFF",
  tabActive: "#3563E9",
};

export const darkColors: Palette = {
  primary: "#7CA2FF",
  primaryHover: "#5B8AFF",
  primaryLight: "#1A2942",
  primaryLighter: "#162034",
  primaryForeground: "#0F172A",

  secondary: "#A9B4C7",
  secondaryLight: "#1A2942",

  text: "#F9FAFB",
  textSecondary: "#A9B4C7",
  textTertiary: "#98A6BE",
  textMuted: "#667085",

  bg: "#0F172A",
  bgLight: "#162034",
  bgSecondary: "#1A2942",
  background: "#0F172A",

  surface: "#172033",
  surfaceHover: "#1A2942",
  surfaceActive: "#233956",

  border: "#233956",
  borderLight: "#1A2942",
  borderStrong: "#293D5E",

  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
  info: "#7CA2FF",

  overlay: "rgba(0, 0, 0, 0.6)",
  disabled: "#233956",

  card: "#172033",
  input: "#0F172A",
  tabActive: "#7CA2FF",
};