import { lightColors, darkColors, Palette } from "./colors";
import { spacing , radius } from "./spacing";
import { typography } from "./typography";
import { shadows, sizes } from "./shadows";

export interface Theme {
  mode: "light" | "dark";
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: typeof shadows;
  sizes: typeof sizes;
}

export function buildTheme(mode: "light" | "dark"): Theme {
  return {
    mode,
    colors: mode === "dark" ? darkColors : lightColors,
    spacing,
    radius,
    typography,
    shadows,
    sizes,
  };
}

export const lightTheme = buildTheme("light");
export const darkTheme = buildTheme("dark");