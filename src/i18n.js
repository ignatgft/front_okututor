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
    lng: "en", // <-- английский по умолчанию
    resources: {
      en: { translation: translationEN },
      ru: { translation: translationRU },
      kg: { translation: translationKG }
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
