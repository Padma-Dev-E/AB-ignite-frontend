"use client";

import { useEffect } from "react";
import { refreshSession } from "../../auth/client-refresh";
import { logoutToLogin } from "../../auth/logout";

export function RefreshSession() {
  useEffect(() => {
    const configuredSeconds = Number(
      process.env.NEXT_PUBLIC_AUTH_REFRESH_INTERVAL_SECONDS ?? 600,
    );
    const intervalMs = Math.max(
      60_000,
      (Number.isFinite(configuredSeconds) ? configuredSeconds : 600) * 1000,
    );

    let logoutStarted = false;
    const refresh = () => {
      if (document.visibilityState === "hidden" || logoutStarted) return;
      void refreshSession().then((refreshed) => {
        if (refreshed || logoutStarted) return;
        logoutStarted = true;
        void logoutToLogin();
      });
    };

    const interval = window.setInterval(refresh, intervalMs);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return null;
}
