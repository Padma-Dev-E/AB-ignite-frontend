"use client";

import { useEffect, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";

export function GlobalLoadingIndicator() {
  const initialFetches = useIsFetching({
    predicate: (query) => query.state.data === undefined,
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!initialFetches) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 180);
    return () => window.clearTimeout(timer);
  }, [initialFetches]);

  if (!visible) return null;

  return (
    <div className="ignite-loading-bar" role="status" aria-live="polite" aria-label="Loading page content">
      <span />
      <span className="sr-only">Loading page content…</span>
    </div>
  );
}
