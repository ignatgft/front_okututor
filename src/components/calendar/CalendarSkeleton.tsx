import { Skeleton } from "../ui/Primitives";

export interface CalendarSkeletonProps {
  compact?: boolean;
}

export default function CalendarSkeleton({ compact = false }: CalendarSkeletonProps): JSX.Element {
  if (compact) {
    return (
      <div className="calendar-skeleton" role="status" aria-label="Loading calendar">
        <div className="calendar-skeleton-row">
          <Skeleton count={7} className="calendar-skeleton-cell" />
        </div>
        <div className="calendar-skeleton-row">
          <Skeleton count={7} className="calendar-skeleton-cell" />
        </div>
      </div>
    );
  }
  return (
    <div className="calendar-skeleton" role="status" aria-label="Loading calendar">
      <Skeleton count={6} className="skeleton-card" />
    </div>
  );
}
