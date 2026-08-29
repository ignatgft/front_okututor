import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuthStore from "../store/authStore";
import { isAdmin, isTutor } from "../constants/roles";
import { BOTTOMNAV_ITEMS } from "../config/navigation";
import "../styles/BottomNav.css";

const BottomNav = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return null;

  const p = location.pathname;
  const isDetailPage = /^\/(course|lesson)\/[^/]+/.test(p) || /^\/tutor\/\d+$/.test(p);
  if (p === "/" || isDetailPage) return null;

  const isAdminRole = isAdmin(user?.role);
  const isTutorRole = isTutor(user?.role);

  const roleKey = isAdminRole ? "admin" : isTutorRole ? "tutor" : "student";
  const tabs = BOTTOMNAV_ITEMS[roleKey];
  if (!tabs || tabs.length === 0) return null;

  const isActive = (path) => {
    if (path.includes("?")) {
      const [route, query] = path.split("?");
      return location.pathname === route && location.search === "?" + query;
    }
    if (location.pathname === path) return true;
    if (location.pathname.startsWith(path + "/")) return true;
    if (path === "/student/search" && location.pathname === "/find-tutors") return true;
    return false;
  };

  return (
    <nav className="bottom-nav" aria-label={t("a11y.mobile_navigation", "Mobile navigation")}>
      <div className="bottom-nav-container">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const active = isActive(tab.path);
          return (
            <button
              key={tab.id}
              className={`bottom-nav-item ${active ? "active" : ""}`}
              onClick={() => navigate(tab.path)}
              aria-label={t(tab.labelKey)}
              title={t(tab.labelKey)}
              aria-current={active ? "page" : undefined}
            >
              <div className="bottom-nav-icon-wrap">
                <IconComponent className="bottom-nav-icon" />
                {active && <div className="bottom-nav-indicator" />}
              </div>
              <span className="bottom-nav-label">{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
