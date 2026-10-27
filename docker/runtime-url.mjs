export const BUILD_BASE_PATH_TOKEN = "/__AB_IGNITE_RUNTIME_BASE_PATH__";

const BASE_PATH_SEGMENT = /^[A-Za-z0-9._~-]+$/;

export function getRuntimeAppUrl(value = process.env.APP_URL) {
  if (!value?.trim()) {
    throw new Error("APP_URL must be set at container runtime to the public frontend URL.");
  }

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("APP_URL must be an absolute http or https URL.");
  }

  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("APP_URL must use http or https and must not contain credentials, a query, or a fragment.");
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.some((segment) => !BASE_PATH_SEGMENT.test(segment) || segment === "." || segment === "..")) {
    throw new Error("APP_URL path segments may contain only letters, numbers, dots, underscores, tildes, and hyphens.");
  }

  return { origin: url.origin, basePath: segments.length ? `/${segments.join("/")}` : "" };
}
