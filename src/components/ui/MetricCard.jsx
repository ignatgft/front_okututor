import "../../styles/ui.css";

export function MetricCard({ label, value, hint, icon, tone = "info", className = "" }) {
  return (
    <div className={`metric-card metric-card-${tone} ${className}`}>
      {icon && <span className="metric-card-icon" aria-hidden="true">{icon}</span>}
      <div className="metric-card-body">
        <p className="metric-card-value">{value}</p>
        <p className="metric-card-label">{label}</p>
        {hint && <p className="metric-card-hint">{hint}</p>}
      </div>
    </div>
  );
}

export default MetricCard;
