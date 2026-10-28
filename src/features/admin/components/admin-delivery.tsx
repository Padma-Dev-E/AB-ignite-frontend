"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminQueryKeys, listAdminDelivery } from "../api";
import { useAdminEvaluation } from "../hooks";
import type { AdminIdea } from "../types";
import { AdminDrawer, AdminPagination } from "./admin-data-ui";
import { AdminIdeaFullDetail } from "./admin-evaluation";

function date(value: string | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
}

export function AdminDelivery() {
  const [cursors, setCursors] = useState<(number | null)[]>([null]);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState<AdminIdea | null>(null);
  const query = useQuery({
    queryKey: [...adminQueryKeys.delivery, cursors[page]],
    queryFn: () => listAdminDelivery(cursors[page]),
  });
  const detailQuery = useAdminEvaluation(detail?.id ?? null);

  const filtered = (query.data?.items ?? []).filter(idea => `${idea.reference} ${idea.title} ${idea.authorName} ${idea.department} ${idea.status}`.toLowerCase().includes(filter.toLowerCase()));
  return <div className="stack">
    <div><h1 className="text-3xl font-semibold tracking-tight">POCs and delivery</h1><p className="mt-2 text-muted">Track accepted ideas through proof of concept, implementation and impact.</p></div>
    {query.isPending ? <p role="status" aria-busy="true" className="rounded-xl border border-[var(--line)] p-5 text-sm">Loading delivery ideas…</p> : query.isError ? <div role="alert" className="rounded-xl border border-pink/40 p-5 text-sm">{query.error instanceof Error ? query.error.message : "Delivery ideas could not be loaded."} <button type="button" className="underline" onClick={() => void query.refetch()}>Retry</button></div> : <>
      <input aria-label="Filter delivery ideas" className="input max-w-sm" placeholder="Filter delivery ideas" value={filter} onChange={event => setFilter(event.target.value)} />
      {filtered.length ? <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-[#f8faff] text-xs text-muted"><tr>{["#", "Reference", "Idea", "Author", "Stage", "Next due", "Details"].map(label => <th key={label} scope="col" className="border-b border-[var(--line)] px-3 py-2 font-medium">{label}</th>)}</tr></thead><tbody>{filtered.map((idea, index) => {
        return <tr key={idea.id} className="border-b border-[var(--line)] last:border-0"><td className="px-3 py-2">{page * 10 + index + 1}</td><td className="px-3 py-2 font-medium">{idea.reference}</td><td className="min-w-[220px] px-3 py-2"><button type="button" className="text-left font-medium text-blue" onClick={() => setDetail(idea)}>{idea.title}</button><span className="block text-xs text-muted">{idea.category}</span></td><td className="px-3 py-2">{idea.authorName}<span className="block text-xs text-muted">{idea.department}</span></td><td className="px-3 py-2 capitalize">{idea.status.replaceAll("_", " ")}</td><td className="whitespace-nowrap px-3 py-2">{date((idea as AdminIdea & { dueAt?: string }).dueAt)}</td><td className="px-3 py-2"><button type="button" className="btn btn-small" onClick={() => setDetail(idea)}>View details</button></td></tr>;
      })}</tbody></table></div> : <p className="rounded-xl border border-[var(--line)] p-5 text-sm text-muted">No ideas have entered delivery yet.</p>}
      <AdminPagination page={page + 1} pageSize={10} total={(page + 1) * 10 + (query.data?.nextAfter == null ? 0 : 1)} busy={query.isFetching} label="Delivery ideas" onPageChange={number => { if (number === page + 2 && query.data?.nextAfter != null) { const after = query.data.nextAfter; setCursors(current => [...current.slice(0, page + 1), after]); setPage(number - 1); } else if (number === page) setPage(number - 1); }} />
    </>}
    <AdminDrawer open={detail !== null} onClose={() => setDetail(null)} title={detail?.title ?? "Delivery idea"} description={detail ? `${detail.reference} · ${detail.status.replaceAll("_", " ")}` : undefined}>
      {detailQuery.isPending ? <div role="status" aria-busy="true" className="p-5 text-sm text-muted">Loading full idea details…</div>
        : detailQuery.isError ? <div role="alert" className="rounded-xl border border-pink/40 p-4 text-sm"><p>Full idea details could not be loaded: {detailQuery.error instanceof Error ? detailQuery.error.message : "Request failed."}</p><button type="button" className="btn btn-small mt-3" onClick={() => void detailQuery.refetch()}>Try again</button></div>
          : detailQuery.data ? <AdminIdeaFullDetail detail={detailQuery.data} /> : null}
    </AdminDrawer>
  </div>;
}
