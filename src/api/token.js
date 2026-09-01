/**
 * Token storage abstraction — hardened for P0 audit.
 *
 * Access token: sessionStorage (XSS mitigation — cleared on tab close).
 * Refresh token: sessionStorage (was localStorage — P0 fix). Persists only for
 * tab lifetime, not across browser restarts, reducing XSS window. Long-term
 * target is HttpOnly Secure SameSite cookie — see USE_COOKIE flag.
 *
 * Production target (BACKEND cookie migration):
 *  - getRefreshToken() returns null (browser never sees it; refresh endpoint
 *    relies on the HttpOnly cookie via `credentials: include`),
 *  - setTokens() persists only what it receives (refresh arg ignored),
 *  - clearTokens() clears access token and (if cookie mode) relies on
 *    POST /auth/logout server-side to clear cookie.
 * This module is the single migration seam — no caller changes needed.
 *
 * Contract used by callers:
 *   setTokens(access, refresh) / getAccessToken() / getRefreshToken()
 *   clearTokens() / isAuthenticated()
 */

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// When true, frontend expects backend to set refresh token as HttpOnly cookie
// and will not store it in JS storage. Enable via VITE_USE_HTTPONLY_REFRESH=true
// or VITE_AUTH_REFRESH_VIA_COOKIE=true (both checked for backwards compat).
const USE_COOKIE = (() => {
  try {
    return (
      import.meta.env.VITE_USE_HTTPONLY_REFRESH === "true" ||
      import.meta.env.VITE_USE_HTTPONLY_REFRESH === true ||
      import.meta.env.VITE_AUTH_REFRESH_VIA_COOKIE === "true" ||
      import.meta.env.VITE_AUTH_REFRESH_VIA_COOKIE === true
    );
  } catch {
    return false;
  }
})();

// Use sessionStorage for refresh token (P0 fix: was localStorage).
// Keep localStorage read as fallback for migration of existing users.
const refreshStorage = () => {
  try {
    return USE_COOKIE ? null : window.sessionStorage;
  } catch {
    return null;
  }
};

export function setTokens(accessToken, refreshToken) {
  if (accessToken) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
  if (USE_COOKIE) {
    // In cookie mode, do not store refresh token in JS — backend sets HttpOnly cookie
    // Clean up any legacy storage
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (_e) { void _e; }
    return;
  }
  const storage = refreshStorage();
  if (!storage) return;
  if (refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    // Migrate: remove legacy localStorage copy if we now use sessionStorage
    try {
      if (storage !== localStorage) localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (_e) { void _e; }
  } else {
    storage.removeItem(REFRESH_TOKEN_KEY);
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (_e) { void _e; }
  }
}

export function getAccessToken() {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  if (USE_COOKIE) return null;
  try {
    const storage = refreshStorage();
    if (storage) {
      const v = storage.getItem(REFRESH_TOKEN_KEY);
      if (v) return v;
    }
    // Fallback for users who still have token in old localStorage
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearTokens() {
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (_e) { void _e; }
  try {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (_e) { void _e; }
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (_e) { void _e; }
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (_e) { void _e; }
}

export function isAuthenticated() {
  return !!getAccessToken();
}

/**
 * Checks that access and refresh tokens are in sync.
 * In cookie mode, only access token is checked.
 * Returns true if both exist or both are absent.
 * A mismatch (e.g. refresh exists but access doesn't) means state is corrupt
 * and callers should clearTokens().
 */
export function areTokensConsistent() {
  const access = !!getAccessToken();
  if (USE_COOKIE) return true;
  const refresh = !!getRefreshToken();
  // In non-cookie mode, allow access without refresh during initial login? Strict: require both
  // But to avoid false positives during migration, consider consistent if access matches refresh OR if we are in transition (localStorage fallback)
  return access === refresh;
}

export function isCookieRefreshEnabled() {
  return USE_COOKIE;
}
