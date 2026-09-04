import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import translationEN from "./locales/en/translation.json";
import translationRU from "./locales/ru/translation.json";
import translationKG from "./locales/kg/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translationEN },
      ru: { translation: translationRU },
      ky: { translation: translationKG },
    },
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

i18n.on("languageChanged", (lng) => {
  document.documentElement.setAttribute("lang", lng);
});

export default i18n;