/**
 * Skeleton loading states (spec §34) — never a full-screen spinner.
 */
export function SkeletonCard() {
  return (
    <div className="skeleton skeleton-card-block" aria-hidden="true">
      <div className="sk-line sk-w30" />
      <div className="sk-line" />
      <div className="sk-line sk-w70" />
    </div>
  );
}

export function SkeletonCardGrid({ count = 6 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="skeleton-stack" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton skeleton-row">
          <div className="sk-avatar" />
          <div className="sk-lines">
            <div className="sk-line sk-w50" />
            <div className="sk-line sk-w30" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="skeleton-profile" aria-hidden="true">
      <div className="skeleton sk-avatar-large" />
      <div className="sk-lines">
        <div className="sk-line sk-w40" />
        <div className="sk-line sk-w60" />
        <div className="sk-line sk-w80" />
      </div>
    </div>
  );
}
