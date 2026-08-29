import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildTheme, Theme } from "./index";

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "okututor.theme";

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (!active) return;
        if (saved === "light" || saved === "dark" || saved === "system") setModeState(saved);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const resolvedMode: "light" | "dark" =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const theme = useMemo(() => buildTheme(resolvedMode), [resolvedMode]);

  const value = useMemo(
    () => ({ theme, mode, resolvedMode, setMode }),
    [theme, mode, resolvedMode, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}