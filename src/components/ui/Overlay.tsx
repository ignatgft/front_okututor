import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useOverlay(open: boolean, onClose?: () => void): { ref: React.RefObject<HTMLDivElement | null> } {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab" && ref.current) {
        const nodes = ref.current.querySelectorAll<HTMLElement>(focusableSelector);
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
    const prevFocus = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>(focusableSelector);
      el?.focus();
    }, 30);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(timer);
      prevFocus?.focus?.();
    };
  }, [open, handleKey]);

  return { ref };
}

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  ariaLabel?: string;
}

export function Modal({ open, onClose, title, children, footer, size = "md", ariaLabel }: ModalProps): JSX.Element | null {
  const { ref } = useOverlay(open, onClose);
  if (!open) return null;
  return (
    <div className="overlay-root" role="presentation">
      <div className="overlay-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || (typeof title === "string" ? title : undefined)}
        className={`modal-panel modal-size-${size}`}
      >
        <div className="modal-header">
          {title && <h2 className="modal-title">{title}</h2>}
          {onClose && (
            <button type="button" className="modal-close btn-icon" onClick={onClose} aria-label="Close">
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

export interface DrawerProps {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: "left" | "right";
}

export function Drawer({ open, onClose, title, children, footer, side = "left" }: DrawerProps): JSX.Element | null {
  const { ref } = useOverlay(open, onClose);
  if (!open) return null;
  return (
    <div className="overlay-root" role="presentation">
      <div className="overlay-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
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
