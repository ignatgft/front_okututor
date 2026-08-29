import { Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { buildGoogleOAuthUrl , getCurrentUser } from "../api/auth";
import { setTokens } from "../api/token";
import { useAuthStore } from "../store/authStore";

/**
 * Deep link the backend redirects back to after Google sign-in.
 * Must match the `scheme` in app.json.
 */
export const OAUTH_CALLBACK_URL = "mobileokututor://oauth/callback";

/**
 * Completes a Google OAuth sign-in from a callback payload containing
 * `access_token` / `refresh_token`, mirroring PgOAuthCallback.tsx.
 */
export async function handleOAuthPayload(params: Record<string, string | undefined>): Promise<boolean> {
  const accessToken = params["access_token"];
  if (!accessToken) return false;
  await setTokens(accessToken, params["refresh_token"] ?? null);
  const user = await getCurrentUser();
  if (!user) return false;
  useAuthStore.getState().login(user);
  return true;
}

export type OAuthStartResult = "success" | "cancelled" | "error" | "opened";

/**
 * Starts the Google OAuth flow.
 *  - native: opens a system auth session in-browser and processes the
 *    `mobileokututor://oauth/callback` deep link on return.
 *  - web: navigates the tab (backend redirects back to `/oauth/callback`).
 */
export async function startGoogleSignIn(role?: string): Promise<OAuthStartResult> {
  try {
    if (Platform.OS === "web") {
      await Linking.openURL(buildGoogleOAuthUrl(role));
      return "opened";
    }
    const base = buildGoogleOAuthUrl(role);
    const url = `${base}${base.includes("?") ? "&" : "?"}redirect_uri=${encodeURIComponent(OAUTH_CALLBACK_URL)}`;
    const result = await WebBrowser.openAuthSessionAsync(url, OAUTH_CALLBACK_URL);
    if (result.type === "success" && result.url) {
      const handled = await handleOAuthUrl(result.url);
      return handled ? "success" : "error";
    }
    return result.type === "cancel" ? "cancelled" : "success";
  } catch {
    return "error";
  }
}

export function handleOAuthUrl(url: string): Promise<boolean> {
  const [, query] = url.split("?");
  const params: Record<string, string | undefined> = {};
  if (query) {
    for (const pair of query.split("&")) {
      const [k, v] = pair.split("=");
      if (k) params[k] = v ? decodeURIComponent(v) : undefined;
    }
  }
  return handleOAuthPayload(params);
}