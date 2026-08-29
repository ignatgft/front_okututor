import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../hooks/useTheme";
import { usePageTitle } from "../components/pageTitleContext";
import "../styles/Settings.css";

export default function PgSettings() {
  const { t, i18n } = useTranslation();
  const setPageTitle = usePageTitle();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => { setPageTitle(t("navbar.settings", "Настройки")); }, [setPageTitle, t]);

  const languages = [
    { code: "en", label: "English" },
    { code: "ru", label: "Русский" },
    { code: "ky", label: "Кыргызча" },
  ];

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
      <div className="settings-page">
        <div className="settings-section">
          <h3>{t("settings.appearance", "Внешний вид")}</h3>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-label">{t("settings.theme", "Тема")}</span>
              <span className="settings-value">{theme === "dark" ? t("settings.dark", "Тёмная") : t("settings.light", "Светлая")}</span>
            </div>
            <button className="theme-toggle" onClick={toggleTheme} role="switch" aria-checked={theme === "dark"} aria-label={t("settings.toggle_theme", "Toggle dark mode")}>
              <span className={`theme-option ${theme !== "dark" ? "active" : ""}`}>☀ {t("settings.light", "Светлая")}</span>
              <span className={`theme-option ${theme === "dark" ? "active" : ""}`}>☾ {t("settings.dark", "Тёмная")}</span>
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>{t("settings.language", "Язык")}</h3>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-label">{t("settings.language", "Язык")}</span>
              <span className="settings-value">{languages.find(l => l.code === i18n.language)?.label || "English"}</span>
            </div>
            <div className="language-selector-settings">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`lang-btn ${i18n.language === lang.code ? "active" : ""}`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>{t("settings.notifications", "Уведомления")}</h3>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-label">{t("settings.email_notifications", "Уведомления по email")}</span>
              <span className="settings-value">{t("settings.enabled", "Включены")}</span>
            </div>
          </div>
        </div>
      </div>
  );
}
