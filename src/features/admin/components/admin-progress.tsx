"use client";

import { useState } from "react";
import { useAdminBusinessOwnerPages, useAdminEvaluation, useAdminProgressPages, useAssignAdminBusinessOwner } from "../hooks";
import type { AdminIdea, BusinessOwnerOption } from "../types";
import { AdminActionDialog, AdminDrawer } from "./admin-data-ui";
import { AdminIdeaFullDetail } from "./admin-evaluation";

const statusNames: Record<string, string> = {
  owner_matching: "AI matching owner",
  owner_assignment: "Needs owner assignment",
  business_review: "Business owner review",
  control_review: "Control review",
  decision: "Transformation confirmation",
  poc: "Proof of concept",
  implementation: "Implementation",
  implemented: "Implemented",
  returned: "Returned",
  screening: "Screening",
  rejected: "Rejected",
  deferred: "Deferred",
};
const readable = (status: string) => statusNames[status] ?? status.replaceAll("_", " ");
const errorText = (error: unknown) => error instanceof Error ? error.message : "The request could not be completed.";

function OwnerOptions({ owners, value, onChange }: { owners: ReturnType<typeof useAdminBusinessOwnerPages>; value: string; onChange: (value: string) => void }) {
  const options = owners.data?.pages.flatMap(page => page.items) ?? [];
  return <div className="space-y-2">
    {owners.isPending ? <p className="text-sm text-muted" role="status">Loading active business owners…</p> : owners.isError && !owners.data ? <div role="alert" className="text-sm text-pink">Business owners could not be loaded: {errorText(owners.error)} <button className="underline" type="button" onClick={() => void owners.refetch()}>Retry</button></div> : <>
      <label className="block text-sm"><span className="field-label">Business owner</span><select className="input mt-1 w-full" value={value} onChange={event => onChange(event.target.value)}><option value="">Choose an active owner</option>{options.map(owner => <option key={owner.id} value={owner.id}>{owner.name} · {owner.department}</option>)}</select></label>
      {value && <OwnerProfile owner={options.find(owner => owner.id === Number(value))} />}
      {!owners.isPending && !owners.isError && options.length === 0 && <p className="text-sm text-muted" role="status">No active business owners are available. Add or activate an owner before assigning this idea.</p>}
      {owners.isError && <p role="alert" className="text-xs text-pink">The owner list could not be refreshed. <button className="underline" type="button" onClick={() => void owners.refetch()}>Retry</button></p>}
      {owners.hasNextPage && <button type="button" className="btn btn-small" disabled={owners.isFetchingNextPage} onClick={() => void owners.fetchNextPage()}>{owners.isFetchingNextPage ? "Loading…" : "Load more owners"}</button>}
    </>}
  </div>;
}

function OwnerProfile({ owner }: { owner?: BusinessOwnerOption }) {
  if (!owner) return null;
  return <p className="rounded-lg border border-[var(--line)] bg-[var(--hover)] p-3 text-xs text-muted"><span className="font-medium text-[var(--text)]">Matching profile: </span>{owner.businessProfile || "No profile supplied. This owner is available for manual assignment."}</p>;
}

