import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @returns {import('next').NextConfig} */
export default function nextConfig(phase) {
  return {
    // Keep one environment-independent image. Public origin is runtime config;
    // the app is mounted at the root path in the container.
    basePath: "",
    env: { NEXT_PUBLIC_BASE_PATH: "" },
    outputFileTracingRoot: process.cwd(),
    // A production build must never overwrite a running dev server's assets.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
