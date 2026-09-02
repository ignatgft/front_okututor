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

// Specialized Skeleton variants for different content types
export function SkeletonTutorCard({ count = 3 }) {
  return (
    <div className="skeleton-grid" aria-hidden="true" role="status">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-tutor-card">
          <div className="skeleton-avatar-lg" />
          <div className="skeleton-text-lg" />
          <div className="skeleton-text" style={{ width: "80%" }} />
          <div className="skeleton-text" style={{ width: "60%" }} />
          <div className="skeleton-tags">
            <span className="skeleton-tag" /><span className="skeleton-tag" /><span className="skeleton-tag" />
          </div>
          <div className="skeleton-text" style={{ width: "40%" }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCourseCard({ count = 3 }) {
  return (
    <div className="skeleton-grid" aria-hidden="true" role="status">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-course-card">
          <div className="skeleton-image" />
          <div className="skeleton-text-lg" />
          <div className="skeleton-text" style={{ width: "70%" }} />
          <div className="skeleton-text" style={{ width: "50%" }} />
          <div className="skeleton-tags">
            <span className="skeleton-tag" /><span className="skeleton-tag" />
          </div>
          <div className="skeleton-text" style={{ width: "80px" }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonLessonCard({ count = 3 }) {
  return (
    <div className="skeleton-lesson-list" aria-hidden="true" role="status">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-lesson-card">
          <div className="skeleton-lesson-time" />
          <div className="skeleton-lesson-content">
            <div className="skeleton-text-lg" />
            <div className="skeleton-text" style={{ width: "60%" }} />
            <div className="skeleton-text" style={{ width: "40%" }} />
          </div>
          <div className="skeleton-lesson-actions">
            <div className="skeleton-badge" />
            <div className="skeleton-btn" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard({ count = 3 }) {
  return (
    <div className="skeleton-dashboard" aria-hidden="true" role="status">
      {/* Stats cards */}
      <div className="skeleton-stats-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton-stat-card">
            <div className="skeleton-text-lg" />
            <div className="skeleton-text" style={{ width: "100px" }} />
          </div>
        ))}
      </div>
      {/* Upcoming lessons */}
      <div className="skeleton-lesson-list">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="skeleton-lesson-card">
            <div className="skeleton-lesson-time" />
            <div className="skeleton-lesson-content">
              <div className="skeleton-text-lg" />
              <div className="skeleton-text" style={{ width: "60%" }} />
              <div className="skeleton-text" style={{ width: "40%" }} />
            </div>
            <div className="skeleton-lesson-actions">
              <div className="skeleton-badge" />
              <div className="skeleton-btn" />
            </div>
          </div>
        ))}
      </div>
      {/* Applications */}
      <div className="skeleton-lesson-list">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="skeleton-lesson-card">
            <div className="skeleton-lesson-content">
              <div className="skeleton-text-lg" />
              <div className="skeleton-text" style={{ width: "60%" }} />
              <div className="skeleton-text" style={{ width: "40%" }} />
            </div>
            <div className="skeleton-lesson-actions">
              <div className="skeleton-btn" />
              <div className="skeleton-btn" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonSchedule({ compact = false, count = 4 }) {
  if (compact) {
    return (
      <div className="schedule-skeleton compact" role="status" aria-label="Loading calendar">
        <div className="skeleton-row">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="skeleton-cell" />
          ))}
        </div>
        <div className="skeleton-row">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="skeleton-cell" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="schedule-skeleton" role="status" aria-label="Loading schedule">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  );
}

export function EmptyState({ 
  icon = "📭", 
  title, 
  hint, 
  action,
  variant = "default",
  className = "",
  children 
}) {
  const variantStyles = {
    default: "",
    schedule: "empty-state--schedule",
    lessons: "empty-state--lessons",
    courses: "empty-state--courses",
    tutors: "empty-state--tutors",
    messages: "empty-state--messages",
    profile: "empty-state--profile",
    search: "empty-state--search",
  };

  return (
    <div className={`empty-state ${variantStyles[variant]} ${className}`} role="status">
      <span className="empty-state-icon" aria-hidden="true">{icon}</span>
      <p>{title}</p>
      {hint && <p className="empty-state-hint">{hint}</p>}
      {action && (
        <div className="empty-state-action">{action}</div>
      )}
      {children}
    </div>
  );
}

// Pre-configured EmptyState variants for common use cases
export const EmptyStateVariants = {
  noLessons: (action) => (
    <EmptyState
      variant="lessons"
      icon="🎓"
      title="Занятий пока нет"
      hint="Когда появятся запланированные уроки, они будут здесь"
      action={action}
    />
  ),

  noSchedule: (action) => (
    <EmptyState
      variant="schedule"
      icon="📅"
      title="Расписание пусто"
      hint="Занятия появятся после согласования расписания с тьютором"
      action={action}
    />
  ),

  noUpcoming: (action) => (
    <EmptyState
      variant="schedule"
      icon="📅"
      title="Ближайших занятий нет"
      hint="Следующее занятие появится здесь автоматически"
      action={action}
    />
  ),

  noCourses: (action) => (
    <EmptyState
      variant="courses"
      icon="📚"
      title="Курсов пока нет"
      hint="Найдите репетитора и начните обучение"
      action={action}
    />
  ),

  noTutors: (action) => (
    <EmptyState
      variant="tutors"
      icon="👨‍🏫"
      title="Репетиторов не найдено"
      hint="Попробуйте изменить фильтры поиска"
      action={action}
    />
  ),

  noMessages: (action) => (
    <EmptyState
      variant="messages"
      icon="💬"
      title="Сообщений пока нет"
      hint="Начните диалог с репетитором или поддержкой"
      action={action}
    />
  ),

  noResults: (action) => (
    <EmptyState
      variant="search"
      icon="🔍"
      title="Ничего не найдено"
      hint="Попробуйте изменить запрос или фильтры"
      action={action}
    />
  ),

  noProfile: (action) => (
    <EmptyState
      variant="profile"
      icon="👤"
      title="Профиль не заполнен"
      hint="Добавьте информацию о себе, чтобы репетиторы могли лучше вас узнать"
      action={action}
    />
  ),

  noNotifications: (action) => (
    <EmptyState
      variant="default"
      icon="🔔"
      title="Уведомлений пока нет"
      hint="Все важные события появятся здесь"
      action={action}
    />
  ),

  generic: (title, hint, action) => (
    <EmptyState
      variant="default"
      icon="📭"
      title={title}
      hint={hint}
      action={action}
    />
  ),
};

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