import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

function normalizeBasePath(value = "") {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "";
  const segments = trimmed.split("/").filter(Boolean);
  if (segments.some((segment) => !/^[A-Za-z0-9._~-]+$/.test(segment) || segment === "." || segment === "..")) {
    throw new Error("The path portion of APP_URL must contain only URL path segments.");
  }
  return `/${segments.join("/")}`;
}

function configuredAppUrl() {
  const value = process.env.APP_URL?.trim();
  if (!value) throw new Error("APP_URL must be an absolute URL, for example http://localhost:3100 or https://company.com/ab-ignite.");
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("APP_URL must be an absolute URL, for example http://localhost:3100 or https://company.com/ab-ignite.");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("APP_URL must use http or https and must not contain credentials, a query, or a fragment.");
  }
  return url;
}

/** @returns {import('next').NextConfig} */
export default function nextConfig(phase) {
  const appUrl = configuredAppUrl();
  const basePath = normalizeBasePath(appUrl.pathname);
  // The same derived prefix is used by browser-side route helpers and Next.js assets.
  process.env.NEXT_PUBLIC_BASE_PATH = basePath;
  return {
    basePath,
    env: { NEXT_PUBLIC_BASE_PATH: basePath },
    outputFileTracingRoot: process.cwd(),
    // A production build must never overwrite a running dev server's assets.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
