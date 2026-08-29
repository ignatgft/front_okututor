import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { NotificationResponse } from "expo-notifications";
import Constants from "expo-constants";

/**
 * Push notifications.
 *
 * Device token registration (Expo push token) is meant to be forwarded to the
 * backend so it can address the device. Guards every native call so failure
 * (e.g. in Expo Go / web) never crashes startup.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

/**
 * Returns an Expo push token for the device, or null when unavailable /
 * permission denied. Callers must persist it on the backend.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) return null;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

export async function getLastNotificationResponse(): Promise<NotificationResponse | null> {
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch {
    return null;
  }
}