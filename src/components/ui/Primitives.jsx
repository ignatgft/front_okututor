export function Badge({ status, children }) {
  const cls = String(status || "").toLowerCase().replace(/[^a-z]/g, "-");
  return <span className={`status-badge status-${cls}`}>{children ?? status}</span>;
}

export function Spinner({ label }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-spinner" />
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}

export function Skeleton({ count = 3, className = "skeleton-card" }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={className} />
      ))}
    </div>
  );
}

export function EmptyState({ icon = "📭", title, hint }) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state-icon" aria-hidden="true">{icon}</span>
      <p>{title}</p>
      {hint && <p className="empty-state-hint">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty-state error-state" role="alert">
      <span className="empty-state-icon" aria-hidden="true">⚠️</span>
      <p>{message}</p>
      {onRetry && <RetryButton onRetry={onRetry} />}
    </div>
  );
}

export function RetryButton({ onRetry, label = "Retry" }) {
  return (
    <button type="button" className="btn-secondary" onClick={onRetry}>
      {label}
    </button>
  );
}