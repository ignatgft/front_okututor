import { memo } from "react";
import "./ScheduleSkeleton.css";

interface ScheduleSkeletonProps {
  compact?: boolean;
  count?: number;
}

export const ScheduleSkeleton = memo(function ScheduleSkeleton({ compact = false, count = 4 }: ScheduleSkeletonProps) {
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
        <div key={i} className="skeleton-card">
          <div className="skeleton-card-time" />
          <div className="skeleton-card-content">
            <div className="skeleton-card-title" />
            <div className="skeleton-card-tutor" />
            <div className="skeleton-card-format" />
          </div>
          <div className="skeleton-card-actions">
            <div className="skeleton-badge" />
            <div className="skeleton-btn" />
          </div>
        </div>
      ))}
    </div>
  );
});

ScheduleSkeleton.displayName = "ScheduleSkeleton";