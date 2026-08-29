import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import translationEN from "./locales/en/translation.json";
import translationRU from "./locales/ru/translation.json";
import translationKG from "./locales/kg/translation.json";

export const SUPPORTED_LANGUAGES = ["en", "ru", "kg"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = "okututor.lang";

function normalizeLang(lng: string | null | undefined): SupportedLanguage | null {
  if (!lng) return null;
  const base = String(lng).split("-")[0].toLowerCase();
  if (base === "ky" || base === "kg") return "kg";
  if (base === "ru") return "ru";
  if (base === "en") return "en";
  return null;
}

async function detectInitialLanguage(): Promise<SupportedLanguage> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    const normalized = normalizeLang(saved);
    if (normalized) return normalized;
  } catch {
    // fall through to system detection
  }
  try {
    const locales = Localization.getLocales?.();
    const system = locales?.[0]?.languageCode;
    return normalizeLang(system) || "en";
  } catch {
    return "en";
  }
}

/** Applies a language and persists the user choice. */
export async function setAppLanguage(lng: SupportedLanguage): Promise<void> {
  // eslint-disable-next-line import/no-named-as-default-member
  await i18n.changeLanguage(lng);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch {
    // persistence failure is non-fatal
  }
}

export async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  try {
    return normalizeLang(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export async function initI18n(): Promise<typeof i18n> {
  const lng = await detectInitialLanguage();
  if (!i18n.isInitialized) {
    // eslint-disable-next-line import/no-named-as-default-member
    await i18n.use(initReactI18next).init({
      resources: {
        en: { translation: translationEN },
        ru: { translation: translationRU },
        kg: { translation: translationKG },
      },
      lng,
      fallbackLng: "en",
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
  } else {
    // eslint-disable-next-line import/no-named-as-default-member
    await i18n.changeLanguage(lng);
  }
  return i18n;
}

export default i18n;