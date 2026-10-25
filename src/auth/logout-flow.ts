export type LogoutFlowOptions = {
  revokeRefreshToken: () => Promise<unknown>;
  clearAuthSession: () => Promise<unknown>;
  navigateToLogin: () => void;
  revokeTimeoutMs?: number;
  clearTimeoutMs?: number;
};

async function finishWithin(operation: () => Promise<unknown>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.resolve().then(operation).catch(() => undefined),
      new Promise<void>((resolve) => { timeout = setTimeout(resolve, timeoutMs); }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function logoutFlow({
  revokeRefreshToken,
  clearAuthSession,
  navigateToLogin,
  revokeTimeoutMs = 1500,
  clearTimeoutMs = 2500,
}: LogoutFlowOptions) {
  await finishWithin(revokeRefreshToken, revokeTimeoutMs);
  await finishWithin(clearAuthSession, clearTimeoutMs);
  navigateToLogin();
}
