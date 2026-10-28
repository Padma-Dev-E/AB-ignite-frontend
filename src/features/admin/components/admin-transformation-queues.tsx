"use client";

import { useSession } from "next-auth/react";
import { useMemo, useState, type FormEvent } from "react";
import { useAdminEvaluation, useAdminGovernanceDecision, useAdminScreeningPages, useAdminTransformationPages } from "../hooks";
import type { GovernanceAction } from "../api";
import type { AdminIdea } from "../types";
import { AdminActionDialog, AdminDrawer, AdminPagination } from "./admin-data-ui";
import { AdminIdeaFullDetail } from "./admin-evaluation";

type QueueKind = "screening" | "transformation";
type QueueIdea = AdminIdea & { assignedUserId?: number | null; dueAt?: string | null; problem?: string | null; solution?: string | null; benefits?: string | null; risks?: string | null };
type PendingDecision = { idea: QueueIdea; action: GovernanceAction; label: string };
const decisions: Record<string, Array<[GovernanceAction, string]>> = {
  screening: [["accept", "Accept for AI owner matching"], ["return", "Send back"], ["reject", "Reject"]],
  decision: [["confirm", "Confirm and accept"]], poc: [["start_implementation", "Start implementation"]], implementation: [["mark_implemented", "Mark impact delivered"]],
};
function human(value: string) { return value === "implemented" ? "Transformed" : value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase()); }
function errorText(error: unknown) { return error instanceof Error && error.message ? error.message : "The queue could not be loaded."; }
function SearchFilters({ search, setSearch, status, setStatus, priority, setPriority, statuses }: { search: string; setSearch: (v: string) => void; status: string; setStatus: (v: string) => void; priority: string; setPriority: (v: string) => void; statuses: string[] }) {
  return <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_180px_180px]"><label className="text-xs font-medium text-muted">Search<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Title, reference, author…" className="input mt-1" /></label><label className="text-xs font-medium text-muted">Status<select className="input mt-1" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{statuses.map(s => <option key={s} value={s}>{human(s)}</option>)}</select></label><label className="text-xs font-medium text-muted">Priority<select className="input mt-1" value={priority} onChange={e => setPriority(e.target.value)}><option value="">All priorities</option>{["high", "medium", "low", "unscored"].map(p => <option key={p} value={p}>{human(p)}</option>)}</select></label></div>;
}
export function AdminQueueTable({ kind, statuses, title, detail, empty }: { kind: QueueKind; statuses?: string[]; title: string; detail: string; empty: string }) {
  const { data: session } = useSession();
  const canReview = session?.user?.role === "admin" || session?.user?.role === "maintainer";
  const screening = useAdminScreeningPages(kind === "screening");
  const transformation = useAdminTransformationPages(kind === "transformation");
  const query = kind === "screening" ? screening : transformation;
  const mutation = useAdminGovernanceDecision();
  const [pending, setPending] = useState<PendingDecision | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fullDetail = useAdminEvaluation(pending?.idea.id ?? null);
  const [success, setSuccess] = useState("");
  const [requestedPage, setPage] = useState(0); const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [priority, setPriority] = useState("");
  const loaded = (query.data?.pages.flatMap(page => page.items) ?? []) as QueueIdea[];
  const availableStatuses = Array.from(new Set(loaded.map(item => item.status))).sort();
  const matching = useMemo(() => loaded.filter(idea => (!statuses || statuses.includes(idea.status)) && (!status || idea.status === status) && (!priority || (priority === "unscored" ? !idea.priorityBand : idea.priorityBand?.toLowerCase() === priority)) && (!search || `${idea.reference} ${idea.title} ${idea.authorName} ${idea.department}`.toLowerCase().includes(search.toLowerCase()))), [loaded, statuses, status, priority, search]);
  const page = Math.min(requestedPage, Math.max(0, Math.ceil(matching.length / 10) - 1)); const visible = matching.slice(page * 10, page * 10 + 10);
  const total = query.data?.pages[0]?.total ?? matching.length;
  const allActions = pending ? decisions[pending.idea.status] ?? [] : [];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!pending) return;
    try { await mutation.mutateAsync({ ideaId: pending.idea.id, action: pending.action }); setSuccess(`${pending.label} decision saved for ${pending.idea.reference}.`); setConfirmOpen(false); setPending(null); }
    catch { /* Mutation error is shown in the drawer. */ }
  }
  return <section aria-label={title} className="min-w-0">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm text-muted">{detail}</p></div><span className="rounded-lg border border-[var(--line)] bg-white px-3 py-1 text-sm font-medium">{query.isPending ? "…" : `${total} total`}</span></div>
    {success && <p role="status" className="mb-3 rounded-lg border border-teal/40 bg-teal/5 p-3 text-sm">{success}</p>}
    <SearchFilters {...{ search, setSearch, status, setStatus, priority, setPriority }} statuses={availableStatuses} />
    {query.isPending ? <div role="status" aria-busy="true" className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm text-muted">Loading {title.toLowerCase()}…</div> : query.isError && !query.data ? <div role="alert" className="rounded-lg border border-pink/40 bg-white p-5 text-sm"><p>{errorText(query.error)}</p><button className="btn btn-small mt-3" type="button" onClick={() => void query.refetch()}>Try again</button></div> : <>
      {visible.length ? <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white"><table className="w-full min-w-[960px] border-collapse text-left text-sm"><thead className="bg-[#f8faff] text-xs text-muted"><tr>{["Reference", "Idea", "Author", "AI validation", "Priority", "Status", "Action"].map(label => <th key={label} scope="col" className="border-b border-[var(--line)] px-3 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{visible.map(idea => <tr key={idea.id} className="align-top [&:not(:last-child)]:border-b [&:not(:last-child)]:border-[var(--line)]"><td className="whitespace-nowrap px-3 py-4 font-medium">{idea.reference}</td><td className="min-w-[240px] px-3 py-4"><button type="button" className="text-left font-medium hover:underline" onClick={() => { mutation.reset(); setSuccess(""); setPending({ idea, action: (decisions[idea.status] ?? [])[0]?.[0] ?? "return", label: (decisions[idea.status] ?? [])[0]?.[1] ?? "Review" }); }}>{idea.title}</button><span className="mt-0.5 block text-xs text-muted">{human(idea.category)}</span></td><td className="px-3 py-4">{idea.authorName}<span className="block text-xs text-muted">{idea.department}</span></td><td className="px-3 py-4"><span>{idea.aiValidationScore == null ? "—" : `${idea.aiValidationScore.toFixed(1)} / 10`}</span>{idea.submittedWithLowAiScore && <span className="mt-1 block"><span className="pill text-sand border-sand/40">Human review</span></span>}</td><td className="px-3 py-4 text-muted">{idea.priorityScore == null ? "Not scored" : `${idea.priorityScore.toFixed(2)} / 3 · ${idea.priorityBand ? human(idea.priorityBand) : "Unbanded"}`}</td><td className="px-3 py-4"><span className={`pill whitespace-nowrap ${idea.status === "implemented" ? "text-teal" : ["rejected", "deferred"].includes(idea.status) ? "text-muted" : "text-blue"}`}>{human(idea.status)}</span></td><td className="px-3 py-4"><button type="button" className="btn btn-small whitespace-nowrap" onClick={() => { mutation.reset(); setPending({ idea, action: (decisions[idea.status] ?? [])[0]?.[0] ?? "return", label: (decisions[idea.status] ?? [])[0]?.[1] ?? "Review" }); }}>View details</button></td></tr>)}</tbody></table></div> : <p className="rounded-lg border border-[var(--line)] py-5 text-center text-sm text-muted">{matching.length ? empty : search || status || priority ? "No ideas match these filters." : empty}</p>}
      {matching.length > 10 && <div className="mt-4"><AdminPagination page={page + 1} pageSize={10} total={matching.length} onPageChange={p => setPage(p - 1)} label={title} /> </div>}
      {query.isFetchingNextPage && <p role="status" className="mt-3 text-sm text-muted">Loading more ideas…</p>}
      {query.hasNextPage && <button type="button" className="btn btn-small mt-3" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{query.isFetchingNextPage ? "Loading…" : "Load more ideas"}</button>}
      {query.error && <p role="alert" className="mt-3 text-sm text-pink">{errorText(query.error)} <button type="button" className="underline" onClick={() => void query.refetch()}>Retry</button></p>}
    </>}
    <AdminDrawer open={!!pending} onClose={() => { if (!mutation.isPending && !confirmOpen) setPending(null); }} title={pending?.idea.title ?? "Idea details"} description={pending ? `${pending.idea.reference} · ${human(pending.idea.status)}` : undefined} width="idea" headerActions={pending && canReview ? allActions.map(([action, label]) => <button key={action} type="button" className={action === "accept" ? "btn-primary btn-small" : "btn btn-small"} disabled={mutation.isPending} onClick={() => { setPending({ ...pending, action, label }); mutation.reset(); setConfirmOpen(true); }}>{label}</button>) : undefined}>
      {pending && <div className="space-y-4">{pending.idea.status === "screening" && <p className="rounded-xl border border-blue/20 bg-blue/5 p-4 text-sm text-muted">Accepting starts AI-assisted business-owner matching. If the match needs review, this idea appears in Owner assignment for a manual selection.</p>}{pending.idea.status === "decision" && <p className="rounded-xl border border-teal/30 bg-teal/5 p-4 text-sm text-muted">Business owner approval is complete. Confirm acceptance to move this idea into proof of concept.</p>}{fullDetail.isPending ? <div role="status" aria-busy="true" className="rounded-xl border border-[var(--line)] p-4 text-sm text-muted">Loading full idea details…</div> : fullDetail.isError ? <div role="alert" className="rounded-xl border border-pink/40 p-4 text-sm"><p>Full idea details could not be loaded: {errorText(fullDetail.error)}</p><button type="button" className="btn btn-small mt-3" onClick={() => void fullDetail.refetch()}>Try again</button></div> : fullDetail.data ? <AdminIdeaFullDetail detail={fullDetail.data} /> : <p className="text-sm text-muted">Full idea details are unavailable.</p>}</div>}
    </AdminDrawer>
    <AdminActionDialog open={confirmOpen && Boolean(pending) && canReview} onClose={() => { if (!mutation.isPending) setConfirmOpen(false); }} title={pending?.label ?? "Confirm idea action"} description={pending ? `Confirm this action for ${pending.idea.reference}. The resulting status change will be recorded automatically.` : undefined}>
      {mutation.isError && <p role="alert" className="text-sm text-pink">{errorText(mutation.error)}</p>}
      <form id="governance-decision-form" onSubmit={event => void submit(event)} className="flex justify-end gap-2"><button type="button" className="btn" disabled={mutation.isPending} onClick={() => setConfirmOpen(false)}>Cancel</button><button type="submit" className="btn-primary" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : pending?.action === "accept" ? "Accept and start matching" : "Confirm decision"}</button></form>
    </AdminActionDialog>
  </section>;
}
