import { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const show = useCallback(
    (message, { type = "info", duration = 4000 } = {}) => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-3), { id, message, type }]);
      timersRef.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
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
      Object.values(timers).forEach(clearTimeout);
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

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
