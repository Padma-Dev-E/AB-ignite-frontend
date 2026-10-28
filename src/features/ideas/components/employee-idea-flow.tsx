"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import React from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useDispatch, useSelector } from "react-redux";
import { ApiError } from "../../../lib/api/client";
import { scorePriority } from "../../../lib/ideas/priority-policy";
import { ideaValidationPasses, normalizeIdeaValidationScore } from "../../../lib/ideas/validation-score";
import type { AppDispatch, RootState } from "../../../store";
import { resetIdeaWizard, setIdeaWizardStep } from "../../../store/ui-slice";
import {
  useAddIdeaComment,
  useCreateIdea,
  useDeleteIdeaDraft,
  useIdea,
  useIdeaAiStatus,
  useIdeaComments,
  useIdeaDevelopment,
  useIdeaPriorityPolicy,
  useIdeas,
  useQueueIdeaDevelopment,
  useSaveIdeaSubmission,
  useSubmitIdea,
  useSupportIdea,
  useUpdateIdea,
  useUpdateIdeaDraft,
} from "../hooks";
import {
  EmployeeCommunityUpdates,
  EmployeeFeedbackCampaignForm,
} from "../../employee/employee-engagement";
import { CommunityFeedRow } from "../../employee/community-feed";
import type {
  Idea,
  IdeaCreateInput,
  IdeaClarifyingQuestion,
  IdeaEnrichment,
  IdeaKind,
  IdeaPriorityBreakdown,
  IdeaSubmissionInput,
  IdeaQuestions,
  IdeaValidation,
} from "../types";

import { useEmployeeProfile } from "../../employee/profile-hooks";
import { useLearningChallenges, useLearningJourney, useLearningRankings } from "../../learning/hooks";
import { AdminAiDiagnosticsPanel } from "../../admin/components/admin-evaluation";

type Page =
  | "community"
  | "new"
  | "learn"
  | "library"
  | "me"
  | "article"
  | "idea"
  | "quiz";

const iconPaths = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  back: "M15 6l-6 6 6 6",
  bot: "M12 4v3M6 7h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM9 12v2M15 12v2",
  check: "M5 12l5 5 9-10",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
  msg: "M4 5h16v11H9l-5 4z",
  search: "m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  up: "M12 19V6M6 12l6-6 6 6",
} as const;
type IconName = keyof typeof iconPaths;

function ordinal(value: number) {
  const lastTwo = value % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? "th" : value % 10 === 1 ? "st" : value % 10 === 2 ? "nd" : value % 10 === 3 ? "rd" : "th";
  return `${value}${suffix}`;
}

