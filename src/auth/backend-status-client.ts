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