function ProgressPage({ ideas, page, hasNext, busy, onPageChange, search, setSearch, status, setStatus, onSelect }: {
  ideas: AdminIdea[]; page: number; hasNext: boolean; busy: boolean; onPageChange: (page: number) => void;
  search: string; setSearch: (value: string) => void; status: string; setStatus: (value: string) => void;
  onSelect: (idea: AdminIdea) => void;
}) {
  const filtered = ideas.filter(idea => (!status || idea.status === status) && (!search || `${idea.reference} ${idea.title} ${idea.authorName} ${idea.department} ${idea.assignedOwnerName ?? ""}`.toLowerCase().includes(search.toLowerCase())));
  const statuses = Array.from(new Set(ideas.map(idea => idea.status))).sort();
  return <>
    <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(220px,1fr)_220px]"><label className="text-xs font-medium text-muted">Search ideas<input className="input mt-1" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Title, reference, author or owner" /></label><label className="text-xs font-medium text-muted">Status<select className="input mt-1" value={status} onChange={event => setStatus(event.target.value)}><option value="">All progress</option>{statuses.map(item => <option key={item} value={item}>{readable(item)}</option>)}</select></label></div>
    {filtered.length ? <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white"><table className="w-full min-w-[880px] border-collapse text-left text-sm"><thead className="bg-[#f8faff] text-xs text-muted"><tr>{["Reference", "Idea", "Submitted by", "Business owner", "Stage", "Updated", "Details"].map(title => <th key={title} scope="col" className="border-b border-[var(--line)] px-3 py-3 font-medium">{title}</th>)}</tr></thead><tbody>{filtered.map(idea => <tr key={idea.id} className="border-b border-[var(--line)] last:border-0"><td className="whitespace-nowrap px-3 py-3 font-medium">{idea.reference}</td><td className="min-w-[220px] px-3 py-3"><button type="button" className="text-left font-medium text-blue hover:underline" onClick={() => onSelect(idea)}>{idea.title}</button><span className="mt-1 block text-xs text-muted">{idea.category}</span></td><td className="px-3 py-3">{idea.authorName}<span className="block text-xs text-muted">{idea.department}</span></td><td className="px-3 py-3">{idea.assignedUserId ? idea.assignedOwnerName || <span className="text-amber-800">Assigned owner unavailable</span> : <span className="text-amber-800">Unassigned</span>}</td><td className="px-3 py-3"><span className={`pill whitespace-nowrap ${idea.status === "implemented" ? "text-teal" : idea.status === "owner_assignment" ? "text-amber-800" : "text-blue"}`}>{readable(idea.status)}</span></td><td className="whitespace-nowrap px-3 py-3 text-muted">{new Date(idea.updatedAt).toLocaleDateString()}</td><td className="px-3 py-3"><button type="button" className="btn btn-small" onClick={() => onSelect(idea)}>Open</button></td></tr>)}</tbody></table></div> : <p role="status" className="rounded-xl border border-[var(--line)] p-5 text-sm text-muted">{search || status ? "No progress items match these filters on this page." : "No submitted ideas are in progress yet."}</p>}
    <nav aria-label="Idea progress pagination" className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-4"><p className="text-sm text-muted" aria-live="polite">Page {page}{hasNext ? " · more ideas available" : " · end of list"}</p><div className="flex gap-2"><button type="button" className="btn btn-small" disabled={page <= 1 || busy} onClick={() => onPageChange(page - 1)}>Previous</button><button type="button" className="btn btn-small" disabled={!hasNext || busy} onClick={() => onPageChange(page + 1)}>{busy ? "Loading…" : "Next"}</button></div></nav>
  </>;
}

export function AdminProgress() {
  const query = useAdminProgressPages();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<AdminIdea | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [ownerId, setOwnerId] = useState("");
  const [success, setSuccess] = useState("");
  const detail = useAdminEvaluation(selected?.id ?? null);
  const owners = useAdminBusinessOwnerPages(Boolean(selected && (selected.assignedUserId || ["owner_matching", "owner_assignment"].includes(selected.status))));
  const assign = useAssignAdminBusinessOwner();
  const pages = query.data?.pages ?? [];
  const currentPage = pages[page - 1];
  const rows = currentPage?.items ?? [];
  const ownerRows = owners.data?.pages.flatMap(batch => batch.items) ?? [];
  const eligibleForAssign = Boolean(selected && (selected.assignedUserId || ["owner_matching", "owner_assignment"].includes(selected.status)));

  async function moveTo(next: number) {
    if (next < 1 || query.isFetchingNextPage) return;
    if (next <= pages.length) { setPage(next); return; }
    const cursor = pages.at(-1)?.nextAfter;
    if (!cursor) return;
    const result = await query.fetchNextPage();
    if (!result.isError && result.data?.pages.length) setPage(result.data.pages.length);
  }

  async function submitAssignment() {
    if (!selected || !Number.isSafeInteger(Number(ownerId)) || Number(ownerId) < 1) return;
    try {
      await assign.mutateAsync({ ideaId: selected.id, businessOwnerId: Number(ownerId) });
      setSuccess(`${selected.reference} ${selected.assignedUserId ? "reassigned" : "assigned"} successfully.`);
      setSelected(current => current ? { ...current, assignedUserId: Number(ownerId), assignedOwnerName: ownerRows.find(owner => owner.id === Number(ownerId))?.name ?? null, status: current.assignedUserId ? current.status : "business_review" } : null);
      setOwnerId("");
      setAssignmentDialogOpen(false);
      await detail.refetch();
    } catch { /* Keep the drawer open and show the API error for retry. */ }
  }

  return <section className="min-w-0" aria-label="Idea progress and owner assignment">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold tracking-tight">Progress & owner assignment</h2><p className="mt-1 text-sm text-muted">Monitor every submitted idea. Manually assign an owner when matching needs review, or reassign an active idea at any stage.</p></div><span className="rounded-lg border border-[var(--line)] bg-white px-3 py-1 text-sm">10 per page</span></div>
    {success && <p className="mb-3 rounded-lg border border-teal/40 bg-teal/5 p-3 text-sm" role="status">{success}</p>}
    {query.isPending ? <div className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm text-muted" role="status" aria-busy="true">Loading idea progress…</div> : query.isError && !query.data ? <div className="rounded-lg border border-pink/40 bg-white p-5 text-sm" role="alert"><p>Idea progress could not be loaded: {errorText(query.error)}</p><button type="button" className="btn btn-small mt-3" onClick={() => void query.refetch()}>Retry</button></div> : <>
      {query.isRefetchError && <p className="mb-3 text-sm text-pink" role="alert">Progress refresh failed: {errorText(query.error)} <button className="underline" type="button" onClick={() => void query.refetch()}>Retry</button></p>}
      <ProgressPage ideas={rows} page={page} hasNext={Boolean(currentPage?.nextAfter) || page < pages.length} busy={query.isFetchingNextPage} onPageChange={p => void moveTo(p)} search={search} setSearch={value => { setSearch(value); setPage(1); }} status={status} setStatus={value => { setStatus(value); setPage(1); }} onSelect={idea => { setSelected(idea); setOwnerId(""); assign.reset(); setSuccess(""); }} />
      {query.isFetchNextPageError && <p className="mt-2 text-sm text-pink" role="alert">The next page failed: {errorText(query.error)}. <button className="underline" type="button" onClick={() => void moveTo(page + 1)}>Retry</button></p>}
    </>}

    <AdminDrawer open={selected !== null} onClose={() => { if (!assign.isPending && !assignmentDialogOpen) setSelected(null); }} title={detail.data?.idea.title ?? selected?.title ?? "Idea progress"} description={detail.data ? `${detail.data.idea.reference} · ${readable(detail.data.idea.status)}` : selected ? `${selected.reference} · ${readable(selected.status)}` : undefined} width="idea" headerActions={selected && eligibleForAssign ? <button type="button" className="btn-primary btn-small" disabled={assign.isPending} onClick={() => { assign.reset(); setOwnerId(""); setAssignmentDialogOpen(true); }}>{selected.assignedUserId ? "Reassign owner" : "Assign owner"}</button> : undefined}>
      {!selected ? null : <div className="space-y-4">
        <section className="rounded-xl border border-[var(--line)] p-4"><h3 className="font-medium">Current ownership</h3><p className="mt-2 text-sm">{selected.assignedOwnerName ? `${selected.assignedOwnerName} · ${selected.department}` : selected.assignedUserId ? "An owner is assigned, but their profile is unavailable." : "No business owner assigned"}</p><p className="mt-1 text-xs text-muted">Current stage: {readable(selected.status)}{selected.status === "owner_matching" ? ". AI matching is in progress; you may assign an owner manually if needed." : selected.status === "owner_assignment" ? ". AI could not confirm a match. Choose an active business owner to continue." : ""}</p></section>
        {detail.isPending ? <div role="status" aria-busy="true" className="rounded-lg border border-[var(--line)] p-4 text-sm text-muted">Loading full idea details…</div> : detail.isError ? <div role="alert" className="rounded-lg border border-pink/40 p-4 text-sm"><p>Idea details could not be loaded: {errorText(detail.error)}</p><button type="button" className="btn btn-small mt-3" onClick={() => void detail.refetch()}>Retry</button></div> : detail.data ? <AdminIdeaFullDetail detail={detail.data} /> : null}
      </div>}
    </AdminDrawer>
    <AdminActionDialog open={assignmentDialogOpen && Boolean(selected) && eligibleForAssign} onClose={() => { if (!assign.isPending) setAssignmentDialogOpen(false); }} title={selected?.assignedUserId ? "Reassign business owner" : "Assign business owner"} description={selected ? `Choose the owner who will take over ${selected.reference}. This change is recorded in the idea history and audit trail.` : undefined}>
      <div className="space-y-3"><OwnerOptions owners={owners} value={ownerId} onChange={setOwnerId} />{assign.isError && <p role="alert" className="text-sm text-pink">Assignment failed: {errorText(assign.error)} <button className="underline" type="button" onClick={() => { void query.refetch(); void detail.refetch(); void owners.refetch(); }}>Refresh idea and owner data</button></p>}<div className="flex justify-end gap-2"><button type="button" className="btn" disabled={assign.isPending} onClick={() => setAssignmentDialogOpen(false)}>Cancel</button><button type="button" className="btn-primary" disabled={assign.isPending || owners.isPending || owners.isError || !ownerId || Number(ownerId) === selected?.assignedUserId} onClick={() => void submitAssignment()}>{assign.isPending ? "Saving assignment…" : selected?.assignedUserId ? "Confirm reassignment" : "Confirm assignment"}</button></div></div>
    </AdminActionDialog>
  </section>;
}
