import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { encode } from "next-auth/jwt";
import { accessTokenTtlSeconds, authConfig, authSecret, refreshTokenTtlSeconds, SESSION_COOKIE_NAME } from "./src/auth/config";
import { stripSessionCookie } from "./src/auth/session-cookies";

const apiUrl = (process.env.API_INTERNAL_URL ?? "http://api:4100").replace(/\/$/, "");
const apiToken = process.env.INTERNAL_API_TOKEN ?? "";

async function internalApi(path: string, init: RequestInit = {}) {
  if (apiToken.length < 32) throw new Error("Internal API authentication is not configured.");
  return fetch(`${apiUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "x-internal-api-token": apiToken, ...init.headers },
  });
}

const nextAuth = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const response = await internalApi("/internal/auth/credentials", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: credentials?.email, password: credentials?.password }),
        });
        if (!response.ok) return null;
        const result = await response.json() as { user?: Record<string, unknown> };
        const user = result.user;
        if (!user || typeof user.id !== "string" || typeof user.role !== "string") return null;
        return user as never;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: refreshTokenTtlSeconds },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        token.mustChangePassword = user.mustChangePassword;
        token.sessionId = user.sessionId;
        token.sessionVersion = user.sessionVersion;
        token.accessTokenExpires = Date.now() + accessTokenTtlSeconds * 1000;
      }

      if (token.sub && token.sessionId && !token.sessionRevoked) {
        try {
          const sessionCookie = await encode({ secret: authSecret, salt: SESSION_COOKIE_NAME, maxAge: refreshTokenTtlSeconds, token });
          const response = await internalApi("/internal/auth/session", {
            headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionCookie)}` },
          });
          if (!response.ok) throw new Error("Session validation failed.");
          const result = await response.json() as { user?: Record<string, unknown> };
          const current = result.user;
          if (!current || String(current.id ?? current.userId) !== String(token.sub)) throw new Error("Session validation failed.");
          token.role = current.role as typeof token.role;
          token.name = current.name as typeof token.name;
          token.email = current.email as typeof token.email;
          token.mustChangePassword = current.mustChangePassword === true;
          token.sessionVersion = current.sessionVersion as typeof token.sessionVersion;
          token.sessionRevoked = false;
        } catch {
          token.sessionRevoked = true;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.role) session.user.role = token.role;
      if (token.sessionId) session.user.sessionId = token.sessionId;
      session.user.mustChangePassword = token.mustChangePassword === true;
      session.accessTokenExpires = token.accessTokenExpires;
      session.isValid = token.sessionRevoked !== true;
      return session;
    },
  },
});

export const { auth, signIn, signOut } = nextAuth;

// SessionProvider refetches /api/auth/session on focus. Auth.js reissues the
// request JWT there too, so a delayed response could undo a refresh rotation.
const { GET, POST } = nextAuth.handlers;
export const handlers = {
  GET: async (...args: Parameters<typeof GET>) => {
    const response = await GET(...args);
    return args[0].nextUrl.pathname === "/api/auth/session" ? stripSessionCookie(response) : response;
  },
  POST: async (...args: Parameters<typeof POST>) => {
    const response = await POST(...args);
    return args[0].nextUrl.pathname === "/api/auth/session" ? stripSessionCookie(response) : response;
  },
};
