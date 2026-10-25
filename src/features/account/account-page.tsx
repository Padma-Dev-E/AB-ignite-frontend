'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card } from '../../components/ui';
import { logoutToLogin } from '../../auth/logout';
import { apiFetch } from '../../lib/api/client';
import { useEmployeeProfile } from '../employee/profile-hooks';
import { usePointsSummary } from '../points/hooks';
import { useIdeas } from '../ideas/hooks';
import { EmployeeIdeaDetailPage } from '../ideas/components/employee-idea-flow';
import { useFeedbackCampaign } from '../employee/engagement-hooks';
import { EmployeeFeedbackCampaignForm } from '../employee/employee-engagement';
import { useLearningRankings } from '../learning/hooks';
import { useChangePassword } from './hooks';
import { passwordInput, passwordPolicyHint, PASSWORD_MAX_LENGTH } from './password-policy';

type Page = 'community' | 'new' | 'learn';
const profileIdeaStages = ['screening', 'business_review', 'control_review', 'decision', 'poc', 'implementation', 'implemented'] as const;
const profileStageByStatus: Record<string, number> = { returned: 0, screening: 0, business_review: 1, control_review: 2, decision: 3, poc: 4, implementation: 5, implemented: 6, benefits_validated: 7 };
const badgeEmojis: Record<string, string> = { 'First Idea': '💡', 'AI Explorer': '🤖', 'Quiz Whiz': '🧠', Collaborator: '🤝', Challenger: '🔥', 'POC Pioneer': '🧪', 'Impact Builder': '🚀', 'Value Creator': '🏆', 'Lifelong Learner': '📖', 'Rising Curve': '📈', 'Expert Challenger': '🎓' };
function ordinal(value: number) {
  const mod100 = value % 100;
  const suffix = mod100 >= 11 && mod100 <= 13 ? 'th' : value % 10 === 1 ? 'st' : value % 10 === 2 ? 'nd' : value % 10 === 3 ? 'rd' : 'th';
  return `${value}${suffix}`;
}
function badgeEmoji(name: string, emoji: unknown) {
  return typeof emoji === 'string' && emoji && emoji !== '🏅' ? emoji : badgeEmojis[name] ?? '🏅';
}
function State({ query }: { query: { isPending: boolean; isError: boolean; refetch: () => unknown } }) {
  return query.isPending ? <p role="status" className="py-6 text-muted">Loading…</p> : query.isError ? <div role="alert" className="py-4"><p>Unable to load this section.</p><Button className="mt-2" onClick={() => void query.refetch()}>Try again</Button></div> : null;
}
export function AccountOverview({ onNavigate, adminPortalRole = null }: { onNavigate: (page: Page) => void; adminPortalRole?: 'back_office' | 'business_owner' | null }) {
  const [selectedIdea, setSelectedIdea] = useState<number | null>(null);
  const profile = useEmployeeProfile();
  const rewards = usePointsSummary();
  const rankings = useLearningRankings('bank');
  const [ideaPage, setIdeaPage] = useState(1);
  const ideas = useIdeas({ mine: true, page: ideaPage, pageSize: 10 });
  const feedback = useFeedbackCampaign();
  const [showFeedback, setShowFeedback] = useState(false);
  const [statementPage, setStatementPage] = useState(1);
  const statement = useQuery({ queryKey: ['account', 'statement', profile.data?.id, statementPage], enabled: !!profile.data, queryFn: () => apiFetch<{ items: Array<{ id: number; amount: number; activity: string; createdAt: string }>; hasMore: boolean }>(`/api/account/password/statement?page=${statementPage}`) });
  const change = useChangePassword();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [formError, setFormError] = useState('');
  const p = profile.data;
  const rank = rankings.data?.items.find(item => item.name === p?.name && item.department === p?.department)?.rank ?? null;
  const demo = p?.email.endsWith('@demo.abignite.invalid') || p?.email.endsWith('@demo.abignite');
  async function save(event: React.FormEvent) {
    event.preventDefault(); setFormError('');
    const parsed = passwordInput.safeParse({ currentPassword, newPassword });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setFormError(issue?.code === 'too_big' ? `Passwords can be up to ${PASSWORD_MAX_LENGTH.toLocaleString()} characters.` : `${passwordPolicyHint} Choose a password different from your current password.`);
      return;
    }
    try { await change.mutateAsync({ currentPassword, newPassword }); setCurrent(''); setNew(''); } catch { /* Render mutation error. */ }
  }
  async function leave() {
    await logoutToLogin();
  }
  if (selectedIdea !== null) return <EmployeeIdeaDetailPage ideaId={selectedIdea} onBack={() => setSelectedIdea(null)} />;
  return <div className="stack">
    <section className="relative min-h-[245px] overflow-hidden rounded-[24px] bg-gradient-to-r from-[#102d7b] to-[#205bff] px-7 py-7 text-white sm:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-14 top-[-42px] h-56 w-56 rounded-full bg-white/[0.08]" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[112px] top-[34px] h-[92px] w-[92px] rounded-full bg-white/[0.07]" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[44px] bottom-[-31px] h-[105px] w-[105px] rounded-full bg-white/[0.08]" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[260px] top-[20px] h-[42px] w-[42px] rounded-full bg-white/[0.06]" />
      <State query={profile} />
      {p && <div className="relative max-w-[560px]"><div className="flex flex-wrap items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4385ff] text-lg font-semibold">{p.name.charAt(0).toUpperCase()}</span><h1 className="break-words text-[30px] font-semibold leading-tight tracking-[-0.025em]">{p.name}</h1>{demo && <span className="rounded-full border border-white/50 px-3 py-1 text-xs">Demo profile</span>}</div><p className="mt-1.5 text-sm text-white/80">{p.jobTitle || (demo ? 'Demo participant' : 'Employee')} · {p.department}</p></div>}
      <State query={rewards} />
      <div className="relative mt-4 flex flex-wrap gap-2">{rewards.data && <span className="rounded-[10px] border border-white/30 bg-white/[0.12] px-3 py-1.5 text-[13px]">💡 {rewards.data.balance.balance.toLocaleString()} points</span>}<span className="rounded-[10px] border border-white/30 bg-white/[0.12] px-3 py-1.5 text-[13px]">🏅 {rank ? `${ordinal(rank)} this season` : 'Rank pending'}</span>{ideas.data && <span className="rounded-[10px] border border-white/30 bg-white/[0.12] px-3 py-1.5 text-[13px]">💡 {ideas.data.total} ideas</span>}</div>
      {rewards.data && <div className="relative mt-4 max-w-[560px]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[13px]">
          <p>Level {rewards.data.level?.id ?? ''}: <strong>{rewards.data.level?.name ?? 'Ignite Starter'}</strong></p>
          {rewards.data.nextLevel && rewards.data.progress && <p className="text-white/85">{rewards.data.progress.pointsToNextLevel.toLocaleString()} to <strong>{rewards.data.nextLevel.name}</strong></p>}
        </div>
        {rewards.data.nextLevel && rewards.data.progress ? <>
          <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-white/25" role="progressbar" aria-label={`Progress to ${rewards.data.nextLevel.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={rewards.data.progress.percent} aria-valuetext={`${rewards.data.progress.pointsIntoLevel.toLocaleString()} of ${rewards.data.progress.pointsRequired.toLocaleString()} points`}>
            <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${rewards.data.progress.percent}%` }} />
          </div>
        </> : rewards.data.level ? <p className="mt-2 text-sm text-white/85">You’ve reached the highest configured level.</p> : <p className="mt-2 text-sm text-white/85">Levels haven’t been configured yet.</p>}
      </div>}
    </section>
    <div className="grid gap-[18px] lg:grid-cols-2">
      <Card><h2 className="text-xl font-semibold">My ideas</h2><p className="mt-1 text-sm text-muted">{ideas.data?.total ?? 'Your ideas'} registered to you. Tap one to see where it stands.</p><State query={ideas} />{ideas.data && (ideas.data.items.length ? <ul className="mt-3 divide-y">{ideas.data.items.map(idea => { const stage = profileStageByStatus[idea.status] ?? -1; const terminal = ['rejected', 'deferred'].includes(idea.status); return <li key={idea.id}><button className="flex w-full items-center justify-between gap-3 py-3 text-left" onClick={() => setSelectedIdea(idea.id)}><span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-[#23324d]">{idea.title}</span><span className="mt-1 block text-xs text-muted">{idea.reference}</span><span aria-label={`Stage ${idea.status.replaceAll('_', ' ')}`} className="mt-2 flex gap-[3px]">{profileIdeaStages.map((name, index) => <span key={name} className={`h-[3px] flex-1 rounded-full ${!terminal && index < stage ? 'bg-[#0ca989]' : !terminal && index === stage ? 'bg-[#e6ae45]' : 'bg-[#e5e9f0]'}`} />)}</span></span><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium capitalize ${terminal ? 'bg-[#fff0ed] text-[#bf594a]' : 'bg-[#edf3ff] text-[#3159aa]'}`}>{idea.status.replaceAll('_', ' ')}</span></button></li>; })}</ul> : <p className="py-10 text-center text-muted">No ideas yet. <button className="text-blue underline" onClick={() => onNavigate('new')}>Share your first</button></p>)}{ideas.data && ideas.data.totalPages > 1 && <div className="mt-4 flex gap-2"><Button size="small" disabled={ideaPage === 1} onClick={() => setIdeaPage(n => n - 1)}>Previous ideas</Button><Button size="small" disabled={ideaPage >= ideas.data.totalPages} onClick={() => setIdeaPage(n => n + 1)}>Next ideas</Button></div>}</Card>
      <Card><h2 className="text-xl font-semibold">Badges</h2><State query={rewards} /><div className="mt-4 grid grid-cols-3 gap-1">{rewards.data?.badges.map(badge => <div key={badge.id} className={`px-2 py-2 text-center ${badge.awarded ? '' : 'text-muted'}`}><span aria-hidden="true" className={`mx-auto mb-2 flex h-[54px] w-[54px] items-center justify-center rounded-full border text-[25px] ${badge.awarded ? 'border-[#e4e9f2] bg-[#f2f5fb]' : 'border-[#eaedf2] bg-[#f7f8fa] opacity-60'}`}>{badgeEmoji(badge.name, badge.emoji)}</span><h3 className="text-[13px] font-semibold leading-4">{badge.name}</h3><p className="mt-1 text-[11px] leading-4 text-muted">{badge.description}</p><span className="text-[10px] text-muted">{badge.awarded ? 'Earned' : 'Locked'}</span></div>)}</div>{rewards.data?.badges.length === 0 && <p className="py-6 text-muted">No badges available yet.</p>}</Card>
    </div>
    <Card><div className="flex items-center justify-between gap-4"><div className="min-w-0"><h2 className="text-xl font-semibold">Learning</h2><p className="mt-1 text-sm text-muted">Your personal learning journey, with topic scores and recommended reading, lives under Ignite Your Knowledge.</p></div><Button size="small" className="shrink-0" onClick={() => onNavigate('learn')}>Open my journey</Button></div></Card>
    <Card><h2 className="text-xl font-semibold">Statement</h2><p className="mt-1 text-sm text-muted">Every point earned or spent on your innovation account.</p><State query={statement} />{statement.data && <><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Points statement</caption><thead><tr className="border-b text-xs text-muted"><th scope="col" className="py-3 font-medium">Date</th><th scope="col" className="font-medium">Activity</th><th scope="col" className="text-right font-medium">Points</th></tr></thead><tbody>{statement.data.items.map(row => <tr key={row.id} className="border-b last:border-0"><td className="py-3 pr-3 whitespace-nowrap text-muted">{new Date(row.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td><td className="capitalize">{row.activity.replaceAll('_', ' ')}</td><td className={`text-right font-medium ${row.amount >= 0 ? 'text-[#079977]' : 'text-[#c15c50]'}`}>{row.amount > 0 ? '+' : ''}{row.amount}</td></tr>)}{!statement.data.items.length && <tr><td colSpan={3} className="py-8 text-center text-muted">No activity yet.</td></tr>}</tbody></table></div><div className="mt-3 flex gap-2"><Button size="small" disabled={statementPage === 1} onClick={() => setStatementPage(n => n - 1)}>Previous</Button><Button size="small" disabled={!statement.data.hasMore} onClick={() => setStatementPage(n => n + 1)}>Next</Button></div></>}</Card>
    <Card><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">My Feedback</h2><Button size="small" onClick={() => setShowFeedback(v => !v)}>{showFeedback ? 'Close feedback form' : 'Share feedback'}</Button></div><p className="mt-2 text-sm text-muted">Feedback you shared about AB Ignite, with its reference, status and any response from the platform team. Only you can see this.</p><State query={feedback} />{feedback.data && (!feedback.data.responses.length ? <p className="py-10 text-center text-muted">You have not shared feedback yet.</p> : <ul className="mt-4 divide-y">{feedback.data.responses.map(item => { const response = item as typeof item & { response?: string | null }; return <li key={item.id} className="py-4"><p className="text-xs text-muted">Feedback #{item.id} · {item.category} · {new Date(item.createdAt).toLocaleDateString()} · {response.response ? 'Answered' : 'Awaiting response'}</p><p className="mt-2 whitespace-pre-wrap">{item.message}</p>{response.response && <p className="mt-3 rounded-xl bg-blue-50 p-3">Platform team: {response.response}</p>}</li>; })}</ul>)}{showFeedback && <div className="mt-5"><EmployeeFeedbackCampaignForm /></div>}</Card>
    <Card><h2 className="text-xl font-semibold">Account</h2>{p && <p className="mt-2 break-all text-sm text-muted">{p.email}{demo && ' · Demo profile'}</p>}<details className="mt-5"><summary className="cursor-pointer font-medium text-blue focus-visible:outline focus-visible:outline-2">Change password</summary>{demo ? <p className="mt-4 text-sm text-muted">This demo profile is separate from employee records and has no password. Sign in with an employee account to change its password.</p> : <form className="mt-5 max-w-lg space-y-4" onSubmit={save}><label className="block"><span className="field-label">Current password</span><input type="password" autoComplete="current-password" className="input" required value={currentPassword} onChange={e => setCurrent(e.target.value)} disabled={change.isPending || change.isSuccess} /></label><label className="block"><span className="field-label">New password</span><input type="password" autoComplete="new-password" aria-describedby="password-policy" className="input" minLength={9} required value={newPassword} onChange={e => setNew(e.target.value)} disabled={change.isPending || change.isSuccess} /></label><p id="password-policy" className="text-sm text-muted">{passwordPolicyHint} Saving signs you out on all devices.</p>{(formError || change.isError) && <p role="alert">{formError || change.error?.message}</p>}{change.isSuccess && <p role="status">Password changed. All sessions revoked. <a className="text-blue underline" href="/login">Sign in again</a></p>}<Button type="submit" variant="primary" disabled={change.isPending || change.isSuccess || !p}>{change.isPending ? 'Saving…' : 'Save password'}</Button></form>}</details><Button className="mt-5" onClick={() => void leave()}>Sign out</Button></Card>
  </div>;
}
