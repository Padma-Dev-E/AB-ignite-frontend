"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SectionHeading } from "../../../components/ui";
import { listAdminAiRuns } from "../api";
import type { AdminAiRun } from "../types";
import { AdminDrawer } from "./admin-data-ui";
import { AdminAiDiagnosticsPanel } from "./admin-evaluation";

function dateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "AI activity could not be loaded.";
}

function statusStyle(status: string) {
  if (status === "succeeded") return "border-teal/40 bg-teal/5 text-teal";
  if (status === "failed" || status === "timed_out" || status === "cancelled") return "border-pink/40 bg-pink/5 text-pink";
  if (status === "running") return "border-blue/40 bg-blue/5 text-blue";
  return "border-sand/40 bg-sand/5 text-sand";
}

export function AdminAiActivity() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<AdminAiRun | null>(null);
  const query = useQuery({
    queryKey: ["admin", "ai-runs"],
    queryFn: listAdminAiRuns,
    refetchInterval: (state) => state.state.data?.some((run) => run.status === "queued" || run.status === "running") ? 3_000 : 15_000,
  });
  const runs = query.data ?? [];
  const visibleRuns = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return runs.filter((run) => {
      if (statusFilter !== "all" && run.status !== statusFilter) return false;
      if (!needle) return true;
      return [run.id, run.ideaId, run.jobKey, run.status, run.errorCode ?? ""]
        .some((value) => String(value).toLocaleLowerCase().includes(needle));
    });
  }, [runs, search, statusFilter]);

  return <div className="stack">
    <SectionHeading title="AI Activity" detail="Find AI runs for any idea, including drafts, and inspect the captured APIGEE request and response." />
    <section className="app-card space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[220px] flex-1 text-sm"><span className="field-label">Search runs</span><input className="input mt-1 w-full" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Run ID, idea ID, job or error" /></label>
        <label className="min-w-[170px] text-sm"><span className="field-label">Status</span><select className="input mt-1 w-full" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="queued">Queued</option><option value="running">Running</option><option value="succeeded">Succeeded</option><option value="failed">Failed</option><option value="timed_out">Timed out</option><option value="cancelled">Cancelled</option></select></label>
        <button className="btn" type="button" disabled={query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? "Refreshing…" : "Refresh"}</button>
      </div>
      <p className="text-xs text-muted">Showing the latest {runs.length} runs. Active runs refresh automatically.</p>
      {query.isPending ? <p className="rounded-xl border p-4 text-sm text-muted" style={{ borderColor: "var(--line)" }} role="status" aria-busy="true">Loading AI activity…</p> : query.isError && !query.data ? <div className="rounded-xl border border-pink/40 p-4" role="alert"><p className="text-sm">{errorMessage(query.error)}</p><button className="btn btn-small mt-3" type="button" onClick={() => void query.refetch()}>Try again</button></div> : query.data?.length === 0 ? <p className="rounded-xl border p-4 text-sm text-muted" style={{ borderColor: "var(--line)" }}>No AI runs have been recorded.</p> : visibleRuns.length === 0 ? <p className="rounded-xl border p-4 text-sm text-muted" style={{ borderColor: "var(--line)" }}>No runs match these filters.</p> : <div className="max-w-full overflow-x-auto rounded-xl border" style={{ borderColor: "var(--line)" }}><table className="w-full min-w-[850px] border-collapse text-left text-sm"><thead className="bg-[var(--hover)] text-xs uppercase tracking-wide text-muted"><tr>{["Run", "Idea", "AI action", "Status", "Attempt", "Started", ""].map((label, index) => <th key={label || index} scope="col" className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y" style={{ borderColor: "var(--line)" }}>{visibleRuns.map((run) => <tr key={run.id} className="hover:bg-[var(--hover)]"><td className="px-4 py-3 font-mono text-xs">#{run.id}</td><td className="px-4 py-3">Idea #{run.ideaId}</td><td className="px-4 py-3"><span className="font-medium">{run.jobKey}</span><span className="mt-0.5 block text-xs text-muted">v{run.jobVersion} · {run.model}</span>{run.errorCode && <span className="mt-1 block text-xs text-pink">{run.errorCode}</span>}</td><td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusStyle(run.status)}`}>{run.status.replaceAll("_", " ")}</span></td><td className="px-4 py-3">{run.attemptCount}</td><td className="px-4 py-3 whitespace-nowrap text-xs">{dateTime(run.startedAt ?? run.createdAt)}</td><td className="px-4 py-3 text-right"><button className="btn btn-small" type="button" onClick={() => setSelected(run)}>View diagnostics</button></td></tr>)}</tbody></table></div>}
      {query.isError && query.data && <p className="text-sm text-pink" role="alert">Refresh failed: {errorMessage(query.error)}</p>}
    </section>
    <AdminDrawer open={selected !== null} onClose={() => setSelected(null)} title={selected ? `AI run #${selected.id}` : "AI run diagnostics"} description={selected ? `Idea #${selected.ideaId} · ${selected.jobKey} · ${selected.status.replaceAll("_", " ")} · attempt ${selected.attemptCount}` : undefined}>
      {selected && <div className="space-y-4"><dl className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border p-3" style={{ borderColor: "var(--line)" }}><dt className="text-xs text-muted">Model</dt><dd className="mt-1 text-sm">{selected.model}</dd></div><div className="rounded-xl border p-3" style={{ borderColor: "var(--line)" }}><dt className="text-xs text-muted">Started</dt><dd className="mt-1 text-sm">{dateTime(selected.startedAt)}</dd></div>{selected.errorCode && <div className="rounded-xl border border-pink/40 p-3 sm:col-span-2"><dt className="text-xs text-pink">Last error code</dt><dd className="mt-1 text-sm text-pink">{selected.errorCode}</dd></div>}</dl><AdminAiDiagnosticsPanel ideaId={selected.ideaId} runId={selected.id} /></div>}
    </AdminDrawer>
  </div>;
}
