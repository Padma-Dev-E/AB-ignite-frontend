import test from "node:test";
import assert from "node:assert/strict";

test("logout still clears the frontend session and navigates to login if refresh revocation fails", async () => {
  const module = await import("./logout-flow.js").catch(() => ({}));
  assert.equal(typeof module.logoutFlow, "function", "logout flow should be available");

  const events: string[] = [];
  await module.logoutFlow({
    revokeRefreshToken: async () => { events.push("revoke"); throw new Error("API unavailable"); },
    clearAuthSession: async () => { events.push("clear-auth"); },
    navigateToLogin: () => { events.push("navigate:/login"); },
  });

  assert.deepEqual(events, ["revoke", "clear-auth", "navigate:/login"]);
});

test("logout navigates to login even if frontend session cleanup fails", async () => {
  const module = await import("./logout-flow.js").catch(() => ({}));
  assert.equal(typeof module.logoutFlow, "function", "logout flow should be available");

  const events: string[] = [];
  await module.logoutFlow({
    revokeRefreshToken: async () => { events.push("revoke"); },
    clearAuthSession: async () => { events.push("clear-auth"); throw new Error("Auth endpoint unavailable"); },
    navigateToLogin: () => { events.push("navigate:/login"); },
  });

  assert.deepEqual(events, ["revoke", "clear-auth", "navigate:/login"]);
});

test("logout reaches login if either cleanup request never settles", async () => {
  const { logoutFlow } = await import("./logout-flow.js");
  const events: string[] = [];

  await logoutFlow({
    revokeRefreshToken: () => new Promise(() => undefined),
    clearAuthSession: () => new Promise(() => undefined),
    navigateToLogin: () => { events.push("navigate:/login"); },
    revokeTimeoutMs: 5,
    clearTimeoutMs: 5,
  });

  assert.deepEqual(events, ["navigate:/login"]);
});
