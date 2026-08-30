/**
 * Consistent page header (spec §7 typography hierarchy: 28–32 page title).
 */
export function PageHeader({ title, subtitle, icon, actions }) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        {icon && <span className="page-header-icon" aria-hidden="true">{icon}</span>}
        <div>
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
