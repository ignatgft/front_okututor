// migrated to TSX — minimal strict types (controlled)
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuthStore from "../store/authStore";
import { useTheme } from "../hooks/useTheme";
import { notificationsApi } from "../api/messages.api";
import { isAdmin, isTutor, isSuperAdmin } from "../constants/roles";
import { LogOut, Bell, Settings as SettingsIcon } from "lucide-react";
import { SIDEBAR_ITEMS, getSectionPath } from "../config/navigation";
import "../styles/Sidebar.css";

const Sidebar = ({ isOpen = false, onClose, collapsed = false }) => {
  const [langOpen, setLangOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let alive = true;
    const poll = async () => {
      try {
        const { response, data } = await notificationsApi.unreadCount();
        if (alive && response.ok) {
          const n = typeof data === "object" ? data?.count : data;
          setUnreadCount(Number(n) || 0);
        }
      } catch (err) {
        void err;
      }
    };
    poll();
    const id = setInterval(poll, 30000);
    const onRefresh = () => poll();
    window.addEventListener("notifications:refresh", onRefresh);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("notifications:refresh", onRefresh);
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const role = user?.role;
  const isRoleAdmin = isAdmin(role);
  const isRoleTutor = isTutor(role);
  const isRoleSuperAdmin = isSuperAdmin(role);

  let roleKey = "student";
  if (isRoleAdmin || isRoleSuperAdmin) roleKey = "admin";
  else if (isRoleTutor) roleKey = "tutor";

  const navItems = SIDEBAR_ITEMS[roleKey];
  const section = getSectionPath(role);

  const bottomItems = [
    { id: "settings", labelKey: "navbar.settings", icon: SettingsIcon, path: `${section}/settings` },
  ];

  const isActive = (path) => {
    if (path.includes("?")) {
      return location.pathname + location.search === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getUserInitials = () => {
    if (!user?.full_name) return "?";
    return user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <aside
      className={`sidebar ${isOpen ? "open" : ""} ${collapsed ? "sidebar--collapsed" : ""}`}
      id="sidebar"
      role="navigation"
      aria-label={t("a11y.main_navigation", "Main navigation")}
    >
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <span className="sidebar-logo-text">okututor</span>
        </Link>
        <button className="sidebar-close-btn" onClick={onClose} aria-label={t("a11y.close_menu", "Close menu")}>
          ✕
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            return (
              <li key={item.id}>
                <button
                  className={`sidebar-item ${active ? "active" : ""}`}
                  onClick={() => { navigate(item.path); onClose?.(); }}
                  title={collapsed ? t(item.labelKey) : undefined}
                >
                  <IconComponent className="sidebar-icon" />
                  {!collapsed && <span className="sidebar-label">{t(item.labelKey)}</span>}
                  {!collapsed && item.id === "notifications" && unreadCount > 0 && (
                    <span className="sidebar-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <ul className="sidebar-menu">
          {bottomItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <button
                  className={`sidebar-item ${isActive(item.path) ? "active" : ""}`}
                  onClick={() => { navigate(item.path); onClose?.(); }}
                  title={collapsed ? t(item.labelKey) : undefined}
                >
                  <IconComponent className="sidebar-icon" />
                  {!collapsed && <span className="sidebar-label">{t(item.labelKey)}</span>}
                  {!collapsed && !!item.badge && item.badge > 0 && (
                    <span className="sidebar-badge">{item.badge > 99 ? "99+" : item.badge}</span>
                  )}
                </button>
              </li>
            );
          })}
          <li>
            <button
              className="sidebar-item sidebar-logout"
              onClick={() => { handleLogout(); onClose?.(); }}
              title={collapsed ? t("navbar.logout") : undefined}
            >
              <LogOut className="sidebar-icon" size={18} />
              {!collapsed && <span className="sidebar-label">{t("navbar.logout")}</span>}
            </button>
          </li>
        </ul>

        {!collapsed && (
          <div className="sidebar-controls">
            <button className="sidebar-control-btn" onClick={toggleTheme} title={t("a11y.toggle_theme", "Toggle theme")}>
              {theme === "dark" ? "\u2600" : "\u263E"}
            </button>
            <div className="sidebar-lang-selector">
              <button className="sidebar-control-btn" onClick={() => setLangOpen(!langOpen)}>
                {i18n.language.toUpperCase()}
              </button>
              {langOpen && (
                <div className="sidebar-lang-dropdown">
                  {["en", "ru", "ky"].map((code) => (
                    <button
                      key={code}
                      className={i18n.language === code ? "active" : ""}
                      onClick={() => { i18n.changeLanguage(code); setLangOpen(false); }}
                    >
                      {code.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          className={`sidebar-user ${collapsed ? "sidebar-user--collapsed" : ""}`}
          onClick={() => { navigate(`${section}/profile`); onClose?.(); }}
          aria-label={t("navbar.profile")}
        >
          <div className="sidebar-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.full_name} />
            ) : (
              <span>{getUserInitials()}</span>
            )}
          </div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.full_name || t("common.user", "User")}</span>
              <span className="sidebar-user-role">{user?.role || ""}</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
