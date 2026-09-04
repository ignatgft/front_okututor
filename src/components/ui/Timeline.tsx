import type { ReactNode } from "react";

export type TimelineState = "done" | "current" | "pending";

export interface TimelineStep {
  id: string | number;
  title: ReactNode;
  date?: ReactNode;
  state: TimelineState;
  node?: ReactNode;
}

export interface TimelineProps {
  steps: TimelineStep[];
}

export function Timeline({ steps }: TimelineProps): JSX.Element {
  return (
    <ol className="timeline">
      {steps.map((step) => {
        const cls = step.state === "done" ? "timeline-node-done" : step.state === "current" ? "timeline-node-current" : "timeline-node-pending";
        const marker = step.node || (step.state === "done" ? "●" : step.state === "current" ? "●" : "○");
        return (
          <li key={step.id} className="timeline-item">
            <span className={`timeline-node ${cls}`} aria-hidden="true">{marker}</span>
            <div className="timeline-content">
              <p className="timeline-title">{step.title}</p>
              {step.date && <time className="timeline-date">{step.date}</time>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
