"use client";

import { signOut } from "next-auth/react";
import { withBasePath } from "../lib/routing/base-path";
import { logoutFlow } from "./logout-flow";

export function logoutToLogin() {
  return logoutFlow({
    revokeRefreshToken: () => fetch(withBasePath("/api/auth/refresh"), { method: "DELETE", credentials: "same-origin" }),
    clearAuthSession: () => signOut({ redirect: false, callbackUrl: withBasePath("/login") }),
    navigateToLogin: () => window.location.replace(withBasePath("/login")),
  });
}
