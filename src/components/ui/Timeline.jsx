/**
 * Visual timeline for request history (spec §14). Each step renders a
 * connected dot; future/awaiting steps render as hollow "○".
 *
 * @param {Array<{id,title,date,state,node?}>} steps state in
 *        ["done"|"current"|"pending"]; `node` optional custom marker.
 */
export function Timeline({ steps }) {
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
