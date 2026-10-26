import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig, canAccessAdminWorkspace, forcedPasswordChangePathAllowed, postLoginPath } from "./src/auth/config";
import { stripSessionCookie } from "./src/auth/session-cookies";
import { appBasePath, stripBasePath, withBasePath } from "./src/lib/routing/base-path";

const { auth } = NextAuth(authConfig);

const authorizeRequest = auth((request) => {
  const basePath = request.nextUrl.basePath || appBasePath;
  const pathname = stripBasePath(request.nextUrl.pathname, basePath);
  const redirectTo = (path: string) => NextResponse.redirect(new URL(withBasePath(path, basePath), request.url));
  const session = request.auth;
  const retiredDemoSession = Boolean(session?.user?.email?.endsWith("@demo.abignite.invalid"));

  if (session?.isValid === false || retiredDemoSession) {
    if (pathname.startsWith("/api/auth/")) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Authentication required." } }, { status: 401 });
    }
    if (pathname !== "/login") return redirectTo("/login");
  }

  if (pathname === "/") {
    const destination = session?.user?.mustChangePassword
      ? "/change-password"
      : session?.user ? postLoginPath(session.user.role) : "/login";
    return redirectTo(destination);
  }

  if (pathname === "/change-password") {
    if (!session?.user) return redirectTo("/login");
    if (!session.user.mustChangePassword) {
      return redirectTo(postLoginPath(session.user.role));
    }
  }

  if (session?.isValid !== false && session?.user?.mustChangePassword && !forcedPasswordChangePathAllowed(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: { code: "PASSWORD_CHANGE_REQUIRED", message: "Change your password before continuing." } }, { status: 403 });
    }
    return redirectTo("/change-password");
  }

  const authenticatedLogin = pathname === "/login" && Boolean(session?.user && session.isValid !== false && !retiredDemoSession);
  if (authenticatedLogin && session?.user) {
    return redirectTo(
      session.user.mustChangePassword ? "/change-password" : postLoginPath(session.user.role),
    );
  }

  if (pathname.startsWith("/private") && !session?.user) {
    return redirectTo("/login");
  }

  if (pathname.startsWith("/admin")) {
    if (!session?.user) return redirectTo("/login");
    if (!canAccessAdminWorkspace(session.user.role)) return redirectTo("/private");
  }

  if (pathname.startsWith("/private/admin") && !canAccessAdminWorkspace(session?.user?.role)) {
    return redirectTo("/private");
  }

  return NextResponse.next();
});

export default async function middleware(...args: Parameters<typeof authorizeRequest>) {
  const response = (await authorizeRequest(...args)) ?? NextResponse.next();
  // Auth.js re-signs the request's JWT on every middleware hit. A response that
  // finishes after /api/auth/refresh can otherwise replace its newly rotated JWT.
  return stripSessionCookie(response);
}

export const config = {
  // API requests are authorized by their owning handler: Fastify for APIs and
  // Auth.js for its sign-in/session/CSRF/sign-out protocol.
  // Keep page protection and redirects unchanged.
  matcher: ["/", "/login", "/change-password", "/private/:path*", "/admin/:path*"],
};
