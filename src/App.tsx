import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import useAuthStore from "./store/authStore";
import { useUIStore } from "./store/uiStore";
import { AppProviders } from "./app/providers/AppProviders";
import { AppRouter } from "./app/router/AppRouter";
import Auth from "./components/AuthRegister/Auth";
import Register from "./components/AuthRegister/Register";
import BottomNav from "./components/BottomNav";
import i18n from "./i18n";

export default function App(): JSX.Element {
  const { t } = useTranslation();
  const { init, retryInit, status, initError, logout } = useAuthStore();
  const { isAuthOpen, isRegisterOpen, closeAuth, closeRegister } = useUIStore();

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    const handleAuthLogout = async (): Promise<void> => {
      await logout();
    };
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => {
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, [logout]);

  if (status === "initializing")
    return <div className="loading-screen" role="status" aria-live="polite">{i18n.t("common.loading", "Loading...")}</div>;

  if (status === "offline")
    return (
      <div className="loading-screen" role="alert" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: 24, textAlign: "center" }}>
        <p>{initError || t("errors.network_error", "Network error. Check your connection.")}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn-primary" onClick={() => void retryInit()}>
            {t("common.retry", "Retry")}
          </button>
          <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
            {t("common.reload", "Reload")}
          </button>
        </div>
      </div>
    );

  return (
    <AppProviders>
      <a href="#main-content" className="skip-nav">{t("a11y.skip_to_content", "Skip to content")}</a>
      <AppRouter />
      <BottomNav />
      <Auth isOpen={isAuthOpen} onClose={closeAuth} onSuccess={closeAuth} />
      <Register isOpen={isRegisterOpen} onClose={closeRegister} />
    </AppProviders>
  );
}
