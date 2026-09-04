/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastItem {
  id: number;
  message: ReactNode;
  type: ToastType;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

export interface ToastContextValue {
  success: (msg: ReactNode, opts?: ToastOptions) => number;
  error: (msg: ReactNode, opts?: ToastOptions) => number;
  warning: (msg: ReactNode, opts?: ToastOptions) => number;
  info: (msg: ReactNode, opts?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<number, number>>({});

  const dismiss = useCallback((id: number): void => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
    if (timersRef.current[id]) {
      window.clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const show = useCallback(
    (message: ReactNode, { type = "info", duration = 4000 }: ToastOptions = {}): number => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-3), { id, message, type }]);
      timersRef.current[id] = window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (msg, opts) => show(msg, { type: "success", ...opts }),
      error: (msg, opts) => show(msg, { type: "error", duration: 6000, ...opts }),
      warning: (msg, opts) => show(msg, { type: "warning", duration: 5000, ...opts }),
      info: (msg, opts) => show(msg, { type: "info", ...opts }),
      dismiss,
    }),
    [show, dismiss]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-container" aria-live="polite" aria-relevant="additions">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast toast-${toast.type}`}
              aria-live={toast.type === "error" ? "assertive" : "polite"}
              role={toast.type === "error" ? "alert" : "status"}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                className="toast-close"
                aria-label={t("a11y.dismiss", "Dismiss")}
                onClick={() => dismiss(toast.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
