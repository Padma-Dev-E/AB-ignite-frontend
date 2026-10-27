"use client";

import { useEffect, useState } from "react";
import { withBasePath } from "../../lib/routing/base-path";

type CheckState = "ready" | "unhealthy" | "unreachable" | "misconfigured" | "unknown";
type Status = {
  requestId: string;
  checkedAt: string;
  latencyMs: number | null;
  fastify: CheckState;
  frontendAuth: CheckState;
  ready: boolean;
};

const labels: Record<CheckState, string> = {
  ready: "Connected and ready",
  unhealthy: "Responding, but unhealthy",
  unreachable: "Cannot connect",
  misconfigured: "Configuration needed",
  unknown: "Not checked",
};

function statusTone(state: CheckState) {
  if (state === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (state === "unreachable" || state === "misconfigured" || state === "unhealthy") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function BackendStatusPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    let inFlight = false;
    const check = async () => {
      if (inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      try {
        const response = await fetch(withBasePath("/api/system-status"), { cache: "no-store", signal: AbortSignal.timeout(5000) });
        const value = await response.json() as Status;
        if (active) setStatus(value);
      } catch {
        if (active) setStatus({ requestId: "", checkedAt: new Date().toISOString(), latencyMs: null, fastify: "unreachable", frontendAuth: "unknown", ready: false });
      } finally {
        inFlight = false;
        if (active) setChecking(false);
      }
    };
    void check();
    const timer = window.setInterval(() => void check(), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const row = (title: string, state: CheckState, detail: string) => <div className="flex flex-col gap-3 border-b border-slate-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
    <div><h2 className="font-medium text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{detail}</p></div>
    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-medium ${statusTone(state)}`}>{labels[state]}</span>
  </div>;

  return <main className="min-h-screen bg-[#f4f7fb] px-4 py-10 text-[#172b45] sm:px-8">
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1762a7]">AB Ignite · diagnostics</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Service status</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">This page checks the connection from the Next.js server to Fastify every five seconds. It works without signing in.</p>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white px-5 shadow-[0_10px_30px_rgba(27,55,88,0.06)] sm:px-7" aria-live="polite" aria-busy={checking}>
        {row("Fastify API", status?.fastify ?? "unknown", status?.latencyMs === null || status?.latencyMs === undefined ? "Readiness ping and response time" : `Readiness ping · ${status.latencyMs} ms`)}
        {row("Login configuration handshake", status?.frontendAuth ?? "unknown", "Checks the internal token, shared session secret, and cookie name without exposing their values")}
        <p className="py-4 text-xs text-slate-500">{status ? `Last checked ${new Date(status.checkedAt).toLocaleTimeString()}. Updates every 5 seconds.` : "Checking services…"}</p>
      </section>
      {status?.fastify === "unreachable" && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">Next.js cannot connect to Fastify. Verify API_INTERNAL_URL points to the backend Kubernetes Service and that network policy permits TCP port 4100.</p>}
      {status?.frontendAuth === "misconfigured" && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">Fastify is reachable, but the login configuration does not match. Check INTERNAL_API_TOKEN, AUTH_SECRET, and AUTH_SESSION_COOKIE_NAME in both services.</p>}
      {status?.fastify === "unhealthy" && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">Fastify answered, but its readiness check failed. Check backend logs and database readiness.</p>}
      <a href={withBasePath("/login")} className="mt-6 inline-flex text-sm font-medium text-[#1762a7] underline underline-offset-4">Return to sign in</a>
    </div>
  </main>;
}
