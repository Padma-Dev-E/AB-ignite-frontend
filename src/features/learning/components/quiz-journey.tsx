"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { LearningState } from "./learning-cards";
import { useQuizAttempt, useQuizzes, useStartQuizAttempt, useSubmitQuizAttempt } from "../hooks";
import type { QuizAnswer, QuizQuestion, QuizSummary } from "../types";
import { parseQuizResume, reconcileQuizResume, serializeQuizResume, type QuizResume } from "./quiz-resume";
import { useLearningJourney } from "../hooks";

const panel = "rounded-[20px] border border-[var(--line)] bg-white p-6 shadow-[0_1px_2px_rgba(11,40,100,0.05),0_10px_26px_-14px_rgba(11,40,100,0.2)]";
const action = "btn btn-primary min-h-10 disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "btn min-h-10 disabled:cursor-not-allowed disabled:opacity-50";
const resumeStorageKey = "ab-ignite-learning-active-attempt";

function errorText(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
function topicLabel(value: string) { return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function secondsLeft(expiresAt: string | null, now: number) {
  return expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000)) : null;
}
function formatTime(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }

const categoryLabels: Record<string, string> = { banking: "Banking Excellence", banking_excellence: "Banking Excellence", transformation: "Innovation & Business Transformation", technology: "Technology & AI" };
const levelLabels: Record<string, string> = { beginner: "Foundation", foundation: "Foundation", intermediate: "Intermediate", advanced: "Advanced", expert: "Expert Challenge", "expert challenge": "Expert Challenge" };
const levelColors: Record<string, string> = { Foundation: "#0e9f7a", Intermediate: "#1e5eff", Advanced: "#6d4bd8", "Expert Challenge": "#d97706" };
function levelLabel(value: string) { return levelLabels[value.toLowerCase()] ?? value; }
function categoryGroup(value: string) {
  const key = value.toLowerCase();
  if (categoryLabels[key]) return key === "banking_excellence" ? "banking" : key;
  return /^(?:topic2?|question-topic|article-topic)-\d/.test(key) ? "__other__" : key;
}
function categoryLabel(value: string) {
  if (value === "__other__") return "Other";
  return categoryLabels[value.toLowerCase()] ?? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function QuizCatalogue({ quizzes, pendingId, onSelect, error }: { quizzes: QuizSummary[]; pendingId?: number; onSelect: (quiz: QuizSummary) => void; error?: string }) {
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => {
    const groups = new Set(quizzes.filter((quiz) => quiz.questionCount > 0).map((quiz) => categoryGroup(quiz.category)));
    return ["banking", "transformation", "technology"].filter((item) => groups.has(item)).concat(Array.from(groups).filter((item) => !["banking", "transformation", "technology"].includes(item)).sort());
  }, [quizzes]);
  const visibleCategories = category === "all" ? categories : categories.filter((item) => item === category);
  if (!quizzes.some((quiz) => quiz.questionCount > 0)) return <LearningState state="empty" label="No quizzes are available right now. Check back soon." />;
  return <div className="space-y-5">{error && <p className={`${panel} border-red-200 text-sm text-red-800`} role="alert">{error}</p>}
    <div className="inline-flex max-w-full flex-nowrap gap-0.5 overflow-x-auto rounded-xl border border-[var(--line)] bg-white p-1" role="tablist" aria-label="Quiz categories">
      {[{ id: "all", label: "All" }, ...categories.map((value) => ({ id: value, label: categoryLabel(value) }))].map((item) => <button key={item.id} type="button" role="tab" aria-selected={category === item.id} className={`rounded-[9px] px-3.5 py-2 text-[13.5px] font-medium transition ${category === item.id ? "bg-[#1e5eff] text-white" : "text-[var(--muted)] hover:bg-[var(--hover)]"}`} onClick={() => setCategory(item.id)}>{item.label}</button>)}
    </div>
    <p className="-mt-2 max-w-4xl text-sm leading-6 text-[var(--muted)]">Four levels in each category, from Foundation to Expert Challenge. Scenario, case-study and data questions test judgement, not memory. Every answer comes with an explanation.</p>
    {visibleCategories.map((group) => {
      const items = quizzes.filter((quiz) => quiz.questionCount > 0 && categoryGroup(quiz.category) === group);
      if (!items.length) return null;
      return <section key={group} aria-labelledby={`quiz-category-${group}`} className="space-y-4">
        <div className="flex items-baseline justify-between gap-3"><h2 id={`quiz-category-${group}`} className="text-xl font-semibold tracking-[-.015em] text-[var(--text)]">{categoryLabel(group)}</h2><span className="text-sm text-[var(--muted)]">{items.length} quizzes</span></div>
        <ul className="grid gap-[18px] md:grid-cols-2">{items.map((quiz) => <li key={quiz.id}>
          <article className={`${panel} flex h-full flex-col gap-3`}>
            <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-[11px]" style={{ color: levelColors[quiz.level] ?? "#1e5eff", background: `color-mix(in srgb, ${levelColors[quiz.level] ?? "#1e5eff"} 14%, transparent)` }} aria-hidden="true">⚡</span><div className="min-w-0 flex-1"><h3 className="text-base font-semibold leading-snug text-[var(--text)]">{quiz.title}</h3><p className="mt-1 text-sm leading-5 text-[var(--muted)]">{quiz.objective}</p></div></div>
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border px-2.5 py-[3px] text-xs font-medium" style={{ color: levelColors[levelLabel(quiz.level)] ?? "#1e5eff", borderColor: `color-mix(in srgb, ${levelColors[levelLabel(quiz.level)] ?? "#1e5eff"} 48%, transparent)` }}>{levelLabel(quiz.level)}</span><span className="text-xs text-[var(--muted)]">{quiz.questionCount} questions · pass {quiz.passMark}%{quiz.timeLimitSeconds ? ` · ${Math.round(quiz.timeLimitSeconds / 60)} min limit` : ""} · {quiz.pointsPerQuestion ?? 0} pts each</span></div>
            {quiz.attemptCount ? <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-medium ${Number(quiz.latestScorePercent ?? 0) >= quiz.passMark ? "border-[color-mix(in_srgb,var(--teal)_55%,transparent)] text-[var(--teal)]" : "border-[var(--line-strong)] text-[var(--muted)]"}`}><i className="size-1.5 rounded-full bg-current" />Latest {quiz.latestScorePercent ?? 0}%{quiz.attemptCount > 1 && quiz.firstScorePercent !== null && quiz.firstScorePercent !== undefined ? ` (first ${quiz.firstScorePercent}%)` : ""}</span><button type="button" className={`${secondary} btn-small`} disabled={pendingId !== undefined} onClick={() => onSelect(quiz)}>{pendingId === quiz.id ? "Loading…" : "Retake"}</button></div>
              : <div className="border-t border-[var(--line)] pt-3"><button type="button" className={`${action} btn-small`} disabled={pendingId !== undefined} onClick={() => onSelect(quiz)}>{pendingId === quiz.id ? "Loading…" : "Start"}</button></div>}
          </article>
        </li>)}</ul>
      </section>;
    })}
  </div>;
}

function QuizDetail({ quiz, pending, error, onStart, onBack }: { quiz: QuizSummary | null; pending: boolean; error?: string; onStart: (quiz: QuizSummary) => void; onBack: () => void }) {
  return <div className="space-y-[26px]">
    <button type="button" className="btn btn-small px-4 py-[7px]" onClick={onBack}>← All quizzes</button>
    <section className={panel} aria-labelledby="related-quiz-title">
    {quiz ? <>
      <div className="flex flex-wrap items-center gap-2"><span className="pill">{categoryLabel(categoryGroup(quiz.category))}</span><span className="pill" style={{ color: levelColors[levelLabel(quiz.level)] ?? "#1e5eff", borderColor: `color-mix(in srgb, ${levelColors[levelLabel(quiz.level)] ?? "#1e5eff"} 45%, transparent)` }}>{levelLabel(quiz.level)}</span></div>
      <h2 id="related-quiz-title" className="mt-3 text-[26px] font-semibold tracking-[-.02em] text-[var(--text)]">{quiz.title}</h2>
      <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[var(--muted)]">{quiz.objective}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Quiz overview">
        {[{ label: "Questions", value: quiz.questionCount }, { label: "Time limit", value: quiz.timeLimitSeconds ? `${Math.ceil(quiz.timeLimitSeconds / 60)} minutes` : "No time limit" }, { label: "Pass mark", value: `${quiz.passMark}%` }].map((item) => <div key={item.label} className="rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--blue)_4%,white)] px-4 py-3"><span className="block text-xs text-[var(--muted)]">{item.label}</span><b className="mt-1 block text-lg font-semibold text-[var(--text)]">{item.value}</b></div>)}
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--muted)]"><b className="text-[var(--text)]">Scoring.</b> Each question carries a weight set by its difficulty. Your score is the share of weighted points earned. Ignite Points are paid per correct answer on the first attempt.{quiz.attemptCount ? ` Your previous attempt: ${quiz.latestScorePercent ?? 0}%${quiz.latestAttemptAt ? ` on ${new Date(quiz.latestAttemptAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : ""}.` : ""}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Question types: multiple choice and best next action. Answers are checked on the server when you finish, and you’ll see the correct answer for every question.</p>
      {error && <p className="mt-4 text-sm text-red-800" role="alert">{error}</p>}
      <button type="button" className={`${action} mt-5`} disabled={pending} onClick={() => onStart(quiz)}>{pending ? "Starting…" : quiz.attemptCount ? "Start again" : "Start quiz"}</button>
    </> : <p id="related-quiz-title" className="text-slate-700" role="status">This quiz is no longer available.</p>}
    </section>
  </div>;
}

export function QuizResult({ result, topics = [], answerReview = [], quizTitle, level, onReplay, onJourney, onReadArticle, onRetakeRelatedQuiz, recommendedArticles = [] }: { result: NonNullable<ReturnType<typeof useQuizAttempt>["data"]>["result"]; topics?: Array<{ topic: string; correctCount: number; totalQuestions: number; scorePercent: number }>; answerReview?: Array<{ questionId: number; topic: string; prompt: string; selectedOptionKey: string | null; correctOptionKey: string | null; correct: boolean; options: Array<{ optionKey: string; label: string }> }>; quizTitle?: string; level?: string; onReplay: () => void; onJourney?: () => void; onReadArticle?: (articleId: number) => void; onRetakeRelatedQuiz?: (quizId: number) => void; recommendedArticles?: NonNullable<ReturnType<typeof useLearningJourney>["data"]>["recommendedArticles"] }) {
  if (!result) return <LearningState state="loading" label="Loading your quiz result…" />;
  const expired = result.status === "expired";
  const scoreColor = expired || !result.passed ? "#d97706" : "#0e9f7a";
  const letters = (key: string | null) => key ? key.toUpperCase() : null;
  return <div className="space-y-[18px]">
    <section className={`${panel} text-center`} aria-labelledby="quiz-result-title">
      <div className="relative mx-auto grid size-[170px] place-items-center rounded-full" style={{ background: `conic-gradient(${scoreColor} ${result.scorePercent * 3.6}deg, color-mix(in srgb, var(--blue) 14%, transparent) 0deg)` }} role="img" aria-label={`${result.scorePercent}% score`}><div className="grid size-[150px] place-content-center rounded-full bg-white"><span className="text-[42px] font-semibold leading-none text-[var(--text)]">{result.scorePercent}%</span><span className="mt-1 text-sm text-[var(--muted)]">{result.correctCount} of {result.totalQuestions}</span></div></div>
      <h2 id="quiz-result-title" className="mt-4 text-2xl font-semibold text-[var(--text)]">{expired ? "Your attempt expired" : result.passed ? result.scorePercent >= 90 ? "Excellent" : "Passed" : "Below the pass mark"} <span aria-hidden="true">{result.passed ? "🎉" : "📘"}</span></h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{expired ? "Your answers were submitted when the server timer expired." : `${quizTitle ? `${quizTitle}, ` : ""}${level ? `${level}. ` : ""}Pass mark ${result.passMark}%.`}{result.previousScorePercent !== null && result.previousScorePercent !== undefined ? ` Previous attempt ${result.previousScorePercent}% (${result.scorePercent - result.previousScorePercent >= 0 ? "+" : ""}${result.scorePercent - result.previousScorePercent}).` : ""} {result.firstAttempt ? `You earned ${result.pointsAwarded} Ignite Points.` : "Points are paid on the first attempt only."}</p>
      {!expired && <div className="mx-auto mt-4 inline-flex rounded-full border border-[var(--line-strong)] px-3 py-1 text-sm font-medium text-[var(--text)]">{result.pointsAwarded > 0 ? `💡 ${result.pointsAwarded} Ignite Points earned` : result.pointsStatus === "pending" ? "Points are being processed" : result.firstAttempt ? "No points earned this attempt" : "Points are awarded on the first attempt only"}</div>}
      <div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" className={action} onClick={onJourney}>Open my learning journey</button><button type="button" className={secondary} onClick={onReplay}>All quizzes</button></div>
    </section>
    {!!topics.length && <section className={panel} aria-labelledby="result-topics"><h2 id="result-topics" className="text-xl font-semibold text-[var(--text)]">Performance by topic</h2><p className="mt-1 text-sm text-[var(--muted)]">A handful of questions is a pointer, not a verdict.</p><ul className="mt-3 divide-y divide-[var(--line)]">{topics.map((topic) => <li key={topic.topic} className="grid grid-cols-[minmax(130px,1fr)_minmax(100px,1.4fr)_44px] items-center gap-3 py-3"><span><b className="text-sm font-medium text-[var(--text)]">{topicLabel(topic.topic)}</b><small className="block text-xs text-[var(--muted)]">{topic.correctCount} of {topic.totalQuestions} correct</small></span><div className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--blue)_14%,transparent)]"><span className="block h-full rounded-full" style={{ width: `${topic.scorePercent}%`, background: topic.scorePercent >= 80 ? "var(--teal)" : topic.scorePercent >= 60 ? "var(--blue)" : "var(--sand)" }} /></div><b className="text-right text-sm font-semibold tabular-nums text-[var(--text)]">{topic.scorePercent}%</b></li>)}</ul></section>}
    {!!recommendedArticles?.length && <section className={panel} aria-labelledby="result-reading"><h2 id="result-reading" className="text-xl font-semibold text-[var(--text)]">Recommended for you</h2><ul className="mt-3 grid gap-3 md:grid-cols-2">{recommendedArticles.slice(0, 2).map((article) => <li key={article.id} className="rounded-xl border border-[var(--line)] p-4"><h3 className="font-medium text-[var(--text)]">{article.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">{article.recommendation.reason}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" className="btn btn-small btn-primary" onClick={() => onReadArticle?.(article.id)}>Read</button>{article.relatedQuizId && <button type="button" className="btn btn-small" onClick={() => onRetakeRelatedQuiz?.(article.relatedQuizId!)}>Retake a related quiz</button>}</div></li>)}</ul></section>}
    {!!answerReview.length && <section className={`${panel} space-y-5`} aria-labelledby="answer-review"><h2 id="answer-review" className="text-xl font-semibold text-[var(--text)]">Review every answer</h2>{answerReview.map((item, index) => <article key={item.questionId} className="border-t border-[var(--line)] pt-4 first:border-0 first:pt-0"><span className="pill">{topicLabel(item.topic)}</span><h3 className="mt-2 font-medium leading-6 text-[var(--text)]">{index + 1}. {item.prompt}</h3><ul className="mt-3 space-y-2">{item.options.map((option) => { const correct = option.optionKey === item.correctOptionKey; const selected = option.optionKey === item.selectedOptionKey; return <li key={option.optionKey} className={`rounded-lg border px-3 py-2.5 text-sm ${correct ? "border-[color-mix(in_srgb,var(--teal)_45%,transparent)] bg-[color-mix(in_srgb,var(--teal)_7%,white)]" : selected ? "border-[color-mix(in_srgb,var(--err,#c22b45)_40%,transparent)] bg-[color-mix(in_srgb,var(--err,#c22b45)_5%,white)]" : "border-[var(--line)]"}`}><span className="mr-2 font-semibold">{letters(option.optionKey)}.</span>{option.label}{correct && <span className="ml-2 text-xs font-medium text-[var(--teal)]">Correct answer</span>}{selected && !correct && <span className="ml-2 text-xs font-medium text-red-700">Your answer</span>}{item.selectedOptionKey === null && correct && <span className="ml-2 text-xs text-[var(--muted)]">Not answered</span>}</li>; })}</ul><p className={`mt-2 text-sm font-medium ${item.correct ? "text-[var(--teal)]" : "text-[var(--sand)]"}`}>{item.correct ? "Correct." : "Not quite."}</p></article>)}</section>}
  </div>;
}

export function QuizJourney({ relatedQuizId, onFullscreenChange, onOpenJourney, onReadArticle }: { relatedQuizId?: number | null; onFullscreenChange?: (fullscreen: boolean) => void; onOpenJourney?: () => void; onReadArticle?: (articleId: number) => void }) {
  const catalogue = useQuizzes();
  const journey = useLearningJourney();
  const start = useStartQuizAttempt();
  const submit = useSubmitQuizAttempt();
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(relatedQuizId ?? null);
  const [resumeReady, setResumeReady] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [online, setOnline] = useState(true);
  const timeoutSubmittedFor = useRef<number | null>(null);
  const restoredDraft = useRef<QuizResume | null>(null);
  const attemptQuery = useQuizAttempt(attemptId ?? 0, attemptId !== null);
  const attempt = attemptQuery.data?.attempt;
  const questions = attempt?.questions ?? [];
  const currentQuestion = questions[questionIndex];
  const remaining = secondsLeft(attempt?.expiresAt ?? null, now);
  const answerList = useMemo<QuizAnswer[]>(() => questions.flatMap((question) => answers[question.id] ? [{ questionId: question.id, optionKey: answers[question.id] }] : []), [answers, questions]);

  useEffect(() => { onFullscreenChange?.(selectedQuizId !== null || attemptId !== null); }, [selectedQuizId, attemptId, onFullscreenChange]);

  useEffect(() => { setSelectedQuizId(relatedQuizId ?? null); }, [relatedQuizId]);

  useEffect(() => {
    if (relatedQuizId != null) { restoredDraft.current = null; setAttemptId(null); setResumeReady(true); return; }
    try {
      const draft = parseQuizResume(window.sessionStorage.getItem(resumeStorageKey));
      restoredDraft.current = draft;
      if (draft) setAttemptId(draft.attemptId);
      else setResumeReady(true);
    } catch { setResumeReady(true); }
  }, [relatedQuizId]);
  useEffect(() => {
    if (attemptId === null || !resumeReady) return;
    try { window.sessionStorage.setItem(resumeStorageKey, serializeQuizResume({ attemptId, questionIndex, answers })); } catch { /* Session storage can be unavailable. */ }
  }, [attemptId, resumeReady, questionIndex, answers]);
  useEffect(() => {
    const updateConnection = () => setOnline(window.navigator.onLine);
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => { window.removeEventListener("online", updateConnection); window.removeEventListener("offline", updateConnection); };
  }, []);
  useEffect(() => {
    if (!attempt || !restoredDraft.current || attempt.id !== restoredDraft.current.attemptId) return;
    const restored = reconcileQuizResume(restoredDraft.current, attempt.id, attempt.questions);
    restoredDraft.current = null;
    if (restored && attempt.status === "in_progress") {
      setAnswers(restored.answers);
      setQuestionIndex(restored.questionIndex);
    }
    setResumeReady(true);
  }, [attempt]);
  useEffect(() => {
    if (!attempt?.expiresAt || attempt.status !== "in_progress") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [attempt?.expiresAt, attempt?.status]);
  useEffect(() => {
    if (attempt?.status === "in_progress" && remaining === 0 && !submit.isPending && timeoutSubmittedFor.current !== attempt.id) {
      timeoutSubmittedFor.current = attempt.id;
      submit.mutate({ attemptId: attempt.id, answers: answerList });
    }
  }, [attempt?.id, attempt?.status, remaining, submit.isPending, answerList]);
  useEffect(() => {
    if (attempt?.status === "in_progress") {
      const refresh = window.setInterval(() => void attemptQuery.refetch(), 5000);
      return () => window.clearInterval(refresh);
    }
  }, [attempt?.id, attempt?.status, attemptQuery.refetch]);

  const begin = (quiz: QuizSummary) => {
    start.mutate({ quizId: quiz.id }, { onSuccess: ({ attempt: started }) => {
      restoredDraft.current = null; setAnswers({}); setQuestionIndex(0); setNow(Date.now()); timeoutSubmittedFor.current = null; setAttemptId(started.id); setResumeReady(true);
    } });
  };
  const leaveResult = () => { try { window.sessionStorage.removeItem(resumeStorageKey); } catch { /* Session storage can be unavailable. */ } restoredDraft.current = null; setAttemptId(null); setSelectedQuizId(null); setResumeReady(true); setAnswers({}); setQuestionIndex(0); timeoutSubmittedFor.current = null; submit.reset(); start.reset(); void catalogue.refetch(); };

  if (attemptId !== null) {
    if (attemptQuery.isError) return <div className="space-y-3"><LearningState state="error" label={errorText(attemptQuery.error, "Your attempt could not be loaded.")} onRetry={() => void attemptQuery.refetch()} /><button className={action} type="button" onClick={leaveResult}>Back to all quizzes</button></div>;
    if (attemptQuery.isPending || !attempt || !resumeReady) return <LearningState state="loading" label="Restoring your quiz attempt…" />;
    if (attempt.status !== "in_progress") {
      const quiz = catalogue.data?.items.find((item) => item.id === attempt.quizId);
      return <QuizResult result={attemptQuery.data.result} topics={attemptQuery.data.topics} answerReview={attemptQuery.data.answerReview} quizTitle={quiz?.title} level={quiz ? levelLabel(quiz.level) : undefined} recommendedArticles={journey.data?.recommendedArticles} onReadArticle={onReadArticle} onRetakeRelatedQuiz={(quizId) => { leaveResult(); setSelectedQuizId(quizId); }} onJourney={() => { leaveResult(); onOpenJourney?.(); }} onReplay={leaveResult} />;
    }
    if (!questions.length || !currentQuestion) return <div className="space-y-3"><LearningState state="error" label="This attempt has no available questions." /><button className={action} type="button" onClick={leaveResult}>Back to all quizzes</button></div>;
    return <QuizQuestionView
      question={currentQuestion} index={questionIndex} count={questions.length} selected={answers[currentQuestion.id] ?? ""}
      remaining={remaining} submitting={submit.isPending} online={online} submitError={submit.isError ? errorText(submit.error, "Your answers could not be submitted.") : undefined}
      onSelect={(key) => setAnswers((current) => ({ ...current, [currentQuestion.id]: key }))}
      onPrevious={() => setQuestionIndex((index) => Math.max(0, index - 1))}
      onNext={() => setQuestionIndex((index) => Math.min(questions.length - 1, index + 1))}
      onSubmit={() => submit.mutate({ attemptId: attempt.id, answers: answerList })}
    />;
  }

  if (selectedQuizId !== null) {
    if (catalogue.isPending) return <LearningState state="loading" label="Loading related quiz…" />;
    if (catalogue.isError) return <LearningState state="error" label="Related quiz could not be loaded." onRetry={() => void catalogue.refetch()} />;
    const quiz = catalogue.data.items.find((item) => item.id === selectedQuizId && item.questionCount > 0) ?? null;
    return <QuizDetail quiz={quiz} pending={start.isPending} error={start.isError ? errorText(start.error, "The quiz could not be started.") : undefined} onStart={begin} onBack={() => { setSelectedQuizId(null); start.reset(); }} />;
  }

  return catalogue.isPending ? <LearningState state="loading" label="Loading quizzes…" />
    : catalogue.isError ? <LearningState state="error" label="Quizzes could not be loaded." onRetry={() => void catalogue.refetch()} />
      : <QuizCatalogue quizzes={catalogue.data.items} pendingId={start.isPending ? start.variables?.quizId : undefined} onSelect={(quiz) => { start.reset(); setSelectedQuizId(quiz.id); }} error={start.isError ? errorText(start.error, "The quiz could not be started.") : undefined} />;
}

export function QuizQuestionView({ question, index, count, selected, remaining, submitting, online, submitError, onSelect, onPrevious, onNext, onSubmit }: { question: QuizQuestion; index: number; count: number; selected: string; remaining: number | null; submitting: boolean; online: boolean; submitError?: string; onSelect: (key: string) => void; onPrevious: () => void; onNext: () => void; onSubmit: () => void }) {
  const finalQuestion = index === count - 1;
  const expired = remaining === 0;
  return <section className={`${panel} max-w-4xl`} aria-labelledby="quiz-question-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium text-[var(--muted)]">Question {index + 1} of {count}</p>{remaining !== null && <p className={`rounded-full border px-3 py-1 text-sm font-semibold tabular-nums ${remaining <= 30 ? "border-red-200 text-red-800" : "border-[var(--line-strong)] text-[var(--text)]"}`} role="timer" aria-live="off">Time remaining: {formatTime(remaining)}</p>}</div>
    {expired && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="status">Time is up. Submit the attempt to see your result. If the connection fails, you can retry safely.</p>}
    {!online && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="status">Connection lost. Your answers are saved on this tab. {submitting ? "Submission will continue when the connection returns." : "Reconnect before submitting."}</p>}
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--blue)_14%,transparent)]"><div className="h-full rounded-full bg-[#1e5eff] transition-[width]" style={{ width: `${((index + 1) / count) * 100}%` }} /></div>
    {question.topic && <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">{topicLabel(question.topic)}</p>}
    <h2 id="quiz-question-title" className="mt-2 text-xl font-semibold leading-snug text-slate-950">{question.prompt}</h2>
    <fieldset className="mt-5 space-y-3" disabled={expired || submitting}><legend className="sr-only">Choose one answer</legend>{question.options.map((option) => <label key={option.optionKey} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition ${selected === option.optionKey ? "border-[#1e5eff] bg-[color-mix(in_srgb,var(--blue)_7%,white)]" : "border-[var(--line)] hover:border-[var(--line-strong)]"}`}><input className="mt-0.5 accent-[#1e5eff]" type="radio" name={`question-${question.id}`} value={option.optionKey} checked={selected === option.optionKey} onChange={() => onSelect(option.optionKey)} /><span>{option.label}</span></label>)}</fieldset>
    {submitError && <p className="mt-4 text-sm text-red-800" role="alert">{submitError}</p>}
    <div className="mt-6 flex flex-wrap justify-between gap-3"><button type="button" className={`${secondary} disabled:opacity-50`} onClick={onPrevious} disabled={index === 0 || submitting || expired}>Previous</button>{finalQuestion || expired ? <button type="button" className={action} onClick={onSubmit} disabled={submitting || !online}>{submitting ? online ? "Submitting…" : "Waiting for connection…" : expired ? "Submit expired attempt" : "Finish quiz"}</button> : <button type="button" className={action} onClick={onNext} disabled={submitting}>{selected ? "Next question" : "Skip for now"}</button>}</div>
  </section>;
}
