import { randomUUID } from "node:crypto";
import { createHmac } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckState = "ready" | "unhealthy" | "unreachable" | "misconfigured" | "unknown";

function configuredApiOrigin() {
  const value = process.env.API_INTERNAL_URL ?? "http://api:4100";
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function GET() {
  const requestId = randomUUID();
  const checkedAt = new Date().toISOString();
  const apiOrigin = configuredApiOrigin();
  if (!apiOrigin) {
    return Response.json({
      requestId, checkedAt, latencyMs: null,
      fastify: "misconfigured" satisfies CheckState,
      frontendAuth: "unknown" satisfies CheckState,
      ready: false,
    }, { headers: { "cache-control": "no-store" } });
  }

  const startedAt = performance.now();
  let healthResponse: Response;
  try {
    healthResponse = await fetch(new URL("/health/ready", apiOrigin), {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    return Response.json({
      requestId, checkedAt, latencyMs: Math.round(performance.now() - startedAt),
      fastify: "unreachable" satisfies CheckState,
      frontendAuth: "unknown" satisfies CheckState,
      ready: false,
    }, { headers: { "cache-control": "no-store" } });
  }

  const latencyMs = Math.round(performance.now() - startedAt);
  let frontendAuth: CheckState = "misconfigured";
  const token = process.env.INTERNAL_API_TOKEN ?? "";
  const authSecret = process.env.AUTH_SECRET ?? "";
  const cookieName = process.env.AUTH_SESSION_COOKIE_NAME ?? "ab_ignite_session";
  if (token.length >= 32 && authSecret.length >= 32 && cookieName) {
    try {
      const authResponse = await fetch(new URL("/internal/health", apiOrigin), {
        headers: {
          "x-internal-api-token": token,
          "x-auth-config-proof": createHmac("sha256", authSecret).update("ab-ignite-session-config-check-v1").digest("hex"),
          "x-session-cookie-name": cookieName,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      frontendAuth = authResponse.ok ? "ready" : [404, 409].includes(authResponse.status) ? "misconfigured" : "unhealthy";
    } catch {
      frontendAuth = "unreachable";
    }
  }

  const fastify: CheckState = healthResponse.status === 200 ? "ready" : "unhealthy";
  return Response.json({
    requestId, checkedAt, latencyMs, fastify, frontendAuth,
    ready: fastify === "ready" && frontendAuth === "ready",
  }, { headers: { "cache-control": "no-store" } });
}
