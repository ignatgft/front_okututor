import { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { AUTH_STATUS } from "../store/authStore";

const INIT_TIMEOUT_MS = 10000;

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, status, user } = useAuthStore();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (status !== AUTH_STATUS.INITIALIZING) return;
    const timer = setTimeout(() => setTimedOut(true), INIT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status]);

  if (status === AUTH_STATUS.INITIALIZING) {
    if (timedOut) {
      return (
        <div className="loading-screen" role="alert">
          <p>Unable to verify your session.</p>
          <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      );
    }
    return <div className="loading-screen">Loading...</div>;
  }
  if (!isAuthenticated)
    return (
      <Navigate
        to={`/login?from=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (roles && !roles.includes(user?.role)) return <Navigate to="/403" replace />;

  return children || <Outlet />;
}

export default ProtectedRoute;