function Icon({
  name,
  className = "h-[19px] w-[19px]",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

function Avatar({
  name,
  size = "sm",
}: {
  name: string | number;
  size?: "sm" | "md" | "lg";
}) {
  const label = String(name).trim();
  const colors = [
    "#2F80ED",
    "#12A383",
    "#7C5CE0",
    "#E8891C",
    "#DB4C7F",
    "#0E9AD6",
  ];
  const color =
    colors[
      label.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
        colors.length
    ];
  const classes = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-lg",
  };
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${classes[size]}`}
      style={{ background: color }}
    >
      {label[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

function StatusPill({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "teal" | "sand" | "muted";
}) {
  const tones = {
    blue: "text-blue border-blue/45",
    teal: "text-[#0e9f7a] border-[#0e9f7a]/50",
    sand: "text-sand border-sand/50",
    muted: "text-muted border-[var(--line-strong)]",
  };
  return (
    <span className={`pill ${tones[tone]}`}>
      <span className="pill-dot" />
      {children}
    </span>
  );
}

function StateMessage({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="app-card py-12 text-center">
      <h2 className="text-xl font-medium">{title}</h2>
      {detail && (
        <p className="mx-auto mt-2 max-w-[52ch] text-sm text-muted">{detail}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Something went wrong. Please try again.";
}

const leadingSearchNoise = new Set([
  "a", "an", "the", "this", "that", "my", "our", "we", "i", "problem",
  "idea", "proposal", "suggestion", "about", "how", "what", "why", "is",
  "are", "have", "has", "need", "needs", "to", "for", "with",
]);

export function buildIdeaSearchPhrase(text: string) {
  const tokens = text.toLocaleLowerCase().match(/[a-z0-9]+/g) ?? [];
  while (tokens[0] !== undefined && leadingSearchNoise.has(tokens[0])) tokens.shift();
  return tokens.slice(0, 3).join(" ");
}

function priorityRejectionDetails(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 422 || !error.details || typeof error.details !== "object") return null;
  const details = error.details as {
    score?: unknown;
    minimumScore?: unknown;
    priorityBand?: unknown;
    breakdown?: unknown;
  };
  const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
  return {
    score: isNumber(details.score) ? details.score : undefined,
    minimumScore: isNumber(details.minimumScore) ? details.minimumScore : undefined,
    priorityBand: typeof details.priorityBand === "string" ? details.priorityBand : undefined,
    breakdown: Array.isArray(details.breakdown)
      ? details.breakdown.filter((item): item is IdeaPriorityBreakdown => {
          if (!item || typeof item !== "object") return false;
          const row = item as Partial<IdeaPriorityBreakdown>;
          return ["turnaround", "volume", "value"].includes(String(row.key)) &&
            isNumber(row.score) && isNumber(row.weight) && isNumber(row.contribution);
        })
      : [],
  };
}

const statusLabels: Record<Idea["status"], string> = {
  draft: "Private draft",
  screening: "Screening", returned: "Returned for changes", business_review: "Business review",
  control_review: "Review", decision: "Confirmation", poc: "Accepted: proof of concept",
  implementation: "Implementation", implemented: "Impact", rejected: "Rejected", deferred: "Deferred",
};

// Some API versions include author metadata; otherwise retain the real author ID.
function ideaAuthor(idea: Idea) {
  const author = (idea as Idea & { author?: { name: string; department?: string } | null }).author;
  return { name: author?.name || `Contributor #${idea.authorId}`, department: author?.department };
}

function IdeaCard({ idea, onOpen }: { idea: Idea; onOpen: () => void }) {
  const author = ideaAuthor(idea);
  const tone = idea.category.toLowerCase() === "customer" ? "#e94b87" : "#0e9ad6";
  const bandTone =
    idea.priorityBand === "Priority"
      ? "sand"
      : idea.priorityBand === "Quality"
        ? "teal"
        : "muted";
  return (
    <article
      className="app-card border-t-[3px] p-5"
      style={{ borderTopColor: tone }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill border-transparent bg-blue/10 text-blue">{idea.category}</span>
          {idea.priorityBand && <StatusPill tone={bandTone}>{idea.priorityBand}</StatusPill>}
        </div>
        <StatusPill tone={idea.status === "returned" ? "sand" : "blue"}>{statusLabels[idea.status]}</StatusPill>
      </div>
      <button
        onClick={onOpen}
        className="mt-4 text-left text-lg font-semibold leading-snug hover:text-blue"
      >
        {idea.kind === "problem" ? "🔎 " : ""}
        {idea.title}
      </button>
      <p className="mt-2 text-sm text-muted">{idea.summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Avatar name={author.name} />
        <span className="flex-1 text-sm">
          <b className="font-medium">{author.name}</b>{" "}
          <span className="text-muted">{author.department}</span>
        </span>
        <span className="font-mono text-xs tracking-[.08em] text-muted">
          {idea.reference}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn btn-small" onClick={onOpen}>
          <Icon name="up" className="h-4 w-4" /> {idea.supports} Support
        </button>
        <button onClick={onOpen} className="btn btn-small">
          <Icon name="msg" className="h-4 w-4" /> {idea.comments} Discuss
        </button>
      </div>
    </article>
  );
}

export function EmployeeCommunityPage({
  onNavigate,
  onOpenIdea,
  onOpenAnnouncement,
  onOpenArticle,
  points = 0,
  levelName = null,
  levelIndex = null,
  pointsLoading = false,
  pointsError = false,
}: {
  onNavigate: (page: Page) => void;
  onOpenIdea: (id: number) => void;
  onOpenAnnouncement: (id: number) => void;
  onOpenArticle: (id: number) => void;
  points?: number;
  levelName?: string | null;
  levelIndex?: number | null;
  pointsLoading?: boolean;
  pointsError?: boolean;
}) {
  const profileQuery = useEmployeeProfile();
  const challengesQuery = useLearningChallenges();
  const journeyQuery = useLearningJourney();
  const rankingsQuery = useLearningRankings("bank");
  const profile = profileQuery.data;
  const rank = rankingsQuery.data?.items.find((item) => item.name === profile?.name && item.department === profile?.department);
  const challenge = challengesQuery.data?.items[0];
  const recommendedArticle = journeyQuery.data?.recommendedArticles?.[0];
  const daysUntilChallengeCloses = challenge
    ? Math.max(0, Math.ceil((Date.parse(challenge.deadlineAt) - Date.now()) / 86_400_000))
    : null;
  const firstName = profile?.name?.trim().split(/\s+/)[0];
  const [greeting, setGreeting] = useState("Good morning");
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
  }, []);
  const [filter, setFilter] = useState("Everything");
  const [query, setQuery] = useState("");
  const params = useMemo(
    () => ({
      page: 1,
      pageSize: 20,
      search: query || undefined,
      mine: filter === "Mine",
    }),
    [filter, query],
  );
  const ideasQuery = useIdeas(params);
  const items = useMemo(
    () =>
      (ideasQuery.data?.items ?? []).filter(
        (idea) =>
          filter === "Everything" ||
          filter === "Mine" ||
          (filter === "Ideas" ? idea.kind === "idea" : idea.kind === "problem"),
      ),
    [filter, ideasQuery.data?.items],
  );
  return (
    <div className="stack">
      <div className="flex flex-col justify-between gap-6 min-[900px]:flex-row min-[900px]:items-center">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-.035em] sm:text-[32px]">
            {greeting}{firstName ? `, ${firstName}` : ""} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            Your next idea could improve how we serve customers and each other.
          </p>
          <button
            className="btn-primary mt-4"
            onClick={() => onNavigate("new")}
          >
            <Icon name="spark" /> Share an idea
          </button>
        </div>
        <button type="button" onClick={() => onNavigate("me")} aria-label="Open your Ignite account and points balance" className="hero-surface relative aspect-[1.7] w-full shrink-0 overflow-hidden rounded-[18px] p-5 text-left text-white shadow-[0_18px_36px_-18px_var(--blue-deep)] transition-transform hover:-translate-y-0.5 focus-visible:outline-white sm:w-[340px]">
          <span className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" aria-hidden="true" />
          <span className="pointer-events-none absolute -right-7 -top-14 h-44 w-44 rounded-full border border-white/10" aria-hidden="true" />
          <span className="relative flex items-center justify-between gap-2 text-[10px] font-semibold tracking-[.13em]">
            <span>AB IGNITE</span>
            <span className="rounded-full border border-white/40 bg-white/10 px-2 py-1 text-[9px] tracking-[.08em]">
              {pointsLoading ? "LEVEL …" : pointsError ? "LEVEL —" : `LEVEL ${levelIndex ?? 1}`}
            </span>
            <span className="whitespace-nowrap text-[10px] font-normal tracking-normal text-white/90">🥇 {rank ? `${ordinal(rank.rank)} this season` : "Season ranking"}</span>
          </span>
          <span className="relative mt-4 grid h-[26px] w-[36px] overflow-hidden rounded-[5px] border border-amber-100/60 bg-gradient-to-br from-[#ffe7a0] via-[#d9aa4b] to-[#f7d77d] shadow-inner" aria-hidden="true">
            <span className="absolute inset-y-0 left-1/2 w-px bg-amber-900/30" />
            <span className="absolute inset-x-0 top-1/2 h-px bg-amber-900/25" />
          </span>
          <span className="relative mt-3 block text-[32px] font-semibold leading-none tracking-[-.04em]">
            {pointsLoading ? "Loading…" : pointsError ? "Unavailable" : `💡 ${points.toLocaleString("en-US")}`}
          </span>
          <span className="relative mt-1 block text-[11px] text-white/80">Ignite account balance, in points</span>
          <span className="relative mt-4 flex items-end justify-between gap-2 text-[10px] leading-tight text-white/85">
            <span className="min-w-0 truncate font-medium tracking-[.08em]">ABI {String(profile?.id ?? "----").padStart(4, "0")}　••••　{(firstName ?? "EMPLOYEE").toUpperCase()}</span>
            <span className="max-w-[110px] truncate text-right">{levelName ?? "Ignite member"}</span>
          </span>
        </button>
      </div>
      <EmployeeFeedbackCampaignForm appearance="community" />
      <div className="grid items-stretch gap-[18px] min-[900px]:grid-cols-2">
        <section className="app-card">
          <h2 className="text-xl font-semibold">Happening now</h2>
          <div className="mt-2">
            {challenge && <CommunityFeedRow icon="flag">
              <h3 className="text-[15px] font-medium leading-6">Challenge of the month</h3>
              <p className="mt-1 text-[13px] leading-[1.6] text-muted" style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>{challenge.question}{daysUntilChallengeCloses ? ` ${daysUntilChallengeCloses} days left.` : ""}</p>
              <button className="btn btn-small mt-2.5" onClick={() => onNavigate("new")}>Share an idea for it</button>
            </CommunityFeedRow>}
            {recommendedArticle ? <CommunityFeedRow icon="book">
              <h3 className="text-[15px] font-medium leading-6">Recommended for you</h3>
              <p className="mt-1 text-[13px] leading-[1.6] text-muted" style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>“{recommendedArticle.title}”, {recommendedArticle.readingMinutes} min. {recommendedArticle.recommendation.reason.split(". ")[0].replace(/[.!?]+$/, "")}.</p>
              <button className="btn btn-small mt-2.5" onClick={() => onOpenArticle(recommendedArticle.id)}>Read it</button>
            </CommunityFeedRow> : <CommunityFeedRow icon="book">
              <h3 className="text-[15px] font-medium leading-6">Grow your knowledge</h3>
              <p className="mt-1 text-[13px] leading-[1.6] text-muted">{journeyQuery.data?.nextRecommendedStep ? `Build your knowledge in ${journeyQuery.data.nextRecommendedStep.topic} and get reading picked for you.` : "Find out where you stand and get reading picked for you."}</p>
              <button className="btn btn-small mt-2.5" onClick={() => onNavigate("learn")}>Take a quiz</button>
            </CommunityFeedRow>}
            <CommunityFeedRow icon="trophy" isLast>
              <h3 className="text-[15px] font-medium leading-6">Season ranking</h3>
              <p className="mt-1 text-[13px] leading-[1.6] text-muted">{rank ? <>You are <span className="font-medium text-[var(--text)]">🥇 {ordinal(rank.rank)}</span> across the bank.</> : rankingsQuery.isPending ? "Explore the bank’s innovation champions." : rankingsQuery.isError ? "Ranking is temporarily unavailable." : "Explore the bank’s innovation champions."}</p>
              <button className="btn btn-small mt-2.5" onClick={() => onNavigate("learn")}>See the ranking</button>
            </CommunityFeedRow>
            {challengesQuery.isError && <p role="status" className="mt-3 text-xs text-muted">Challenge information is unavailable. <button className="underline" onClick={() => void challengesQuery.refetch()}>Retry</button></p>}
          </div>
        </section>
        <section className="app-card" aria-label="What’s new"><h2 className="text-xl font-semibold">What’s new</h2><EmployeeCommunityUpdates onOpenAnnouncement={onOpenAnnouncement} /></section>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">Ideas from across the bank</h2><span className="text-sm text-muted">{ideasQuery.data ? `${ideasQuery.data.total} shared` : "Community ideas"}</span></div>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-xl border bg-white p-1"
          style={{ borderColor: "var(--line)" }}
        >
          {["Everything", "Ideas", "Problems", "Mine"].map((item) => (
            <button
              key={item}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
              className={`whitespace-nowrap rounded-[9px] px-3.5 py-2 text-[13.5px] font-medium ${filter === item ? "bg-blue text-white" : "text-muted hover:bg-[var(--hover)]"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="flex min-w-[220px] flex-1 items-center gap-2">
          <span className="sr-only">Search ideas</span>
          <span className="relative flex-1">
            <Icon
              name="search"
              className="absolute left-3 top-3 h-4 w-4 text-muted"
            />
            <input
              className="input pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ideas, people or references"
            />
          </span>
        </label>
      </div>
      <p className="-mt-3 flex items-center gap-2 text-sm text-muted">
        <Icon name="lock" className="h-4 w-4" />
        Every idea is registered to its author. You support colleagues’ ideas,
        not your own.
      </p>
      {ideasQuery.isPending ? (
        <StateMessage
          title="Loading ideas…"
          detail="Getting the latest community proposals."
        />
      ) : ideasQuery.isError ? (
        <StateMessage
          title="Ideas are temporarily unavailable"
          detail={errorMessage(ideasQuery.error)}
          action={
            <button className="btn" onClick={() => void ideasQuery.refetch()}>
              Try again
            </button>
          }
        />
      ) : items.length === 0 ? (
        <StateMessage
          title="No ideas found"
          detail={
            query
              ? "Try a different search or clear the filter."
              : "Be the first to share an idea with the community."
          }
          action={
            <button className="btn-primary" onClick={() => onNavigate("new")}>
              Share an idea
            </button>
          }
        />
      ) : (
        <div className="grid gap-[18px] min-[620px]:grid-cols-2">
          {items.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onOpen={() => onOpenIdea(idea.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const developFields = [
  {
    key: "problem",
    label: "Problem statement",
    placeholder: "What problem are you solving?",
  },
  {
    key: "solution",
    label: "Proposed solution",
    placeholder: "What would you change?",
  },
  {
    key: "benefits",
    label: "Expected benefits",
    placeholder: "Who benefits and how?",
  },
  {
    key: "risks",
    label: "Possible risks",
    placeholder: "What should reviewers think about?",
  },
] as const;

function IdeaStepBar({ step }: { step: number }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 overflow-hidden sm:gap-2">
      {["Describe", "Develop", "Questions", "Pass or fail", "Numbers"].map(
        (label, index) => (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-[11px] border px-2.5 py-2 text-[13px] font-medium ${step === index + 1 ? "border-blue bg-blue/[.12] text-ink" : step > index + 1 ? "text-muted" : "text-[var(--dim)]"}`}
            style={{
              borderColor: step === index + 1 ? "var(--blue)" : "var(--line)",
            }}
          >
            <b
              className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border text-xs ${step > index + 1 ? "border-[#0e9f7a] text-[#0e9f7a]" : step === index + 1 ? "border-blue bg-blue text-white" : ""}`}
              style={{
                borderColor:
                  step > index + 1 || step === index + 1
                    ? undefined
                    : "var(--line-strong)",
              }}
            >
              {step > index + 1 ? "✓" : index + 1}
            </b>
            <span className="hidden sm:inline">{label}</span>
          </div>
        ),
      )}
    </div>
  );
}

const validationLenses = [
  { key: "turnaroundTime", label: "Turnaround time", weight: 0.3 },
  { key: "volume", label: "Volume", weight: 0.3 },
  { key: "savingsRevenue", label: "Expected savings or revenue", weight: 0.4 },
 ] as const;

const ideaQuestionTopicLabels = {
  beneficiaries: "Who benefits",
  current_process: "What happens today",
  needed: "What is needed",
  risks: "What could go wrong",
  success_measure: "How success is measured",
} as const;

function getValidationBreakdown(validation: IdeaValidation) {
  if (!validation.evaluation) return null;
  const rows = validationLenses.map((lens) => ({ ...lens, ...validation.evaluation![lens.key as keyof NonNullable<IdeaValidation["evaluation"]>] }));
  return { rows };
}

function scoreBand(score: number) {
  if (score >= 2.4) return "Strong";
  if (score >= 1.5) return "Qualify";
  return "Watch";
}

export function EmployeeIdeaSubmissionPage({
  onOpenIdea,
}: {
  onOpenIdea: (id: number) => void;
}) {
  const { data: session } = useSession();
  const canViewAiDiagnostics = session?.user?.role === "back_office";
  const dispatch = useDispatch<AppDispatch>();
  const step = useSelector((state: RootState) => state.ui.ideaWizardStep);
  const [kind, setKind] = useState<IdeaKind>("idea");
  const [raw, setRaw] = useState("");
  const [resumeDraftId, setResumeDraftId] = useState<number | null>(null);
  const [resumeDraftError, setResumeDraftError] = useState<string | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<Idea | null>(null);
  const savedDraftsQuery = useIdeas({ page: 1, pageSize: 50, mine: true });
  const savedDrafts = (savedDraftsQuery.data?.items ?? []).filter((idea) => idea.status === "draft");
  const resumeDraftQuery = useIdea(resumeDraftId ?? 0, Boolean(resumeDraftId));
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const rawSearch = buildIdeaSearchPhrase(raw).slice(0, 120);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(rawSearch), 400);
    return () => clearTimeout(timer);
  }, [rawSearch]);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({
    problem: "",
    solution: "",
    benefits: "",
    risks: "",
  });
  const [impact, setImpact] = useState({
    turnaround: "",
    volume: "",
    value: "",
  });
  const [buildsOnId, setBuildsOnId] = useState<number | undefined>();
  const [differentiation, setDifferentiation] = useState("");
  const [metricExplanations, setMetricExplanations] = useState({
    turnaround: "",
    volume: "",
    value: "",
  });
  const [created, setCreated] = useState<{
    idea: Idea;
    versionId: number;
  } | null>(null);
  const [submitResult, setSubmitResult] = useState<
    import("../types").IdeaSubmitResponse | null
  >(null);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [submitForHumanReview, setSubmitForHumanReview] = useState(false);
  const [developmentError, setDevelopmentError] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [continueWithoutQuestions, setContinueWithoutQuestions] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState(false);
  const [questionVersionId, setQuestionVersionId] = useState<number | null>(null);
  const [aiAction, setAiAction] = useState<"enrich" | "questions" | "validate" | null>(null);
  const [activeDevelopmentRun, setActiveDevelopmentRun] = useState<{
    runId: number;
    versionId: number;
    action: "enrich" | "questions" | "validate";
  } | null>(null);
  const [appliedRunId, setAppliedRunId] = useState<number | null>(null);
  const validationSnapshot = useRef<string | null>(null);
  const [validatedContent, setValidatedContent] = useState<string | null>(null);
  const createMutation = useCreateIdea();
  const deleteDraftMutation = useDeleteIdeaDraft();
  const draftMutation = useUpdateIdeaDraft();
  const developmentMutation = useQueueIdeaDevelopment();
  const saveSubmissionMutation = useSaveIdeaSubmission();
  const submitMutation = useSubmitIdea();
  const priorityPolicyQuery = useIdeaPriorityPolicy();
  const busy =
    createMutation.isPending ||
    saveSubmissionMutation.isPending ||
    submitMutation.isPending;
  const searchMatches = rawSearch === debouncedSearch;
  const candidateQuery = useIdeas({
    page: 1,
    pageSize: 5,
    search: debouncedSearch.length >= 4 ? debouncedSearch : undefined,
  }, searchMatches && debouncedSearch.length >= 4);
  const unresolvedOriginality = Boolean(
    searchMatches &&
    (candidateQuery.data?.items.length ?? 0) > 0 &&
    !buildsOnId &&
    differentiation.trim().length < 20,
  );
  const aiStatusQuery = useIdeaAiStatus(
    created?.idea.id ?? 0,
    Boolean(created && submitResult && !submitResult.submitted),
  );
  const developmentQuery = useIdeaDevelopment(
    created?.idea.id ?? 0,
    Boolean(created),
    activeDevelopmentRun?.runId,
  );
  const allIdeaRuns = developmentQuery.data?.runs ?? [];
  const currentRuns = allIdeaRuns.filter(
    (run) => run.ideaVersionId === created?.versionId,
  );
  const latestCurrentRun = (jobKey: string) => currentRuns
    .filter((run) => run.jobKey === jobKey)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0];
  const enrichmentRun = latestCurrentRun("idea.enrich");
  const validationRun = latestCurrentRun("idea.validate");
  const questionsRun = latestCurrentRun("idea.questions");
  const activeRunIsCurrent = Boolean(
    activeDevelopmentRun && created && activeDevelopmentRun.versionId === created.versionId,
  );
  const matchingActiveRun = activeRunIsCurrent
    ? allIdeaRuns.find((run) => run.id === activeDevelopmentRun?.runId)
    : undefined;
  const activeRunInProgress = Boolean(
    activeRunIsCurrent &&
    (!matchingActiveRun || matchingActiveRun.status === "queued" || matchingActiveRun.status === "running"),
  );
  const validationInProgress = Boolean(
    (activeRunInProgress && activeDevelopmentRun?.action === "validate") ||
    validationRun?.status === "queued" ||
    validationRun?.status === "running",
  );
  const enrichment =
    enrichmentRun?.status === "succeeded"
      ? (enrichmentRun.result as (IdeaEnrichment & { solutionStatement?: string; riskStatement?: string }) | null)
      : null;
  const validation =
    validationRun?.status === "succeeded" && !(activeRunInProgress && activeDevelopmentRun?.action === "validate")
      ? (validationRun.result as IdeaValidation | null)
      : null;
  const generatedQuestionData = questionsRun?.status === "succeeded"
    ? (questionsRun.result as IdeaQuestions | null)
    : null;
  const reviewerQuestions: IdeaClarifyingQuestion[] = (generatedQuestionData?.questions ?? []).slice().sort((left, right) => {
    const leftIndex = left.topic ? Object.keys(ideaQuestionTopicLabels).indexOf(left.topic) : Number.MAX_SAFE_INTEGER;
    const rightIndex = right.topic ? Object.keys(ideaQuestionTopicLabels).indexOf(right.topic) : Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
  const validationScore = normalizeIdeaValidationScore(validation?.overallScore);
  const validationPassed = ideaValidationPasses(validation);
  const validationBreakdown = validation ? getValidationBreakdown(validation) : null;
  const lowValidationRuns = allIdeaRuns.filter((run) => {
    if (run.jobKey !== "idea.validate" || run.status !== "succeeded" || run.ideaVersionId <= 0) return false;
    const result = run.result as IdeaValidation | null;
    const score = normalizeIdeaValidationScore(result?.overallScore);
    return score !== null && score <= 7;
  });
  const currentContent = JSON.stringify({ kind, raw, title, summary, details });
  const validationIsCurrent = Boolean(
    validationRun &&
    created &&
    validationRun.ideaVersionId === created.versionId &&
    validatedContent === currentContent,
  );
  const canSubmitForHumanReview = Boolean(validationIsCurrent && validationScore !== null && validationScore <= 7 && lowValidationRuns.length >= 2);
  const validationBlocked = !validationIsCurrent || (!validationPassed && !canSubmitForHumanReview);
  const metrics = {
    turnaround: Number(impact.turnaround),
    volume: Number(impact.volume),
    value: Number(impact.value),
  };
  const hasAllImpactValues = Object.values(impact).every((value) => value.trim().length > 0);
  const validImpactValues = hasAllImpactValues && Object.values(metrics).every((value) => Number.isFinite(value) && value >= 0 && value <= 3);
  const priorityResult = validImpactValues && priorityPolicyQuery.data
    ? scorePriority(metrics, priorityPolicyQuery.data)
    : null;
  const submissionInput: IdeaSubmissionInput = {
    answers: questionAnswers,
    metrics: {
      ...metrics,
      turnaroundExplanation: metricExplanations.turnaround || undefined,
      volumeExplanation: metricExplanations.volume || undefined,
      valueExplanation: metricExplanations.value || undefined,
    },
    buildsOnId,
    differentiation: differentiation.trim() || undefined,
  };
  const requiredQuestionsAnswered = reviewerQuestions.every(
    (question) => !question.required || Boolean(questionAnswers[question.question]?.trim()),
  );
  const fieldsValid =
    title.trim().length >= 3 &&
    summary.trim().length >= 10 &&
    requiredQuestionsAnswered &&
    Object.values(impact).every((value) => value.trim().length > 0) &&
    [metrics.turnaround, metrics.volume, metrics.value].every(
      (value) => Number.isFinite(value) && value >= 0 && value <= 3,
    );
  const serverValidation = saveSubmissionMutation.data;
  const submissionError = saveSubmissionMutation.error ?? submitMutation.error ?? submitError;
  const submissionRejection = priorityRejectionDetails(submissionError);
  const priorityScoreRejected = submissionRejection?.score !== undefined || submissionRejection?.minimumScore !== undefined;

  useEffect(() => {
    dispatch(resetIdeaWizard());
  }, [dispatch]);

  useEffect(() => {
    const detail = resumeDraftQuery.data;
    if (!resumeDraftId || !detail || detail.idea.id !== resumeDraftId) return;
    if (typeof detail.versionId !== "number" || !Number.isSafeInteger(detail.versionId) || detail.versionId < 1) {
      setResumeDraftError("This draft’s saved version could not be loaded. Retry opening the draft.");
      setResumeDraftId(null);
      return;
    }
    const { idea, submission } = detail;
    setKind(idea.kind);
    setRaw(idea.summary);
    setTitle(idea.title);
    setSummary(idea.summary);
    setDetails({
      problem: idea.problem ?? "",
      solution: idea.solution ?? "",
      benefits: idea.benefits ?? "",
      risks: idea.risks ?? "",
    });
    setBuildsOnId(idea.buildsOnId ?? undefined);
    if (submission) {
      setQuestionAnswers(submission.answers);
      setImpact({
        turnaround: String(submission.metrics.turnaround),
        volume: String(submission.metrics.volume),
        value: String(submission.metrics.value),
      });
      setMetricExplanations({
        turnaround: submission.metrics.turnaroundExplanation ?? "",
        volume: submission.metrics.volumeExplanation ?? "",
        value: submission.metrics.valueExplanation ?? "",
      });
      setDifferentiation(submission.differentiation ?? "");
    }
    setCreated({ idea, versionId: detail.versionId });
    setResumeDraftError(null);
    setAppliedRunId(null);
    const restoredContent = JSON.stringify({
      kind: idea.kind,
      raw: idea.summary,
      title: idea.title,
      summary: idea.summary,
      details: {
        problem: idea.problem ?? "",
        solution: idea.solution ?? "",
        benefits: idea.benefits ?? "",
        risks: idea.risks ?? "",
      },
    });
    validationSnapshot.current = restoredContent;
    setValidatedContent(restoredContent);
    setResumeDraftId(null);
    if (detail.pendingSubmission) {
      setSubmitForHumanReview(detail.pendingSubmission.submitForHumanReview);
      setSubmitError(null);
      setSubmitResult({
        ideaId: idea.id,
        versionId: detail.versionId,
        status: detail.pendingSubmission.status,
        submitted: false,
      });
    } else {
      setSubmitForHumanReview(false);
      setSubmitError(null);
      setSubmitResult(null);
      dispatch(setIdeaWizardStep(2));
    }
  }, [dispatch, resumeDraftId, resumeDraftQuery.data]);

  useEffect(() => {
    if (!enrichment || !enrichmentRun || appliedRunId === enrichmentRun.id)
      return;
    const firstEnrichment = appliedRunId === null;
    setTitle((current) => firstEnrichment ? enrichment.suggestedTitle : current.trim() ? current : enrichment.suggestedTitle);
    setSummary((current) => firstEnrichment ? enrichment.conciseSummary : current.trim() ? current : enrichment.conciseSummary);
    setDetails((current) => ({
      ...current,
      problem: firstEnrichment || !current.problem.trim() ? enrichment.problemStatement : current.problem,
      benefits: firstEnrichment || !current.benefits.trim() ? enrichment.valueStatement : current.benefits,
      solution: firstEnrichment || !current.solution.trim() ? (enrichment.solutionStatement ?? current.solution) : current.solution,
      risks: firstEnrichment || !current.risks.trim() ? (enrichment.riskStatement ?? current.risks) : current.risks,
    }));
    setAppliedRunId(enrichmentRun.id);
  }, [appliedRunId, enrichment, enrichmentRun]);
  useEffect(() => {
    if (
      validationRun?.status === "succeeded" &&
      validation &&
      created &&
      validationRun.ideaVersionId === created.versionId
    ) {
      setValidatedContent(validationSnapshot.current);
    }
  }, [created, currentContent, validation, validationRun]);

  useEffect(() => {
    if (!activeDevelopmentRun) return;
    if (!created || activeDevelopmentRun.versionId !== created.versionId) {
      setActiveDevelopmentRun(null);
      return;
    }
    const run = allIdeaRuns.find((candidate) => candidate.id === activeDevelopmentRun.runId);
    if (run && !["queued", "running"].includes(run.status)) {
      setActiveDevelopmentRun(null);
    }
  }, [activeDevelopmentRun, allIdeaRuns, created]);

  useEffect(() => {
    if (!pendingQuestions || questionVersionId === null) return;
    const questionRun = currentRuns
      .filter((run) => run.jobKey === "idea.questions" && run.ideaVersionId === questionVersionId)
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0];
    if (questionRun?.status === "succeeded") {
      const result = questionRun.result as IdeaQuestions | null;
      const questions = result?.questions ?? [];
      setQuestionAnswers((current) => Object.fromEntries(
        questions.map((question) => [question.question, current[question.question] ?? ""]),
      ));
      setPendingQuestions(false);
      setQuestionVersionId(null);
      setQuestionError(null);
      setContinueWithoutQuestions(false);
      dispatch(setIdeaWizardStep(3));
      return;
    }
    if (
      questionRun &&
      ["failed", "timed_out", "cancelled"].includes(questionRun.status)
    ) {
      setPendingQuestions(false);
      setQuestionVersionId(null);
      setQuestionError("AI could not prepare questions for this draft. Retry, or continue without AI-generated questions.");
    }
  }, [currentRuns, dispatch, pendingQuestions, questionVersionId]);
  const applyEnrichment = () => {
    if (!enrichment || !enrichmentRun) return;
    setTitle(enrichment.suggestedTitle);
    setSummary(enrichment.conciseSummary);
    setDetails((current) => ({
      ...current,
      problem: enrichment.problemStatement,
      benefits: enrichment.valueStatement,
      solution: enrichment.solutionStatement ?? current.solution,
      risks: enrichment.riskStatement ?? current.risks,
    }));
    setAppliedRunId(enrichmentRun.id);
  };

  const draftInput = (): IdeaCreateInput => ({
    kind,
    title: title.trim(),
    summary: summary.trim(),
    category: "Customer",
    problem: details.problem.trim() || undefined,
    solution: details.solution.trim() || undefined,
    benefits: details.benefits.trim() || undefined,
    risks: details.risks.trim() || undefined,
    dataClassification: "internal",
    buildsOnId,
    differentiation: differentiation.trim() || undefined,
  });
  const syncDraft = async () => {
    if (!created) {
      const result = await createMutation.mutateAsync(draftInput());
      setCreated(result);
      return result;
    }
    if ((buildsOnId ?? null) !== created.idea.buildsOnId)
      throw new Error(
        "The related idea changed after this draft was saved. Keep the original selection for this draft.",
      );
    const updated = await draftMutation.mutateAsync({
      id: created.idea.id,
      input: {
        kind,
        title: title.trim(),
        summary: summary.trim(),
        category: "Customer",
        problem: details.problem.trim() || null,
        solution: details.solution.trim() || null,
        benefits: details.benefits.trim() || null,
        risks: details.risks.trim() || null,
        dataClassification: "internal",
      },
    });
    const result = { idea: updated.idea, versionId: updated.versionId };
    setCreated(result);
    return result;
  };
  const requestDevelopment = async (action: "enrich" | "questions" | "validate") => {
    if (title.trim().length < 3 || summary.trim().length < 10) return null;
    setDevelopmentError(null);
    setAiAction(action);
    try {
      const draft = await syncDraft();
      if (action === "validate") {
        // Snapshot the exact content after the save has produced its version.
        // This keeps the result tied to the version the API actually validates.
        validationSnapshot.current = currentContent;
        setValidatedContent(null);
      }
      if (action === "questions") setQuestionVersionId(draft.versionId);
      const queuedRun = await developmentMutation.mutateAsync({
        id: draft.idea.id,
        action,
        ...(action === "validate" ? { context: { answers: questionAnswers, differentiation } } : {}),
      });
      if (queuedRun.status === "queued" || queuedRun.status === "running") {
        setActiveDevelopmentRun({
          runId: queuedRun.runId,
          versionId: queuedRun.versionId,
          action,
        });
      } else {
        setActiveDevelopmentRun(null);
      }
      return draft;
    } catch (error) {
      if (action === "questions") setQuestionError(errorMessage(error));
      else setDevelopmentError(errorMessage(error));
      return null;
    } finally {
      setAiAction(null);
    }
  };

  const prepareReviewerQuestions = async () => {
    setPendingQuestions(true);
    setQuestionError(null);
    setContinueWithoutQuestions(false);
    const draft = await requestDevelopment("questions");
    if (!draft) {
      setPendingQuestions(false);
      setQuestionVersionId(null);
      setQuestionError("AI could not prepare questions for this draft. Retry, or continue without AI-generated questions.");
    }
  };

  const proceedWithoutGeneratedQuestions = () => {
    setQuestionAnswers({});
    setContinueWithoutQuestions(true);
    setQuestionError(null);
    dispatch(setIdeaWizardStep(3));
  };

  const startIdeaDevelopment = async () => {
    const description = raw.trim();
    if (description.length < 10) return;
    // Resuming a saved draft can return the wizard to the Describe step. In
    // that case, continue the existing idea instead of creating a duplicate.
    if (created) {
      setDevelopmentError(null);
      dispatch(setIdeaWizardStep(2));
      await requestDevelopment("enrich");
      return;
    }
    const initialTitle = title.trim() || description.split("\n")[0].slice(0, 120);
    const initialSummary = summary.trim() || description;
    const initialDetails = {
      problem: details.problem.trim() || (kind === "problem" ? description : ""),
      solution: details.solution.trim() || (kind === "idea" ? description : ""),
      benefits: details.benefits,
      risks: details.risks,
    };
    setTitle(initialTitle);
    setSummary(initialSummary);
    setDetails(initialDetails);
    setDevelopmentError(null);
    setAiAction("enrich");
    dispatch(setIdeaWizardStep(2));
    try {
      const draft = await createMutation.mutateAsync({
        kind,
        title: initialTitle,
        summary: initialSummary,
        category: "Customer",
        problem: initialDetails.problem || undefined,
        solution: initialDetails.solution || undefined,
        benefits: initialDetails.benefits.trim() || undefined,
        risks: initialDetails.risks.trim() || undefined,
        dataClassification: "internal",
        buildsOnId,
        differentiation: differentiation.trim() || undefined,
      });
      setCreated(draft);
      await developmentMutation.mutateAsync({ id: draft.idea.id, action: "enrich" });
    } catch (error) {
      setDevelopmentError(errorMessage(error));
    } finally {
      setAiAction(null);
    }
  };
  const finishSubmit = async (id: number, versionId: number, humanReview = submitForHumanReview) => {
    try {
      const result = await submitMutation.mutateAsync({ id, versionId, submitForHumanReview: humanReview });
      setSubmitResult(result);
    } catch (error) {
      setSubmitError(error);
    }
  };
  useEffect(() => {
    if (
      !created ||
      !submitResult ||
      submitResult.submitted ||
      submitError ||
      submitMutation.isPending
    )
      return;
    const preflight = aiStatusQuery.data?.runs.find(
      (run) => run.jobKey === "idea.preflight",
    );
    if (preflight?.status === "succeeded")
      void finishSubmit(created.idea.id, created.versionId, submitForHumanReview).catch(
        () => undefined,
      );
  }, [
    aiStatusQuery.data,
    created,
    submitResult,
    submitError,
    submitMutation.isPending,
    submitForHumanReview,
  ]);
  const submit = async (humanReview = false) => {
    if (
      !fieldsValid ||
      busy ||
      !validationIsCurrent ||
      (!validationPassed && !(humanReview && canSubmitForHumanReview)) ||
      (candidateQuery.data?.items.some((item) => item.id !== buildsOnId) &&
        !buildsOnId &&
        differentiation.trim().length < 20)
    ) {
      setSubmitError(new Error("Complete the required answers and impact numbers, resolve any related-idea prompt, and validate the current draft before submitting."));
      return;
    }
    if (!created) {
      setSubmitError(new Error("This draft could not be found. Return to the idea form and reopen the saved draft."));
      return;
    }
    setSubmitError(null);
    try {
      // The current idea version is already saved and was validated. Calling
      // syncDraft here would create a new version after validation, so the API
      // would correctly reject the submission as stale.
      const result = created;
      setSubmitForHumanReview(humanReview);
      await saveSubmissionMutation.mutateAsync({
        id: result.idea.id,
        input: submissionInput,
      });
      setCreated(result);
      await finishSubmit(result.idea.id, result.versionId, humanReview);
    } catch {
      /* the mutation error is rendered below */
    }
  };
  if (created && submitResult) {
    const preflight = aiStatusQuery.data?.runs.find(
      (run) => run.jobKey === "idea.preflight",
    );
    const completed = Boolean(submitResult?.submitted);
    const failed = Boolean(
      submitError ||
      (preflight &&
        ["failed", "timed_out", "cancelled"].includes(preflight.status)),
    );
    return (
      <div className="stack">
        <section className="app-card py-14 text-center">
          <div
            className="icon-box mx-auto mb-3"
            style={{
              color: completed
                ? "var(--teal)"
                : failed
                  ? "#d6336c"
                  : "var(--blue)",
              background: completed
                ? "rgba(14,159,122,.12)"
                : "rgba(47,128,237,.12)",
            }}
          >
            <Icon name={completed ? "check" : "bot"} />
          </div>
          <h1 className="text-2xl font-medium">
            {completed
              ? "Idea submitted"
              : failed
                ? "Validation needs attention"
                : "Idea received — validation queued"}
          </h1>
          <p className="mx-auto mt-2 max-w-[52ch] text-muted">
            {completed ? (
              <>
                Your idea is registered as{" "}
                <b>{submitResult?.reference ?? created.idea.reference}</b>. An
                innovation reviewer screens it first, and you are notified at
                every step.
              </>
            ) : failed ? (
              "The server could not complete validation or submission. Your idea is saved; review the message and try again if appropriate."
            ) : (
              `Reference ${created.idea.reference}. The server is checking your idea before it is submitted.`
            )}
          </p>
          {completed && (
            <div
              className="mx-auto mt-5 max-w-2xl text-left"
              aria-label="Submission details"
            >
              <div className="grid gap-3 sm:grid-cols-5">
                <div className="tile">
                  <span className="block text-xs text-muted">Category</span>
                  <b>{submitResult.category ?? created.idea.category}</b>
                </div>
                {typeof submitResult.pointsAwarded === "number" && (
                  <div className="tile">
                    <span className="block text-xs text-muted">Points earned</span>
                    <b>{submitResult.pointsAwarded} points</b>
                  </div>
                )}
                <div className="tile">
                  <span className="block text-xs text-muted">
                    Priority band
                  </span>
                  <b>{submitResult.priorityBand ?? "—"}</b>
                </div>
                <div className="tile">
                  <span className="block text-xs text-muted">
                    Score / minimum
                  </span>
                  <b>
                    {submitResult.score?.toFixed(2) ?? "—"} /{" "}
                    {submitResult.minimumScore?.toFixed(2) ?? "—"}
                  </b>
                </div>
                <div className="tile">
                  <span className="block text-xs text-muted">AI validation</span>
                  <b>{submitResult.aiValidationScore?.toFixed(1) ?? "—"} / 10</b>
                  {submitResult.submittedWithLowAiScore && <span className="mt-1 block text-xs text-sand">Submitted for human review</span>}
                </div>
              </div>
              {submitResult.submittedWithLowAiScore && <p className="mt-3 rounded-xl border border-sand/40 bg-sand/5 p-3 text-sm">Your idea entered the normal review queue after two below-threshold AI validation results. A reviewer will assess it manually.</p>}
              {submitResult.breakdown && (
                <div
                  className="mt-3 rounded-xl border p-4 text-sm"
                  style={{ borderColor: "var(--line)" }}
                >
                  <p className="font-medium">KPI breakdown</p>
                  <div className="mt-2 space-y-2">
                    {submitResult.breakdown.map((item) => (
                      <div
                        className="flex justify-between gap-3"
                        key={item.key}
                      >
                        <span className="capitalize">
                          {item.key} · {Math.round(item.weight * 100)}% weight
                        </span>
                        <span>
                          {item.score.toFixed(1)} →{" "}
                          {item.contribution.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {!completed && !failed && (
            <p className="mt-3 text-sm text-muted" aria-live="polite">
              {submitMutation.isPending ||
              preflight?.status === "queued" ||
              preflight?.status === "running"
                ? `Checking originality and safety…${preflight?.attemptCount && preflight.attemptCount > 1 ? ` Attempt ${preflight.attemptCount}.` : ""}`
                : "Waiting for the preflight result…"}
            </p>
          )}
          {(aiStatusQuery.isError || Boolean(submitError)) && (
            <p
              className="mx-auto mt-3 max-w-[52ch] text-sm text-[#d6336c]"
              role="alert"
            >
              {errorMessage(aiStatusQuery.error ?? submitError)}
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {failed && preflight?.status === "succeeded" && <button className="btn" type="button" disabled={submitMutation.isPending} onClick={() => setSubmitError(null)}>{submitMutation.isPending ? "Retrying…" : "Retry submission"}</button>}
            {failed && preflight?.status !== "succeeded" && <button className="btn" type="button" onClick={() => { setSubmitResult(null); setSubmitError(null); dispatch(setIdeaWizardStep(2)); }}>Improve draft</button>}
            {completed && (
              <button
                className="btn"
                onClick={() => onOpenIdea(created.idea.id)}
              >
                View idea
              </button>
            )}
            {(failed || completed) && (
              <button
                className="btn-primary"
                onClick={() => {
                  setCreated(null);
                  setSubmitResult(null);
                  setSubmitError(null);
                  setRaw("");
                  setTitle("");
                  setSummary("");
                  setDetails({
                    problem: "",
                    solution: "",
                    benefits: "",
                    risks: "",
                  });
                  setQuestionAnswers({});
                  setImpact({ turnaround: "", volume: "", value: "" });
                  dispatch(resetIdeaWizard());
                }}
              >
                Share another idea
              </button>
            )}
          </div>
        </section>
        {canViewAiDiagnostics && <AdminAiDiagnosticsPanel ideaId={created.idea.id} />}
      </div>
    );
  }
  return (
    <div className="stack mx-auto mt-[-2px] w-full max-w-[922px] gap-[25px] lg:translate-x-[7px]">
      {step === 1 && <section className="hero-surface relative overflow-hidden rounded-[24px] px-5 py-6 text-white sm:px-7 sm:py-6">
        <div className="relative z-10 max-w-[62%]">
          <h1 className="text-[25px] font-medium leading-tight tracking-[-.02em] sm:text-[32px]">Share an idea ✨</h1>
          <p className="mt-1.5 text-sm leading-6 text-white/85 sm:text-[15px]">One sentence is enough. AI checks it is original, develops it with you and validates it against the bank’s criteria.</p>
        </div>
      </section>}
      <IdeaStepBar step={step} />
      {created && canViewAiDiagnostics && <AdminAiDiagnosticsPanel ideaId={created.idea.id} />}
      {step === 2 && (
        <div className="flex flex-wrap items-start gap-2 rounded-xl border px-4 py-[11px] text-[13px]" style={{ borderColor: "var(--line)" }} role="status">
          <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-[#0e9f7a]" />
          <div className="min-w-0 flex-1">
            {candidateQuery.isPending ? <span className="text-muted">Checking whether this idea is already registered…</span> : candidateQuery.isError ? <span className="text-[#d6336c]">Originality check is temporarily unavailable. Retry the check before submitting.</span> : (candidateQuery.data?.items.length ?? 0) === 0 ? <><b className="text-[#0e9f7a]">Originality check passed.</b> <span className="text-muted">No registered idea matches yours.</span></> : <><b className="text-sand">Related ideas found.</b> <span className="text-muted">Your idea can still proceed. Related ideas you could learn from: </span><span className="inline-flex flex-wrap gap-x-1">{candidateQuery.data?.items.slice(0, 3).map((item, index) => <span key={item.id}>{index > 0 && <span className="text-muted"> · </span>}<button type="button" className="text-blue underline underline-offset-2" onClick={() => onOpenIdea(item.id)}>{item.title}</button></span>)}</span></>}
          </div>
        </div>
      )}
      {step === 2 && (
        <section className="app-card" aria-label="AI development suggestions">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium">AI enhancement</h2>
              <p className="mt-1 text-sm text-muted">A fuller version of your idea, drafted by AI. Edit anything that isn’t right.</p>
            </div>
            <button
              className="btn"
              disabled={
                title.trim().length < 3 ||
                summary.trim().length < 10 ||
                createMutation.isPending ||
                draftMutation.isPending ||
                developmentMutation.isPending
              }
              onClick={() => void requestDevelopment("enrich")}
            >
              {aiAction === "enrich" || createMutation.isPending || draftMutation.isPending || developmentMutation.isPending
                ? "Improving…"
                : <><Icon name="spark" className="mr-2 inline-block h-4 w-4" />Improve with AI</>}
            </button>
          </div>
          {(aiAction === "enrich" || enrichmentRun?.status === "queued" || enrichmentRun?.status === "running") && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: "var(--line)" }} role="status" aria-live="polite">
              <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue/25 border-t-blue" aria-hidden="true" />
              <div>
                <p className="font-medium">{enrichmentRun?.status === "running" ? "AI is developing your idea" : "Checking originality and developing your idea"}</p>
                <p className="mt-1 text-sm text-muted">We’re shaping your title, summary, problem, solution, benefits, and risks. You can review and edit every field when the draft is ready.</p>
              </div>
            </div>
          )}
          <div className="mt-4 flex min-h-[50px] flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-3 text-xs text-muted" style={{ borderColor: "var(--line)" }}>
            <span>Area of enhancement <b className="ml-1 rounded-full bg-blue/10 px-2 py-1 text-blue">Customer</b></span>
            <span>Assigned automatically. Re-checked when you submit.</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Idea title</span>
              <input
                className="input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label">In one or two sentences</span>
              <textarea
                className="input min-h-[72px]"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </label>
            {developFields.map((field) => (
              <label key={field.key} className="block">
                <span className="field-label">{field.label}</span>
                <textarea
                  className="input min-h-[100px]"
                  value={details[field.key]}
                  onChange={(event) =>
                    setDetails((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
          {created && developmentQuery.isPending && aiAction === "enrich" && (
            <p className="mt-3 text-sm text-muted" aria-live="polite">
              Loading AI suggestions…
            </p>
          )}
          {enrichmentRun &&
            ["queued", "running"].includes(enrichmentRun.status) && (
              <p className="mt-3 text-sm text-muted" aria-live="polite">
                AI is developing suggestions for your draft…
              </p>
            )}
          {enrichmentRun &&
            ["failed", "timed_out", "cancelled"].includes(
              enrichmentRun.status,
            ) && (
              <p className="mt-3 text-sm text-[#d6336c]" role="alert">
                {enrichmentRun.errorMessage || "Suggestions could not be completed. Complete the structure manually."}
              </p>
            )}
          {enrichment && appliedRunId !== enrichmentRun?.id && <div className="mt-3"><p className="text-sm text-muted">AI improvements are ready. Applying them will replace the current wording; all fields remain editable.</p><button className="btn mt-2" onClick={applyEnrichment}>Apply AI improvements</button></div>}
          {developmentQuery.isError && (
            <p className="mt-3 text-sm text-[#d6336c]" role="alert">
              {errorMessage(developmentQuery.error)}{" "}
              <button
                className="underline"
                onClick={() => void developmentQuery.refetch()}
              >
                Retry
              </button>
            </p>
          )}
          {developmentError && (
            <p className="mt-3 text-sm text-[#d6336c]" role="alert">
              {errorMessage(developmentError)}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn" type="button" onClick={() => dispatch(setIdeaWizardStep(1))}>Back to describe</button>
            <button className="btn-primary" type="button" disabled={title.trim().length < 3 || summary.trim().length < 10 || developmentMutation.isPending || pendingQuestions} onClick={() => void prepareReviewerQuestions()}>
              {pendingQuestions || aiAction === "questions" ? "Generating idea-specific questions…" : "Generate questions with AI"}
            </button>
          </div>
          {(pendingQuestions || questionsRun?.status === "queued" || questionsRun?.status === "running") && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: "var(--line)" }} role="status" aria-live="polite">
              <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue/25 border-t-blue" aria-hidden="true" />
              <div>
                <p className="font-medium">AI is reading your idea for missing details</p>
                <p className="mt-1 text-sm text-muted">It will prepare only the follow-up questions needed for this draft.</p>
              </div>
            </div>
          )}
          {questionError && (
            <div className="mt-3 rounded-xl border border-[#d6336c]/35 p-3 text-sm" role="alert">
              <p>{questionError}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="btn btn-small" type="button" disabled={pendingQuestions} onClick={() => void prepareReviewerQuestions()}>{pendingQuestions ? "Retrying…" : "Retry AI questions"}</button>
                <button className="btn btn-small" type="button" onClick={proceedWithoutGeneratedQuestions}>Continue without questions</button>
              </div>
            </div>
          )}
          {developmentError && (
            <p className="mt-3 text-sm text-[#d6336c]" role="alert">
              {developmentError}{" "}
              <button className="underline" type="button" onClick={() => void (created ? requestDevelopment("enrich") : startIdeaDevelopment())}>Retry AI development</button>
            </p>
          )}
        </section>
      )}
      {step === 3 && (
        <section className="app-card" aria-label="Reviewer questions">
          <div className="flex items-start gap-3">
            <div className="icon-box"><Icon name="bot" /></div>
            <div>
              <h2 className="text-lg font-medium">Questions about your idea</h2>
              <p className="mt-1 text-muted">Answer one idea-specific follow-up for each topic: who benefits, what happens today, what is needed, what could go wrong, and how success is measured.</p>
            </div>
          </div>
          {reviewerQuestions.length > 0 ? (
            <div className="mt-4 space-y-3">
              {reviewerQuestions.map((item, index) => {
                const key = item.question;
                const value = questionAnswers[key] ?? "";
                const topicLabel = item.topic ? ideaQuestionTopicLabels[item.topic] : `Question ${index + 1}`;
                return (
                  <label key={item.id} className="block border-l-2 py-1 pl-3 sm:pl-3.5" style={{ borderColor: "var(--line-strong)" }}>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-blue">{topicLabel}</span>
                    <span className="text-[13px] font-semibold leading-5">{item.question}</span>
                    {item.reason && <span className="mt-1 block text-xs leading-5 text-muted">{item.reason}</span>}
                    {item.answerType === "boolean" ? (
                      <select className="input mt-2.5" value={value} onChange={(event) => setQuestionAnswers((current) => ({ ...current, [key]: event.target.value }))}>
                        <option value="">Choose an answer</option><option value="yes">Yes</option><option value="no">No</option>
                      </select>
                    ) : item.answerType === "choice" ? (
                      <input className="input mt-2.5" value={value} onChange={(event) => setQuestionAnswers((current) => ({ ...current, [key]: event.target.value }))} placeholder="Enter your chosen response" />
                    ) : (
                      <textarea className="input mt-2.5 min-h-[72px]" value={value} onChange={(event) => setQuestionAnswers((current) => ({ ...current, [key]: event.target.value }))} placeholder={item.answerType === "number" || item.answerType === "date" ? "Include units, or say if this is not yet known" : "Your answer"} />
                    )}
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--line)" }} role="status">
              <b>{continueWithoutQuestions ? "Continuing without AI-generated questions" : "No further questions"}</b>
              <p className="mt-1 text-muted">The AI found no additional questions for this draft. You can continue to validation.</p>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn" type="button" onClick={() => dispatch(setIdeaWizardStep(2))}>Back</button>
            <button className="btn-primary" type="button" disabled={!requiredQuestionsAnswered} onClick={() => dispatch(setIdeaWizardStep(4))}><Icon name="shield" className="mr-2 inline h-4 w-4" />Check: pass or fail</button>
          </div>
        </section>
      )}
      {step === 4 && (
        <section className="rounded-[18px] border bg-[var(--card)] p-5 shadow-soft sm:p-6" style={{ borderColor: validation ? (validationPassed ? "rgba(14,159,122,.42)" : "rgba(30,94,255,.7)") : "var(--line)" }} aria-label="AI validation">
          <div className="flex items-start gap-3">
            <span className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] ${validationPassed ? "bg-[#0e9f7a]/10 text-[#0e9f7a]" : "bg-blue/[.10] text-blue"}`}>
              <Icon name={validationPassed ? "check" : "lock"} className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[19px] font-semibold leading-6">{validation ? validationPassed ? "Validation passed" : "Not taken forward" : "AI validation"}</h2>
                {validation && <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${validationPassed ? "border-[#0e9f7a]/40 bg-[#0e9f7a]/10 text-[#0e9f7a]" : "border-[#d6336c]/40 bg-[#d6336c]/10 text-[#d6336c]"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{validationPassed ? "Pass" : "Fail"}</span>}
                {validationScore !== null && <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={{ borderColor: "var(--line)" }}>AI score {validationScore.toFixed(1)} / 10</span>}
              </div>
              <p className="mt-1 min-h-[66px] text-sm leading-[1.55] text-muted">
                {validation?.auditSummary ?? (validationPassed
                  ? "The idea is clear, actionable, and addresses a real operational pain point."
                  : validation
                    ? "The idea needs more evidence and clearer scope before it can be confidently assessed."
                    : "Check the idea against the bank’s criteria and see what to strengthen.")}
              </p>
            </div>
          </div>
          {created && developmentQuery.isPending && <p className="mt-4 text-sm text-muted" aria-live="polite">Loading validation…</p>}
          {validationInProgress && <p className="mt-4 rounded-lg border px-3 py-2 text-sm text-muted" style={{ borderColor: "var(--line)" }} aria-live="polite">AI is reviewing the current draft…</p>}
          {validationRun && ["failed", "timed_out", "cancelled"].includes(validationRun.status) && !validationInProgress && <p className="mt-4 rounded-lg border border-[#d6336c]/40 px-3 py-2 text-sm text-[#d6336c]" role="alert">{validationRun.errorMessage || "AI validation could not be completed. Run it again before continuing."}</p>}
          {!validation && !validationInProgress && (
            <div className="mt-5 rounded-xl border px-4 py-4 text-sm" style={{ borderColor: "var(--line)" }}>
              <p className="text-muted">{validation ? "Your draft has changed since this result. Save the latest draft and run the AI check again." : "Your idea is ready for the AI pass or fail check."}</p>
              <button className="btn-primary mt-3" type="button" disabled={busy || developmentMutation.isPending || title.trim().length < 3 || summary.trim().length < 10} onClick={() => void requestDevelopment("validate")}>{aiAction === "validate" || developmentMutation.isPending ? "Checking with AI…" : validation ? "Check the updated draft" : "Check: pass or fail"}</button>
            </div>
          )}
          {validation && validationBreakdown && (
            <div className="mt-[34px] overflow-x-auto">
              <table className="w-full min-w-[650px] table-fixed border-collapse text-left text-[12.5px] leading-[1.5]">
                <thead><tr className="border-b text-muted" style={{ borderColor: "var(--line)" }}><th className="w-[120px] px-2.5 pb-2.5 font-normal">Evidence lens</th><th className="w-[70px] px-2.5 pb-2.5 font-normal">Weight</th><th className="w-[135px] px-2.5 pb-2.5 font-normal">Lens score (of 10)</th><th className="px-2.5 pb-2.5 font-normal">Why</th></tr></thead>
                <tbody>
                  {validationBreakdown.rows.map((row) => <tr key={row.label} className="h-[76px] border-b align-top last:border-b-0" style={{ borderColor: "var(--line)" }}>
                    <th className="px-2.5 py-3 font-normal">{row.label}</th>
                    <td className="px-2.5 py-3 font-semibold">{Math.round(row.weight * 100)}%</td>
                    <td className="px-2.5 py-3"><b className="font-semibold">{((row.score / 3) * 10).toFixed(1)} / 10</b><span className="ml-1.5 text-[11px] text-muted"> {scoreBand(row.score)}</span></td>
                    <td className="px-2.5 py-3 text-muted">{row.rationale}</td>
                  </tr>)}
                </tbody>
              </table>
              <div className="mt-2 flex items-center justify-between gap-3 border-t pt-3 text-sm" style={{ borderColor: "var(--line)" }}><span className="text-muted">Overall validation score · pass requires above 7</span><b className="whitespace-nowrap text-ink">{validationScore?.toFixed(1) ?? "—"} / 10</b></div>
            </div>
          )}
          {validation && !validationBreakdown && <p className="mt-4 rounded-lg border p-3 text-sm text-muted" style={{ borderColor: "var(--line)" }}>The AI returned a validation result without the detailed scoring rubric. The overall score and review notes are shown below.</p>}
          {validation && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold">Weaknesses and what to do about them</h3>
              {validation.gaps.length === 0 && validation.nextActions.length === 0 ? <p className="mt-2 text-sm text-muted">No material weaknesses were identified.</p> : <div className="mt-2 space-y-2">
                {(validation.gaps.length ? validation.gaps : validation.nextActions.map((item) => item.action)).slice(0, 5).map((gap, index) => <article key={`${index}-${gap}`} className="rounded-[11px] border px-3.5 py-3" style={{ borderColor: "var(--line)" }}>
                  <p className="text-[13px] font-medium">{gap}</p>
                  {validation.nextActions[index] && <p className="mt-1 text-xs leading-[1.5] text-muted">{validation.nextActions[index].action}{validation.nextActions[index].ownerRole ? ` · Suggested owner: ${validation.nextActions[index].ownerRole}` : ""}</p>}
                </article>)}
              </div>}
              {validation.risks.length > 0 && <p className="mt-3 text-xs leading-[1.5] text-muted"><b className="text-ink">Risks:</b> {validation.risks.map((item) => item.description).join(" · ")}</p>}
              {validation.questions.length > 0 && <p className="mt-3 text-xs leading-[1.5] text-muted"><b className="text-ink">Questions to resolve:</b> {validation.questions.map((item) => item.question).join(" · ")}</p>}
              {validationPassed && validation.strengths.length > 0 && <p className="mt-3 text-xs leading-[1.5] text-muted"><b className="text-ink">Strengths:</b> {validation.strengths.join(" · ")}</p>}
            </div>
          )}
          {validation && !validationPassed && (
            <p className="mt-4 rounded-lg bg-[#d6336c]/[.06] px-3.5 py-3 text-[13px] leading-[1.5] text-[#b4235b]" role="alert">
              {validationScore === null
                ? "Validation returned no usable score. Run validation again before continuing."
                : `Your idea scored ${validationScore?.toFixed(1) ?? "—"} / 10. A score above 7 passes; 7 or below fails. This is failed result ${lowValidationRuns.length} of 2. Improve the draft and check again. After two failed results, you can continue to human review.`}
            </p>
          )}
          {validation && validationPassed && validationIsCurrent && (
            <p className="mt-3 text-sm text-[#0e9f7a]" role="status">This result is for the current draft. You can continue to add the impact numbers.</p>
          )}
          {validationRun?.status === "succeeded" && !validationIsCurrent && !validationInProgress && (
            <p className="mt-3 text-sm text-[#d6336c]" role="alert">
              This result belongs to an older draft. Run validation again for
              the current version.
            </p>
          )}
          {developmentQuery.isError && (
            <p className="mt-3 text-sm text-[#d6336c]" role="alert">
              {errorMessage(developmentQuery.error)}{" "}
              <button
                className="underline"
                onClick={() => void developmentQuery.refetch()}
              >
                Retry
              </button>
            </p>
          )}
          {developmentError && (
            <p className="mt-3 text-sm text-[#d6336c]" role="alert">
              {developmentError}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {validation && !validationPassed && <>
              <button className="btn" type="button" onClick={() => dispatch(setIdeaWizardStep(2))}>Edit draft</button>
              <button className="btn" type="button" disabled={aiAction === "validate" || developmentMutation.isPending} onClick={() => { dispatch(setIdeaWizardStep(2)); void requestDevelopment("enrich"); }}>Improve with AI</button>
              <button className="btn-primary" type="button" disabled={aiAction === "validate" || developmentMutation.isPending || title.trim().length < 3 || summary.trim().length < 10} onClick={() => void requestDevelopment("validate")}>{aiAction === "validate" || developmentMutation.isPending ? "Checking…" : "Check with AI again"}</button>
            </>}
            {canSubmitForHumanReview
              ? <button className="btn-primary" type="button" onClick={() => dispatch(setIdeaWizardStep(5))}>Continue to human review</button>
              : validationPassed
                ? <button className="btn-primary" type="button" disabled={!validationIsCurrent} onClick={() => dispatch(setIdeaWizardStep(5))}>Continue to the numbers</button>
                : null}
          </div>
        </section>
      )}
      {step === 5 && (
        <section className="app-card" aria-label="Impact numbers">
          <h2 className="text-lg font-semibold">Three quick numbers</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Rate the expected impact for each area. Add a short explanation to support your estimate. Your score updates as you type.</p>
          {canSubmitForHumanReview && !validationPassed && (
            <div className="mt-4 rounded-xl border border-sand/40 bg-sand/5 p-4 text-sm" role="status">
              <b>Continuing to human review after two failed AI checks.</b>
              <p className="mt-1 text-muted">Your score remains visible to reviewers. Complete the impact numbers to submit your idea for a person to assess.</p>
            </div>
          )}
          <div className="mt-4 space-y-3.5">
            {(["turnaround", "volume", "value"] as const).map((key) => {
              const labels = { turnaround: "How much faster would the process or service be?", volume: "How many transactions, cases or customers would this affect each month?", value: "How much would this save in cost, or add in revenue, per year?" };
              const units = { turnaround: "Impact rating · 0 to 3", volume: "Impact rating · 0 to 3", value: "Impact rating · 0 to 3" };
              const configured = priorityPolicyQuery.data?.kpis.find((item) => item.key === key);
              return <div key={key} className="grid gap-4 rounded-xl border p-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] sm:items-center sm:p-3.5" style={{ borderColor: "var(--line)"}}><label className="block"><span className="field-label">{labels[key]} <span className="ml-1 text-[10px] font-semibold text-blue">REQUIRED</span></span><div className="mt-2 flex flex-wrap items-center gap-2.5"><input className="input w-full max-w-[150px]" type="number" min="0" max="3" step="0.1" value={impact[key]} onChange={(event) => setImpact((current) => ({ ...current, [key]: event.target.value }))} placeholder="0" aria-label={`${labels[key]} impact rating`} /><span className="text-xs text-muted">{units[key]}</span></div><span className="mt-1 block text-xs text-muted">{configured?.hint ?? "Rate the expected impact from 0 to 3"}{configured ? ` · ${Math.round(configured.weight * 100)}% weight` : ""}</span></label><label className="block"><span className="field-label">Explain your estimate <span className="ml-1 text-[10px] font-semibold text-muted">OPTIONAL</span></span><textarea className="input mt-2 min-h-[70px]" value={metricExplanations[key]} onChange={(event) => setMetricExplanations((current) => ({ ...current, [key]: event.target.value }))} placeholder="Where does this estimate come from? Who is affected? Add supporting details." /></label></div>;
            })}
          </div>
          {priorityPolicyQuery.isPending && <p className="mt-4 text-sm text-muted" role="status">Loading priority policy…</p>}
          {priorityPolicyQuery.isError && <p className="mt-4 text-sm text-[#d6336c]" role="alert">Priority policy could not be loaded. <button className="underline" onClick={() => void priorityPolicyQuery.refetch()}>Retry</button></p>}
          {priorityResult && <div className="mt-4 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--line)" }} aria-live="polite"><p className="font-medium">Live priority score: {priorityResult.score.toFixed(2)} / 3 · {priorityResult.band}</p><p className="mt-1 text-muted">Minimum to submit: {priorityPolicyQuery.data!.minimumScore.toFixed(2)}</p><div className="mt-2 space-y-1">{priorityResult.breakdown.map((item) => <p key={item.key} className="flex justify-between gap-3"><span className="capitalize">{item.key} · {Math.round(item.weight * 100)}%</span><span>{item.score.toFixed(1)} → {item.contribution.toFixed(2)}</span></p>)}</div>{priorityResult.score < priorityPolicyQuery.data!.minimumScore && <p className="mt-2 text-[#d6336c]" role="alert">Increase the impact scores or improve the estimates to meet the submission minimum.</p>}</div>}
          {Boolean(submissionError) && <div className="mt-4 rounded-xl border border-[#d6336c]/40 p-4 text-sm" role="alert"><p className="font-medium text-[#d6336c]">{errorMessage(submissionError)}</p>{submissionRejection && priorityScoreRejected && <p className="mt-1">Server score / minimum: {submissionRejection.score?.toFixed(2) ?? "—"} / {submissionRejection.minimumScore?.toFixed(2) ?? "—"}{submissionRejection.priorityBand ? ` · ${submissionRejection.priorityBand}` : ""}</p>}{submissionRejection?.breakdown.map((item) => <p className="mt-1 flex justify-between gap-3" key={item.key}><span className="capitalize">{item.key} · {Math.round(item.weight * 100)}%</span><span>{item.score.toFixed(1)} → {item.contribution.toFixed(2)}</span></p>)}{priorityScoreRejected && <p className="mt-2 text-muted">Adjust the impact numbers to meet the server minimum, then submit again.</p>}</div>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn" type="button" onClick={() => dispatch(setIdeaWizardStep(4))}>Back to validation</button>
            <button className="btn-primary" type="button" disabled={!fieldsValid || busy || validationBlocked || !priorityResult || priorityResult.score < priorityPolicyQuery.data!.minimumScore} onClick={() => void submit(canSubmitForHumanReview && !validationPassed)}>{busy ? "Submitting…" : canSubmitForHumanReview && !validationPassed ? "Submit for human review" : "Submit idea"}</button>
          </div>
        </section>
      )}
      {step === 1 && (
        <div className="app-card">
          <div
            className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-xl border bg-white p-1"
            style={{ borderColor: "var(--line)" }}
          >
            {[
              ["idea", "💡 An idea"],
              ["problem", "🔎 A problem"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setKind(value as IdeaKind)}
                className={`rounded-[9px] px-3.5 py-2 text-[13.5px] font-medium ${kind === value ? "bg-blue text-white" : "text-muted hover:bg-[var(--hover)]"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="mt-5 block">
            <span className="field-label">
              {kind === "idea"
                ? "Your idea in your own words"
                : "What is slowing customers or colleagues down?"}
            </span>
            <textarea
              className="input min-h-[112px] resize-y"
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              placeholder="Describe it in your own words…"
            />
          </label>
          {(!searchMatches || candidateQuery.isPending) && raw.trim().length >= 4 && (
            <p className="mt-3 text-sm text-muted" aria-live="polite">
              Searching registered ideas…
            </p>
          )}
          {searchMatches && candidateQuery.isError && (
            <p className="mt-3 text-sm text-[#d6336c]" role="alert">
              Could not load related ideas: {errorMessage(candidateQuery.error)}{" "}
              <button className="underline" type="button" onClick={() => void candidateQuery.refetch()}>Retry</button>
            </p>
          )}
          {searchMatches && raw.trim().length >= 4 && (candidateQuery.data?.items.length ?? 0) > 0 && (
            <div
              className="mt-4 rounded-xl border p-3"
              style={{ borderColor: "var(--line-strong)" }}
            >
              <p className="font-medium">Potentially related ideas</p>
              <p className="mt-1 text-sm text-muted">
                Choose an original to build on, or explain at least 20
                characters of what makes your proposal different.
              </p>
              <div className="mt-2 space-y-2">
                {candidateQuery.data?.items.map((candidate) => (
                  <label
                    key={candidate.id}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-sm"
                    style={{
                      borderColor:
                        buildsOnId === candidate.id
                          ? "var(--blue)"
                          : "var(--line)",
                    }}
                  >
                    <input
                      type="radio"
                      name="buildsOn"
                      checked={buildsOnId === candidate.id}
                      onChange={() => setBuildsOnId(candidate.id)}
                    />
                    <span>
                      <b>{candidate.title}</b>
                      <span className="block text-muted">
                        {candidate.reference} · {candidate.summary}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <label className="mt-3 block">
                <span className="field-label">How is your idea different?</span>
                <textarea
                  className="input min-h-[76px]"
                  maxLength={2000}
                  value={differentiation}
                  onChange={(event) => setDifferentiation(event.target.value)}
                  placeholder="Describe the new contribution (at least 20 characters if not selecting an original)."
                />
              </label>
              <span className="text-xs text-muted">
                {differentiation.trim().length}/20 characters
              </span>
              {unresolvedOriginality && <p className="mt-2 text-sm text-[#d6336c]" role="alert">Select an original idea or enter at least 20 characters describing your new contribution.</p>}
            </div>
          )}
          {searchMatches && raw.trim().length >= 4 && candidateQuery.data?.items.length === 0 && (
            <label className="mt-4 block">
              <span className="field-label">
                Differentiation from existing work (optional)
              </span>
              <textarea
                className="input min-h-[76px]"
                maxLength={2000}
                value={differentiation}
                onChange={(event) => setDifferentiation(event.target.value)}
                placeholder="If the server finds a similar idea, explain your new contribution here."
              />
            </label>
          )}
          <button
            className="btn-primary mt-4"
            disabled={raw.trim().length < 10 || !searchMatches || candidateQuery.isPending || unresolvedOriginality}
            onClick={() => void startIdeaDevelopment()}
          >
            <Icon name="spark" /> Develop with AI
          </button>
          {(savedDrafts.length > 0 || savedDraftsQuery.isError || resumeDraftQuery.isError || resumeDraftError) && <details className="mt-4 border-t pt-3" style={{ borderColor: "var(--line)" }} aria-label="Saved drafts">
            <summary className="cursor-pointer text-sm font-medium">Your saved drafts{savedDrafts.length > 1 ? ` · ${savedDrafts.length}` : ""}</summary>
            {savedDraftsQuery.isError && <p className="mt-2 text-sm text-[#d6336c]" role="alert">Could not load drafts: {errorMessage(savedDraftsQuery.error)} <button className="underline" type="button" onClick={() => void savedDraftsQuery.refetch()}>Retry</button></p>}
            {savedDrafts.length > 0 && <ul className="mt-2 space-y-1.5">{savedDrafts.map((draft) => <li key={draft.id} className="flex flex-wrap items-center gap-2" data-testid={`saved-draft-${draft.id}`}><span className="min-w-0 flex-1 truncate text-sm">{draft.title}</span><button className="btn btn-small shrink-0" type="button" disabled={Boolean(resumeDraftId) || deleteDraftMutation.isPending} onClick={() => { setResumeDraftError(null); setResumeDraftId(draft.id); }}>{resumeDraftId === draft.id && resumeDraftQuery.isPending ? "Loading…" : "Resume draft"}</button><button className="btn btn-small shrink-0 text-[#b4235b]" type="button" disabled={deleteDraftMutation.isPending} aria-label={`Delete draft: ${draft.title}`} onClick={() => { deleteDraftMutation.reset(); setDraftToDelete(draft); }}>Delete</button></li>)}</ul>}
            {resumeDraftQuery.isError && <p className="mt-2 text-sm text-[#d6336c]" role="alert">Could not open this draft: {errorMessage(resumeDraftQuery.error)} <button className="underline" type="button" onClick={() => void resumeDraftQuery.refetch()}>Retry</button></p>}
            {resumeDraftError && <p className="mt-2 text-sm text-[#d6336c]" role="alert">{resumeDraftError}</p>}
            {deleteDraftMutation.isError && !draftToDelete && <p className="mt-2 text-sm text-[#d6336c]" role="alert">Could not delete draft: {errorMessage(deleteDraftMutation.error)}</p>}
          </details>}
        </div>
      )}
      <Dialog open={Boolean(draftToDelete)} onClose={() => { if (!deleteDraftMutation.isPending) setDraftToDelete(null); }} className="relative z-[90]">
        <div className="fixed inset-0 bg-[rgba(3,10,30,.55)] backdrop-blur-[3px]" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
          <DialogPanel className="w-full max-w-[440px] rounded-[20px] border bg-white p-6 shadow-2xl" style={{ borderColor: "var(--line)" }}>
            <DialogTitle className="text-lg font-semibold text-ink">Delete this saved draft?</DialogTitle>
            <p className="mt-2 text-sm leading-6 text-muted">“{draftToDelete?.title}” and its saved draft work will be permanently deleted. Submitted ideas cannot be deleted from here.</p>
            {deleteDraftMutation.isError && <p className="mt-3 rounded-lg bg-[#d6336c]/[.07] p-3 text-sm text-[#b4235b]" role="alert">{errorMessage(deleteDraftMutation.error)}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn" type="button" disabled={deleteDraftMutation.isPending} onClick={() => { setDraftToDelete(null); deleteDraftMutation.reset(); }}>Cancel</button>
              <button className="btn-primary bg-[#b4235b] hover:bg-[#941b49]" type="button" disabled={deleteDraftMutation.isPending || !draftToDelete} onClick={async () => {
                if (!draftToDelete) return;
                const deletedId = draftToDelete.id;
                try {
                  await deleteDraftMutation.mutateAsync(deletedId);
                  if (resumeDraftId === deletedId) setResumeDraftId(null);
                  if (created?.idea.id === deletedId) {
                    setCreated(null);
                    setRaw(""); setTitle(""); setSummary("");
                    setDetails({ problem: "", solution: "", benefits: "", risks: "" });
                    setImpact({ turnaround: "", volume: "", value: "" });
                    setBuildsOnId(undefined); setDifferentiation("");
                    setMetricExplanations({ turnaround: "", volume: "", value: "" });
                    setSubmitResult(null); setSubmitError(null); setSubmitForHumanReview(false);
                    setDevelopmentError(null); setQuestionError(null); setQuestionAnswers({});
                    setContinueWithoutQuestions(false); setPendingQuestions(false); setQuestionVersionId(null);
                    setAiAction(null); setActiveDevelopmentRun(null); setAppliedRunId(null);
                    setValidatedContent(null); validationSnapshot.current = null;
                    dispatch(resetIdeaWizard());
                  }
                  setDraftToDelete(null);
                } catch {
                  // Keep the confirmation open so the user can read the error and retry.
                }
              }}>{deleteDraftMutation.isPending ? "Deleting…" : "Delete draft"}</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}

const lifecycle = [
  "Submitted",
  "Business review",
  "Review",
  "Confirmation",
  "Proof of concept",
  "Implementation",
  "Impact",
];

export function EmployeeIdeaDetailPage({
  ideaId,
  onBack,
}: {
  ideaId: number;
  onBack: () => void;
}) {
  const profileQuery = useEmployeeProfile();
  const detailQuery = useIdea(ideaId);
  const commentsQuery = useIdeaComments(ideaId, {}, Boolean(detailQuery.data?.idea && detailQuery.data.idea.status !== "draft"));
  const supportMutation = useSupportIdea();
  const commentMutation = useAddIdeaComment();
  const updateMutation = useUpdateIdea();
  const submitMutation = useSubmitIdea();
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({
    title: "",
    summary: "",
    problem: "",
    solution: "",
    benefits: "",
    risks: "",
  });
  const idea = detailQuery.data?.idea;
  const canSupportIdea = Boolean(idea && profileQuery.data && idea.authorId !== profileQuery.data.id);
  const author = idea ? ideaAuthor(idea) : { name: "Contributor", department: undefined };
  const activeStage = idea ? ({ draft: -1, screening: 0, returned: 0, business_review: 1, control_review: 2, decision: 3, poc: 4, implementation: 5, implemented: 6, rejected: -1, deferred: -1 }[idea.status]) : -1;
  const comments =
    commentsQuery.data?.items ?? detailQuery.data?.comments.items ?? [];
  const startEdit = () => {
    if (!idea) return;
    setEdit({
      title: idea.title,
      summary: idea.summary,
      problem: idea.problem ?? "",
      solution: idea.solution ?? "",
      benefits: idea.benefits ?? "",
      risks: idea.risks ?? "",
    });
    setEditing(true);
  };
  const saveAndResubmit = async () => {
    if (!idea) return;
    try {
      const result = await updateMutation.mutateAsync({
        id: idea.id,
        input: edit,
      });
      const versionId = Number(
        (result.version as { id?: number } | undefined)?.id,
      );
      await submitMutation.mutateAsync({
        id: idea.id,
        versionId: Number.isInteger(versionId) ? versionId : undefined,
      });
      setEditing(false);
    } catch {
      /* mutation errors are shown in the editor */
    }
  };
  if (detailQuery.isPending)
    return (
      <StateMessage
        title="Loading idea…"
        detail="Getting the proposal and its discussion."
      />
    );
  if (detailQuery.isError || !idea)
    return (
      <StateMessage
        title="Idea unavailable"
        detail={
          detailQuery.isError
            ? errorMessage(detailQuery.error)
            : "This idea may have been removed."
        }
        action={
          <button className="btn" onClick={onBack}>
            Back to community
          </button>
        }
      />
    );
  return (
    <div className="stack">
      <button className="btn btn-small self-start" onClick={onBack}>
        <Icon name="back" className="h-4 w-4" /> Back to Community
      </button>
      <section className="app-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusPill tone="blue">{idea.category}</StatusPill>
          <StatusPill tone={idea.status === "returned" ? "sand" : "blue"}>
            {statusLabels[idea.status]}
          </StatusPill>
        </div>
        <h1 className="mt-4 text-[28px] font-medium leading-tight">
          {idea.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Avatar name={author.name} />
          <span className="text-sm">
            <b className="font-medium">{author.name}</b>{" "}
            <span className="text-muted">{author.department}</span>
          </span>
          <span className="ml-auto font-mono text-xs text-muted">
            {idea.reference}
          </span>
        </div>
        {idea.status !== "draft" && <div className="my-7 overflow-x-auto pb-2" aria-label="Idea progress">
          <ol className="grid min-w-[620px] grid-cols-7 gap-0">
            {lifecycle.map((stage, index) => (
              <li key={stage} aria-current={index === activeStage ? "step" : undefined} className={`relative text-center text-xs ${index === activeStage ? "text-sand" : index < activeStage ? "text-blue" : "text-muted"}`}>
                {index < lifecycle.length - 1 && <span className="absolute left-1/2 right-[-50%] top-5 border-t border-[var(--line-strong)]" aria-hidden="true" />}
                <span className={`relative mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full border bg-white ${index === activeStage ? "border-sand ring-4 ring-sand/10" : "border-[var(--line-strong)]"}`}><Icon name={index < activeStage ? "check" : (["spark", "msg", "shield", "check", "bot", "arrow", "up"] as const)[index]} /></span>
                <span>{stage}</span>
              </li>
            ))}
          </ol>
        </div>}
        {editing ? (
          <div className="space-y-4">
            <label className="block">
              <span className="field-label">Idea title</span>
              <input
                className="input"
                value={edit.title}
                onChange={(event) =>
                  setEdit((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </label>
            <label className="block">
              <span className="field-label">Summary</span>
              <textarea
                className="input min-h-[90px]"
                value={edit.summary}
                onChange={(event) =>
                  setEdit((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
              />
            </label>
            {developFields.map((field) => (
              <label key={field.key} className="block">
                <span className="field-label">{field.label}</span>
                <textarea
                  className="input min-h-[90px]"
                  value={edit[field.key]}
                  onChange={(event) =>
                    setEdit((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
            {(updateMutation.isError || submitMutation.isError) && (
              <p
                className="rounded-xl border border-pink/30 bg-pink/10 p-3 text-sm text-[#d6336c]"
                role="alert"
              >
                {errorMessage(updateMutation.error ?? submitMutation.error)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={updateMutation.isPending || submitMutation.isPending}
                onClick={() => void saveAndResubmit()}
              >
                {updateMutation.isPending || submitMutation.isPending
                  ? "Resubmitting…"
                  : "Save and resubmit"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="flex gap-2 rounded-xl border p-3 text-sm"
              style={{ borderColor: "var(--line-strong)" }}
            >
              <Icon name="lock" className="mt-0.5 h-5 w-5 shrink-0 text-blue" />
              <div>
                <b className="font-medium">Registered to {author.name}{author.department ? `, ${author.department}` : ""}</b>
                <p className="text-muted">
                  {idea.status === "draft" ? `Draft ${idea.reference} is visible only to you.` : `Record ${idea.reference}. Supporters and commenters are credited by name.`}
                </p>
              </div>
            </div>
            <p className="mt-5 text-base">{idea.summary}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                ["Problem", idea.problem],
                ["Solution", idea.solution],
                ["Expected benefits", idea.benefits],
                ["Risks", idea.risks],
              ].map(([label, value]) => (
                <div className="tile" key={label}>
                  <small className="block text-xs text-muted">{label}</small>
                  <span>{value || "Not provided yet."}</span>
                </div>
              ))}
            </div>
            {idea.status === "draft" && <p className="mt-4 text-sm text-muted">This draft is private until AI validation and final submission finish.</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {idea.status !== "draft" && canSupportIdea &&
              <button
                className="btn-primary"
                disabled={supportMutation.isPending}
                onClick={() => supportMutation.mutate(idea.id)}
              >
                <Icon name="up" />{" "}
                {supportMutation.isPending
                  ? "Supporting…"
                  : `${idea.supports} Support this idea`}
              </button>}
              {idea.status !== "draft" && profileQuery.data?.id === idea.authorId && (
                <p className="self-center text-sm text-muted">You can support colleagues’ ideas, but not your own.</p>
              )}
              {idea.status === "returned" && (
                <button className="btn" onClick={startEdit}>
                  Edit and resubmit
                </button>
              )}
            </div>
            {supportMutation.isError && (
              <p className="mt-3 text-sm text-[#d6336c]" role="alert">
                {errorMessage(supportMutation.error)}
              </p>
            )}
          </>
        )}
      </section>
      {idea.status !== "draft" && <section className="app-card">
        <h2 className="text-xl font-medium">
          Discussion{" "}
          <span className="font-normal text-muted">
            ({commentsQuery.isPending ? "…" : comments.length})
          </span>
        </h2>
        {commentsQuery.isError ? (
          <p className="mt-2 text-sm text-[#d6336c]" role="alert">
            {errorMessage(commentsQuery.error)}
          </p>
        ) : comments.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No comments yet. Be the first.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {comments.map((item) => (
              <div
                className="rounded-xl border p-3"
                key={item.id}
                style={{ borderColor: "var(--line)" }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Avatar name={item.author?.name ?? "Member"} />
                  <b className="font-medium">
                    {item.author?.name ?? "Community member"}
                  </b>
                  <span className="text-xs text-muted">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-end gap-2">
          <textarea
            className="input min-h-[76px]"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            aria-label="Add a comment or a suggestion"
            placeholder="Add a comment or a suggestion"
          />
          <button
            className="btn-primary"
            disabled={!comment.trim() || commentMutation.isPending}
            onClick={() => {
              void commentMutation
                .mutateAsync({ id: idea.id, body: comment.trim() })
                .then(() => setComment(""))
                .catch(() => undefined);
            }}
          >
            {commentMutation.isPending ? "Posting…" : "Post"}
          </button>
        </div>
        {commentMutation.isError && (
          <p className="mt-2 text-sm text-[#d6336c]" role="alert">
            {errorMessage(commentMutation.error)}
          </p>
        )}
      </section>}
    </div>
  );
}
