import React, { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { View, Text, ActivityIndicator, Linking, Platform } from "react-native";
import {
  handleOAuthPayload,
  handleOAuthUrl,
} from "../../src/services/oauth";
import { useAuthStore } from "../../src/store/authStore";
import { getDashboardPath } from "../../src/utils/navigation";
import { Button } from "../../src/components/ui";
import { useTheme } from "../../src/theme/ThemeProvider";

export default function OAuthCallbackScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [status, setStatus] = useState<"loading" | "error" | "done">("loading");
  const ranRef = useRef(false);
  const routeParams = useLocalSearchParams<Record<string, string | string[]>>();

  const completeFromParams = async (params: Record<string, string | undefined>) => {
    if (params["error"]) return false;
    try {
      const ok = await handleOAuthPayload(params);
      if (!ok) return false;
      const user = useAuthStore.getState().user;
      router.replace(getDashboardPath(user?.role));
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (Platform.OS === "web") {
      // Web: the backend redirects back to /oauth/callback?access_token=...
      const raw: Record<string, string | undefined> = {};
      for (const [k, v] of Object.entries(routeParams)) {
        raw[k] = Array.isArray(v) ? v[0] : v;
      }
      completeFromParams(raw).then((ok) => setStatus(ok ? "done" : "error"));
      return;
    }

    // Native: deep link mobileokututor://oauth/callback?access_token=...
    let active = true;
    const listener = Linking.addEventListener("url", ({ url }) => {
      if (!active) return;
      handleOAuthUrl(url).then((ok) => {
        if (!active) return;
        if (ok) {
          setStatus("done");
          const user = useAuthStore.getState().user;
          router.replace(getDashboardPath(user?.role));
        } else {
          setStatus("error");
        }
      });
    });
    // Handle the case where the app was cold-started by the deep link.
    Linking.getInitialURL().then((url) => {
      if (!active || !url) return;
      handleOAuthUrl(url).then((ok) => {
        if (!active) return;
        if (ok) {
          setStatus("done");
          const user = useAuthStore.getState().user;
          router.replace(getDashboardPath(user?.role));
        } else {
          setStatus("error");
        }
      });
    });
    return () => {
      active = false;
      listener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "done") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.text }}>{t("oauth.signing_in", "Signing you in with Google...")}</Text>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, backgroundColor: theme.colors.background, padding: 24 }}>
        <Text style={{ color: theme.colors.text, textAlign: "center" }}>
          {t("oauth.error", "Google sign-in failed. Please try again.")}
        </Text>
        <Button title={t("buttons.back_home", "Back to Login")} variant="outline" onPress={() => router.replace("/login")} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: theme.colors.background }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={{ color: theme.colors.textSecondary }}>
        {t("oauth.signing_in", "Signing you in with Google...")}
      </Text>
    </View>
  );
}