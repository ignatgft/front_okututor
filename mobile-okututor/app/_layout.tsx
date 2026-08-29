import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";
import { ToastProvider } from "../src/components/ui/Toast";
import { initI18n } from "../src/i18n";
import { useAuthStore } from "../src/store/authStore";
import { onAuthEvent } from "../src/security/authEvents";
import { configureNotificationHandler } from "../src/services/notifications";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    // Force a full-app logout when any layer detects an expired/revoked token.
    const unsubscribe = onAuthEvent("auth:logout", () => {
      useAuthStore.getState().logout().catch(() => undefined);
      router.replace("/login");
    });
    return unsubscribe;
  }, [router]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[id]" />
        <Stack.Screen name="tutor/[id]" />
        <Stack.Screen name="booking/new" />
        <Stack.Screen name="booking/[id]" />
        <Stack.Screen name="lesson/[id]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="course-form" />
        <Stack.Screen name="admin" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    configureNotificationHandler();
    (async () => {
      await initI18n();
      await useAuthStore.getState().init();
      if (!active) return;
      setReady(true);
      SplashScreen.hideAsync().catch(() => undefined);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        {ready ? <RootNavigator /> : <Booting />}
      </ToastProvider>
    </ThemeProvider>
  );
}

function Booting() {
  return <StatusBar style="auto" />;
}