"use client";

import React, { useState } from "react";
import { LearningState } from "./learning-cards";
import { useJoinChallenge, useLearningChallenges, useLearningRankings } from "../hooks";

const panel = "rounded-[20px] border border-[var(--line)] bg-white p-6 shadow-[0_1px_2px_rgba(11,40,100,0.05),0_10px_26px_-14px_rgba(11,40,100,0.2)]";
const action = "btn btn-primary min-h-10 disabled:cursor-not-allowed disabled:opacity-50";

function message(error: unknown, fallback: string) { return error instanceof Error && error.message ? error.message : fallback; }

export function LearningRanking() {
  const [scope, setScope] = useState<"bank" | "department">("bank");
  const [page, setPage] = useState(1);
  const query = useLearningRankings(scope);
  const items = [...(query.data?.items ?? [])].sort((a, b) => a.rank - b.rank);
  const podium = items.filter((item) => item.rank <= 3);
  const rows = items.filter((item) => item.rank > 3);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);
  return <section className={panel} aria-labelledby="ranking-title">
    <div className="mb-[-2px] flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-[620px]"><h2 id="ranking-title" className="text-xl font-semibold leading-[1.22] text-[var(--text)]">Innovation Champions <span aria-hidden="true">🏆</span></h2><p className="mt-1 text-sm text-[var(--muted)]">Ranked by Ignite Points earned from ideas that progress, quizzes, reading, challenges and helping colleagues.</p></div>
      <div className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-xl border border-[var(--line)] bg-white p-1" role="group" aria-label="Ranking scope">{(["bank", "department"] as const).map((value) => <button key={value} type="button" aria-pressed={scope === value} className={`whitespace-nowrap rounded-[9px] px-3.5 py-2 text-[13.5px] font-medium ${scope === value ? "bg-[#1e5eff] text-white" : "text-[var(--muted)] hover:bg-[var(--hover)]"}`} onClick={() => { setScope(value); setPage(1); }}>{value === "bank" ? "Whole bank" : "My department"}</button>)}</div>
    </div>
    {query.isPending ? <LearningState state="loading" label="Loading the ranking…" /> : query.isError ? <LearningState state="error" label={message(query.error, "The ranking could not be loaded.")} onRetry={() => void query.refetch()} /> : !items.length ? <LearningState state="empty" label="No ranking entries are available yet." /> : <>
      <ol aria-label="Top three champions" className="grid items-end gap-2.5 sm:grid-cols-3">{podium.map((item) => <li key={`${item.rank}-${item.name}`} value={item.rank} className={`relative flex min-w-0 flex-col rounded-t-[14px] border border-b-0 p-4 text-center ${item.rank === 1 ? "min-h-60 border-[color-mix(in_srgb,var(--sand)_50%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--sand)_14%,transparent),transparent)] sm:order-2" : item.rank === 2 ? "min-h-52 border-[var(--line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--blue)_10%,transparent),transparent)] sm:order-1" : "min-h-52 border-[var(--line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--blue)_10%,transparent),transparent)] sm:order-3"}`}>
        <span className="text-3xl" aria-hidden="true">{item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : "🥉"}</span><span className="sr-only">Rank {item.rank}</span>
        <span aria-hidden="true" className={`my-3 flex size-11 items-center justify-center rounded-full font-bold text-white ${item.rank === 1 ? "bg-violet-600" : "bg-blue-500"}`}>{item.name.trim().charAt(0).toUpperCase()}</span>
        <h3 className="break-words text-base font-medium text-[var(--text)]">{item.name.split(" ")[0]}</h3><p className="mt-1 break-words text-xs text-[var(--muted)]">{item.department}</p><p className="mt-2 font-medium tabular-nums text-[var(--text)]"><span aria-hidden="true">💡 </span>{item.points.toLocaleString()}<span className="sr-only"> Ignite Points</span></p>
      </li>)}</ol>
      {rows.length > 0 && <><ol start={visibleRows[0]?.rank ?? 4} aria-label="More champions" className="mt-4 divide-y divide-[var(--line)]">{visibleRows.map((item) => <li key={`${item.rank}-${item.name}`} value={item.rank} className="flex items-center gap-3 py-3"><span className="w-7 shrink-0 text-center text-sm font-medium tabular-nums text-[var(--muted)]">{item.rank}</span><span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--blue)_14%,transparent)] font-medium text-[var(--blue)]">{item.name.trim().charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><h3 className="break-words text-sm font-medium text-[var(--text)]">{item.name}</h3><p className="break-words text-xs text-[var(--muted)]">{item.department}</p></div><span className="shrink-0 text-sm font-medium tabular-nums text-[var(--text)]"><span aria-hidden="true">💡 </span>{item.points.toLocaleString()}<span className="sr-only"> Ignite Points</span></span></li>)}</ol>{totalPages > 1 && <nav aria-label="Ranking pages" className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-sm text-[var(--muted)]"><button type="button" className="btn btn-small" disabled={page === 1} onClick={() => setPage(current => current - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button type="button" className="btn btn-small" disabled={page >= totalPages} onClick={() => setPage(current => current + 1)}>Next</button></nav>}</>}
    </>}
  </section>;
}

export function LearningChallenges({ onShareIdea }: { onShareIdea?: (challengeId: number) => void }) {
  const query = useLearningChallenges();
  const join = useJoinChallenge();
  return query.isPending ? <LearningState state="loading" label="Loading open challenges…" /> : query.isError ? <LearningState state="error" label={message(query.error, "Challenges could not be loaded.")} onRetry={() => void query.refetch()} /> : !query.data?.items.length ? <LearningState state="empty" label="No open challenges are available right now." /> : <div className="space-y-[18px]">{query.data.items.map((challenge) => { const daysLeft = Math.max(0, Math.ceil((new Date(challenge.deadlineAt).getTime() - Date.now()) / 86_400_000)); return <article className={`${panel} space-y-3`} key={challenge.id}><div className="flex flex-wrap items-center justify-between gap-3"><span className={`pill ${challenge.joined ? "text-[var(--teal)]" : "text-[var(--sand)]"}`}><span className="pill-dot" />{challenge.joined ? "You joined" : "Open challenge"}</span>{daysLeft > 0 && <span className="text-sm text-[var(--muted)]">{daysLeft} days left</span>}</div><h2 className="text-xl font-semibold text-[var(--text)]">{challenge.title}</h2><p className="text-[15px] leading-6 text-[var(--text)]">{challenge.question}</p><div className="flex flex-wrap gap-2"><span className="pill">♧ {challenge.participants} taking part</span><span className="pill">✎ {challenge.ideas ?? 0} {challenge.ideas === 1 ? "idea" : "ideas"}</span></div><div className="flex flex-wrap gap-2"><button type="button" className={action} disabled={challenge.joined || join.isPending} onClick={() => join.mutate({ challengeId: challenge.id })}>{challenge.joined ? "You joined" : join.isPending && join.variables?.challengeId === challenge.id ? "Joining…" : "Join the challenge"}</button>{onShareIdea && <button type="button" className="btn" onClick={() => onShareIdea(challenge.id)}>⚡ Share an idea for it</button>}</div>{join.isError && join.variables?.challengeId === challenge.id && <p className="text-sm text-red-800" role="alert">{message(join.error, "The challenge could not be joined.")}</p>}{join.isSuccess && join.variables?.challengeId === challenge.id && <p className="text-sm text-[var(--teal)]" role="status">Joined and points processed.</p>}</article>; })}</div>;
}
