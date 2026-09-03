import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";
import { PageTitleProvider } from "./pageTitleContext";
import useAuthStore from "../store/authStore";
import "../styles/DashboardLayout.css";

const DashboardLayout = ({ children, title, subtitle }) => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [dynamicTitle, setDynamicTitle] = useState(title);
  const [dynamicSubtitle, setDynamicSubtitle] = useState(subtitle);

  const setTitle = useCallback((newTitle, newSubtitle) => {
    setDynamicTitle(newTitle);
    if (newSubtitle !== undefined) setDynamicSubtitle(newSubtitle);
  }, []);

  useEffect(() => {
    setDynamicTitle(title);
    setDynamicSubtitle(subtitle);
  }, [title, subtitle]);

  useEffect(() => {
    const checkBreakpoint = () => {
      const w = window.innerWidth;
      setIsMobile(w <= 767);
      setIsTablet(w >= 768 && w <= 1199);
    };
    checkBreakpoint();
    window.addEventListener("resize", checkBreakpoint);
    return () => window.removeEventListener("resize", checkBreakpoint);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    if (sidebarOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [sidebarOpen]);

  const showDrawerSidebar = isMobile;
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const p = location.pathname;
  const isDetailPage = /^\/(course|lesson)\/[^/]+/.test(p) || /^\/tutor\/\d+$/.test(p);
  const hasBottomNav = isAuthenticated && p !== "/" && !isDetailPage && isMobile;

  return (
    <PageTitleProvider value={setTitle}>
      <div className={`dashboard-layout ${isTablet ? "dashboard-layout--tablet" : ""} ${showDrawerSidebar ? "dashboard-layout--mobile" : ""} ${hasBottomNav ? "has-bottom-nav" : ""}`}>
        <a href="#main-content" className="skip-link">
          {t("a11y.skip_to_content", "Skip to main content")}
        </a>
        {!isMobile && (
          <Sidebar collapsed={isTablet} />
        )}

        {showDrawerSidebar && (
          <>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            {sidebarOpen && (
              <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            )}
          </>
        )}

        <main className="dashboard-main" id="main-content">
          {showDrawerSidebar && (
            <div className="dashboard-header-mobile">
              <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(true)}
                aria-label={t("a11y.open_menu", "Open menu")}
                aria-expanded={sidebarOpen}
                aria-controls="sidebar"
              >
                <span className="hamburger-line" />
                <span className="hamburger-line" />
                <span className="hamburger-line" />
              </button>
              {(dynamicTitle || dynamicSubtitle) && (
                <div className="page-header">
                  {dynamicTitle && <h1 className="page-title">{dynamicTitle}</h1>}
                  {dynamicSubtitle && <p className="page-subtitle">{dynamicSubtitle}</p>}
                </div>
              )}
            </div>
          )}
          <div className="dashboard-content-area">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </PageTitleProvider>
  );
};

export default DashboardLayout;
