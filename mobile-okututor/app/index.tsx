import React from "react";
import { Redirect } from "expo-router";
import { AUTH_STATUS, useAuthStore } from "../src/store/authStore";
import { getDashboardPath } from "../src/utils/navigation";

export default function IndexRoute() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === AUTH_STATUS.INITIALIZING) return null;
  if (status !== AUTH_STATUS.AUTHENTICATED || !user) return <Redirect href="/login" />;

  return <Redirect href={getDashboardPath(user.role) as "/admin"} />;
}