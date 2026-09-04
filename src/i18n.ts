import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

/**
 * Locales are lazy-loaded per language: only the active translation bundle
 * ships in the initial chunk, the rest are fetched on demand (~30-40 KB off
 * the critical path per unused locale).
 */
const localeLoaders: Record<string, () => Promise<{ default: object }>> = {
  en: () => import("./locales/en/translation.json"),
  ru: () => import("./locales/ru/index.ts"),
  ky: () => import("./locales/kg/index.ts"),
};

const loadedLngs = new Set<string>();

export async function loadLocale(lng: string): Promise<void> {
  const base = lng.split("-")[0];
  const loader = localeLoaders[base] ?? localeLoaders.en;
  if (!loadedLngs.has(base)) {
    const { default: resources } = await loader();
    i18n.addResourceBundle(base, "translation", resources, true, true);
    loadedLngs.add(base);
  }
}

// English ships inline as the fallback language (smallest safe default).
import translationEN from "./locales/en/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translationEN },
    },
    partialBundledLanguages: true,
    // kg kept as alias via fallback — browser may return "kg" historically, map to "ky"
    supportedLngs: ["en", "ru", "ky", "kg"],
    nonExplicitSupportedLngs: true,
    fallbackLng: "en",
    pluralSeparator: "_",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  });

// Alias legacy "kg" (non-standard) to "ky"
if (typeof i18n.services?.languageUtils?.formatLanguageCode === "function") {
  const orig = i18n.services.languageUtils.formatLanguageCode.bind(i18n.services.languageUtils);
  i18n.services.languageUtils.formatLanguageCode = (code) => (code === "kg" ? "ky" : orig(code));
}

// Load the detected/active locale bundle (ru/ky) before first render usage.
const initial = i18n.resolvedLanguage || i18n.language || "en";
if (initial.split("-")[0] !== "en") {
  void loadLocale(initial);
}

i18n.on("languageChanged", (lng) => {
  document.documentElement.setAttribute("lang", lng);
  void loadLocale(lng);
});

export default i18n;
