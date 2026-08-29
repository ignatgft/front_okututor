import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "okututor.access_token";
const REFRESH_TOKEN_KEY = "okututor.refresh_token";

/**
 * Token storage abstraction for mobile.
 *
 * Native (Android / iOS):
 *   expo-secure-store (Keychain / Keystore) — never AsyncStorage for JWT.
 *
 * Web (react-native-web):
 *   AsyncStorage is the only durable store available; SecureStore is a
 *   native-only module. Kept behind a platform guard so the same code path
 *   runs everywhere.
 */

const isNative = Platform.OS !== "web";

async function writeValue(key: string, value: string | null): Promise<void> {
  if (isNative) {
    if (value === null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
    return;
  }
  if (value === null) {
    await AsyncStorage.removeItem(key);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function readValue(key: string): Promise<string | null> {
  if (isNative) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

/**
 * Persists the token pair. Passing null for a token clears that entry.
 */
export async function setTokens(
  accessToken: string | null,
  refreshToken: string | null
): Promise<void> {
  await Promise.all([writeValue(ACCESS_TOKEN_KEY, accessToken), writeValue(REFRESH_TOKEN_KEY, refreshToken)]);
}

export async function getAccessToken(): Promise<string | null> {
  return readValue(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return readValue(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([writeValue(ACCESS_TOKEN_KEY, null), writeValue(REFRESH_TOKEN_KEY, null)]);
}

export async function isAuthenticated(): Promise<boolean> {
  return !!await getAccessToken();
}

/**
 * Checks that access and refresh tokens are in sync.
 * A mismatch (refresh exists but access doesn't) means state is corrupt
 * and callers should clearTokens().
 */
export async function areTokensConsistent(): Promise<boolean> {
  const [access, refresh] = await Promise.all([getAccessToken(), getRefreshToken()]);
  return !!access === !!refresh;
}