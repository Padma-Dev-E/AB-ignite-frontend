import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants.js";
import { BUILD_BASE_PATH_TOKEN, getRuntimeAppUrl } from "./docker/runtime-url.mjs";

/** @returns {import('next').NextConfig} */
export default function nextConfig(phase) {
  // Next normally compiles basePath into its browser bundles. Build with a
  // neutral token, then docker/start.mjs replaces it from runtime APP_URL.
  const basePath = phase === PHASE_PRODUCTION_BUILD
    ? BUILD_BASE_PATH_TOKEN
    : getRuntimeAppUrl().basePath;
  return {
    basePath,
    env: { NEXT_PUBLIC_BASE_PATH: basePath },
    outputFileTracingRoot: process.cwd(),
    // A production build must never overwrite a running dev server's assets.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
