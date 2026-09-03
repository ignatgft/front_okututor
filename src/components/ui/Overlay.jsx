import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useOverlay(open, onClose) {
  const ref = useRef(null);

  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab" && ref.current) {
        const nodes = ref.current.querySelectorAll(focusableSelector);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const prevFocus = document.activeElement;
    const timer = setTimeout(() => {
      const el = ref.current?.querySelector(focusableSelector);
      el?.focus();
    }, 30);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(timer);
      prevFocus?.focus?.();
    };
  }, [open, handleKey]);

  return { ref, handleKey };
}

/**
 * Generic accessible Modal. Rendered inline; on small screens it expands to
 * a full-height sheet (spec §61, §37).
 */
export function Modal({ open, onClose, title, children, footer, size = "md", ariaLabel }) {
  const { ref } = useOverlay(open, onClose);
  if (!open) return null;
  return (
    <div className="overlay-root" role="presentation">
      <div className="overlay-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        className={`modal-panel modal-size-${size}`}
      >
        <div className="modal-header">
          {title && <h2 className="modal-title">{title}</h2>}
          {onClose && (
            <button type="button" className="modal-close btn-icon" onClick={onClose} aria-label={onClose ? "Close" : undefined}>
              <X size={20} />
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Generic accessible Drawer (side sheet). Left by default; right for filters.
 */
export function Drawer({ open, onClose, title, children, footer, side = "left" }) {
  const { ref } = useOverlay(open, onClose);
  if (!open) return null;
  return (
    <div className="overlay-root" role="presentation">
      <div className="overlay-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`drawer-panel drawer-side-${side}`}
      >
        <div className="modal-header">
          {title && <h2 className="modal-title">{title}</h2>}
          {onClose && (
            <button type="button" className="modal-close btn-icon" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="modal-body drawer-body">{children}</div>
        {footer && <div className="drawer-footer modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
