import { withBasePath } from "../lib/routing/base-path";

type BackendStatus = {
  fastify: "ready" | "unhealthy" | "unreachable" | "misconfigured" | "unknown";
  frontendAuth: "ready" | "unhealthy" | "unreachable" | "misconfigured" | "unknown";
};

export async function requireBackendReadyForLogin() {
  let status: BackendStatus;
  try {
    const response = await fetch(withBasePath("/api/system-status"), {
      cache: "no-store",
      credentials: "same-origin",
      signal: AbortSignal.timeout(5000),
    });
    status = await response.json() as BackendStatus;
  } catch {
    throw new Error("Could not check the backend connection. Open Service status to see whether Next.js can reach Fastify.");
  }

  if (status.fastify === "unreachable" || status.fastify === "misconfigured") {
    throw new Error("Next.js cannot reach Fastify. Check the frontend API_INTERNAL_URL and the backend Service/network settings. Open Service status for live details.");
  }
  if (status.frontendAuth === "misconfigured") {
    throw new Error("Next.js reached Fastify, but the internal API token is missing or does not match. Check INTERNAL_API_TOKEN in both services.");
  }
  if (status.fastify !== "ready") {
    throw new Error("Fastify responded but is not ready. Check the backend health and database status on the Service status page.");
  }
  if (status.frontendAuth !== "ready") {
    throw new Error("Fastify is reachable, but the frontend-to-backend authentication check failed. Open Service status for details.");
  }
}

export function loginFailureMessage(error: string | null | undefined) {
  if (error === "CredentialsSignin") return "Email or password is incorrect.";
  if (error) return `Fastify is reachable, but sign-in could not complete (${error}). Open Service status and check the backend logs.`;
  return "Sign-in could not complete. Open Service status and try again.";
}

export function loginThrownErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "BACKEND_UNAVAILABLE") return "Next.js could not reach Fastify during sign-in. Open Service status to check the connection.";
  if (message.startsWith("BACKEND_AUTH_FAILED_")) return "Fastify is reachable, but its login endpoint returned an error. Open Service status and check the backend logs.";
  return message || "Unable to sign in. Open Service status and try again.";
}
