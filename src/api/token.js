/**
 * Token storage abstraction.
 *
 * Access token: sessionStorage (XSS mitigation — cleared on tab close).
 * Refresh token: localStorage (persists across sessions for silent refresh).
 *
 * Production target (BLOCK: backend cookie migration): HttpOnly cookies —
 * the browser stops holding the refresh token at all, and this module
 * becomes the single place that switches behavior via APP_ENV,
 * without touching any caller.
 *
 * Contract used by callers:
 *   setTokens(access, refresh) / getAccessToken() / getRefreshToken()
 *   clearTokens() / isAuthenticated()
 */

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/**
 * When the backend moves to HttpOnly cookies:
 *  - getRefreshToken() returns null (browser never sees it; refresh endpoint
 *    relies on the cookie),
 *  - setTokens() persists only what it receives (refresh arg ignored),
 *  - clearTokens() additionally calls POST /auth/logout server-side hook point.
 * Kept as explicit seam so the migration is a one-file change.
 */
export function setTokens(accessToken, refreshToken) {
  if (accessToken) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

// TODO: move refresh token to httpOnly cookie on backend
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated() {
  return !!getAccessToken();
}

/**
 * Checks that access and refresh tokens are in sync.
 * Returns true if both exist or both are absent.
 * A mismatch (e.g. refresh exists but access doesn't) means state is corrupt
 * and callers should clearTokens().
 */
export function areTokensConsistent() {
  const access = !!getAccessToken();
  const refresh = !!getRefreshToken();
  return access === refresh;
}
