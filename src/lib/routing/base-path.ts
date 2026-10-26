const BASE_PATH_SEGMENT = /^[A-Za-z0-9._~-]+$/;

export function normalizeBasePath(value: string | undefined | null): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "/") return "";

  const segments = trimmed.split("/").filter(Boolean);
  if (!segments.length || segments.some((segment) => !BASE_PATH_SEGMENT.test(segment) || segment === "." || segment === "..")) {
    throw new Error("NEXT_PUBLIC_BASE_PATH must contain only URL path segments, without a query or fragment.");
  }
  return `/${segments.join("/")}`;
}

export const appBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);
export const authBasePath = withBasePath("/api/auth", appBasePath);

export function withBasePath(path: string, basePath = appBasePath): string {
  if (!path.startsWith("/") || path.startsWith("//") || !basePath) return path;
  if (path === basePath || path.startsWith(`${basePath}/`)) return path;
  return `${basePath}${path}`;
}

export function stripBasePath(pathname: string, basePath = appBasePath): string {
  if (!basePath) return pathname;
  if (pathname === basePath) return "/";
  if (pathname.startsWith(`${basePath}/`)) return pathname.slice(basePath.length) || "/";
  return pathname;
}
