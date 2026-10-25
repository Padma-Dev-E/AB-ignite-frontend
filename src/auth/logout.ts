"use client";

import { signOut } from "next-auth/react";
import { logoutFlow } from "./logout-flow";

export function logoutToLogin() {
  return logoutFlow({
    revokeRefreshToken: () => fetch("/api/auth/refresh", { method: "DELETE", credentials: "same-origin" }),
    clearAuthSession: () => signOut({ redirect: false, callbackUrl: "/login" }),
    navigateToLogin: () => window.location.replace("/login"),
  });
}
