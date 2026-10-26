"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { adminQueryKeys, listAdminDelivery, type GovernanceAction } from "../api";
import { useAdminEvaluation, useAdminGovernanceDecision } from "../hooks";
import type { AdminIdea } from "../types";
import { AdminDrawer, AdminPagination } from "./admin-data-ui";
import { AdminIdeaFullDetail } from "./admin-evaluation";

type PendingDecision = { idea: AdminIdea; action: GovernanceAction; label: string };

function date(value: string | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
}

export function AdminDelivery() {
  const { data: session } = useSession();
  const canManage = session?.user?.role === "back_office";
  const client = useQueryClient();
  const [cursors, setCursors] = useState<(number | null)[]>([null]);
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState<PendingDecision | null>(null);
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState<AdminIdea | null>(null);
  const query = useQuery({
    queryKey: [...adminQueryKeys.delivery, cursors[page]],
    queryFn: () => listAdminDelivery(cursors[page]),
  });
  const detailQuery = useAdminEvaluation(detail?.id ?? null);
  const decision = useAdminGovernanceDecision();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending || !canManage) return;
    try {
      await decision.mutateAsync({ ideaId: pending.idea.id, action: pending.action });
      setSuccess(`${pending.label} recorded for ${pending.idea.reference}.`);
      setPending(null);
      await client.invalidateQueries({ queryKey: adminQueryKeys.delivery });
    } catch { /* The dialog displays the error. */ }
  }

  const filtered = (query.data?.items ?? []).filter(idea => `${idea.reference} ${idea.title} ${idea.authorName} ${idea.department} ${idea.status}`.toLowerCase().includes(filter.toLowerCase()));
  return <div className="stack">
    <div><h1 className="text-3xl font-semibold tracking-tight">POCs and delivery</h1><p className="mt-2 text-muted">Track accepted ideas through proof of concept, implementation and impact.</p></div>
    {success && <p role="status" className="rounded-xl border border-teal/40 bg-teal/5 p-3 text-sm">{success}</p>}
    {query.isPending ? <p role="status" aria-busy="true" className="rounded-xl border border-[var(--line)] p-5 text-sm">Loading delivery ideas…</p> : query.isError ? <div role="alert" className="rounded-xl border border-pink/40 p-5 text-sm">{query.error instanceof Error ? query.error.message : "Delivery ideas could not be loaded."} <button type="button" className="underline" onClick={() => void query.refetch()}>Retry</button></div> : <>
      <input aria-label="Filter delivery ideas" className="input max-w-sm" placeholder="Filter delivery ideas" value={filter} onChange={event => setFilter(event.target.value)} />
      {filtered.length ? <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-[#f8faff] text-xs text-muted"><tr>{["#", "Reference", "Idea", "Author", "Stage", "Next due", "Action"].map(label => <th key={label} scope="col" className="border-b border-[var(--line)] px-3 py-2 font-medium">{label}</th>)}</tr></thead><tbody>{filtered.map((idea, index) => {
        const next = idea.status === "poc" ? { action: "start_implementation" as const, label: "Start implementation" } : idea.status === "implementation" ? { action: "mark_implemented" as const, label: "Mark impact delivered" } : null;
        return <tr key={idea.id} className="border-b border-[var(--line)] last:border-0"><td className="px-3 py-2">{page * 10 + index + 1}</td><td className="px-3 py-2 font-medium">{idea.reference}</td><td className="min-w-[220px] px-3 py-2"><button type="button" className="text-left font-medium text-blue" onClick={() => setDetail(idea)}>{idea.title}</button><span className="block text-xs text-muted">{idea.category}</span></td><td className="px-3 py-2">{idea.authorName}<span className="block text-xs text-muted">{idea.department}</span></td><td className="px-3 py-2 capitalize">{idea.status.replaceAll("_", " ")}</td><td className="whitespace-nowrap px-3 py-2">{date((idea as AdminIdea & { dueAt?: string }).dueAt)}</td><td className="px-3 py-2">{canManage && next ? <button type="button" className="btn btn-small whitespace-nowrap" onClick={() => { decision.reset(); setPending({ idea, ...next }); }}>{next.label}</button> : "—"}</td></tr>;
      })}</tbody></table></div> : <p className="rounded-xl border border-[var(--line)] p-5 text-sm text-muted">No ideas have entered delivery yet.</p>}
      <AdminPagination page={page + 1} pageSize={10} total={(page + 1) * 10 + (query.data?.nextAfter == null ? 0 : 1)} busy={query.isFetching} label="Delivery ideas" onPageChange={number => { if (number === page + 2 && query.data?.nextAfter != null) { const after = query.data.nextAfter; setCursors(current => [...current.slice(0, page + 1), after]); setPage(number - 1); } else if (number === page) setPage(number - 1); }} />
    </>}
    <AdminDrawer open={detail !== null} onClose={() => setDetail(null)} title={detail?.title ?? "Delivery idea"} description={detail ? `${detail.reference} · ${detail.status.replaceAll("_", " ")}` : undefined}>
      {detailQuery.isPending ? <div role="status" aria-busy="true" className="p-5 text-sm text-muted">Loading full idea details…</div>
        : detailQuery.isError ? <div role="alert" className="rounded-xl border border-pink/40 p-4 text-sm"><p>Full idea details could not be loaded: {detailQuery.error instanceof Error ? detailQuery.error.message : "Request failed."}</p><button type="button" className="btn btn-small mt-3" onClick={() => void detailQuery.refetch()}>Try again</button></div>
          : detailQuery.data ? <AdminIdeaFullDetail detail={detailQuery.data} /> : null}
    </AdminDrawer>
    <AdminDrawer open={pending !== null} onClose={() => !decision.isPending && setPending(null)} title={`${pending?.label ?? "Decision"} · ${pending?.idea.reference ?? ""}`} description="The action and resulting status change are recorded automatically." width="narrow" footer={<div className="flex justify-end gap-2"><button type="button" className="btn" disabled={decision.isPending} onClick={() => setPending(null)}>Cancel</button><button type="submit" form="delivery-decision" className="btn-primary" disabled={decision.isPending}>{decision.isPending ? "Saving…" : pending?.label ?? "Confirm"}</button></div>}>
      <form id="delivery-decision" className="space-y-4" onSubmit={event => void submit(event)}>
        {pending && <>
          <section className="rounded-xl border border-[var(--line)] bg-[#f7f9fd] p-4" aria-label="Stage change">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Stage change</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 font-medium capitalize">{pending.action === "start_implementation" ? "Proof of concept" : "Implementation"}</span>
              <span aria-hidden="true" className="text-muted">→</span>
              <span className="rounded-full border border-[#1762a7]/20 bg-[#1762a7]/[.06] px-3 py-1.5 font-semibold text-[#1762a7]">{pending.action === "start_implementation" ? "Implementation" : "Impact delivered"}</span>
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold">{pending.action === "start_implementation" ? "Move this idea into implementation" : "Record delivered impact"}</h2>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              {pending.action === "start_implementation"
                ? "This moves the idea from proof of concept into implementation. Its implementation due date will follow the current workflow settings, and the idea author will be notified."
                : "This marks implementation as complete and moves the idea to the impact delivered stage. The change is recorded in the workflow and the idea author will be notified."}
            </p>
          </section>
          <div className="rounded-lg border border-[var(--line)] px-3.5 py-3 text-sm">
            <p className="font-medium">{pending.idea.title}</p>
            <p className="mt-1 text-xs text-muted">{pending.idea.reference} · {pending.idea.authorName} · {pending.idea.department}</p>
          </div>
        </>}
        {decision.isError && <p role="alert" className="text-sm text-pink">{decision.error instanceof Error ? decision.error.message : "Decision could not be saved."}</p>}
      </form>
    </AdminDrawer>
  </div>;
}
