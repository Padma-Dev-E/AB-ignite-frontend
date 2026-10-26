"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import { createQueryClient } from "../lib/query/query-client";
import { makeStore } from "../store";
import { GlobalToastProvider } from "../components/ui/global-toast";
import { GlobalLoadingIndicator } from "../components/ui/global-loading-indicator";
import { authBasePath } from "../lib/routing/base-path";

export function AppProviders({ children }: { children: ReactNode }) {
  // Instance-local lazy initialization isolates SSR requests and survives rerenders.
  const [queryClient] = useState(createQueryClient);
  const [store] = useState(makeStore);

  return <SessionProvider basePath={authBasePath}>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <GlobalToastProvider>
          <GlobalLoadingIndicator />
          {children}
        </GlobalToastProvider>
      </QueryClientProvider>
    </Provider>
  </SessionProvider>;
}
