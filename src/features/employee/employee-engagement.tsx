"use client";

import React, { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ApiError } from "../../lib/api/client";
import { Button, Card } from "../../components/ui";
import {
  useEmployeeNotifications,
  useFeedbackCampaign,
  usePublishedAnnouncements,
  useSetEmployeeNotificationRead,
  useSubmitEmployeeFeedback,
} from "./engagement-hooks";
import type { FeedbackCategory, Notification, PublishedAnnouncement } from "./engagement-api";
import { CommunityFeedRow } from "./community-feed";
import { notificationDestination } from "./notification-navigation";
import { useNotificationNavigation } from "./notification-navigation-context";

const categories: Array<{ value: FeedbackCategory; label: string }> = [
  { value: "experience", label: "Overall experience" },
  { value: "ideas", label: "Ideas" },
  { value: "content", label: "Content" },
  { value: "technical", label: "Technical issue" },
  { value: "other", label: "Other" },
];

function messageFor(error: unknown) {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function EmployeeFeedbackCampaignForm({ appearance = "default" }: { appearance?: "default" | "community" }) {
  const campaignQuery = useFeedbackCampaign();
  const submit = useSubmitEmployeeFeedback();
  const [category, setCategory] = useState<FeedbackCategory>("experience");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const community = appearance === "community";
  const cardClass = "";
  if (campaignQuery.isPending)
    if (community) return <section className="pinned-surface rounded-[20px] px-6 py-7 text-white shadow-[0_18px_36px_-18px_var(--blue-deep)]" aria-label="Feedback campaign"><p className="text-sm text-white/85" role="status">Loading feedback campaign…</p></section>;
    else
    return (
      <Card className={cardClass}>
        <p className={`text-sm ${community ? "text-[#53688f]" : "text-muted"}`} role="status">
          Loading feedback campaign…
        </p>
      </Card>
    );
  if (campaignQuery.isError)
    if (community) return <section className="pinned-surface rounded-[20px] px-6 py-7 text-white shadow-[0_18px_36px_-18px_var(--blue-deep)]" aria-label="Feedback campaign"><h2 className="text-lg font-semibold">Feedback is temporarily unavailable</h2><p className="mt-1 text-sm text-white/80" role="alert">{messageFor(campaignQuery.error)}</p><Button className="mt-3 border-white/50 bg-white/10 text-white hover:bg-white/20" onClick={() => void campaignQuery.refetch()}>Try again</Button></section>;
    else
    return (
      <Card className={cardClass}>
        <h2 className="text-lg font-medium">
          Feedback is temporarily unavailable
        </h2>
        <p className={`mt-1 text-sm ${community ? "text-[#53688f]" : "text-muted"}`}>
          {messageFor(campaignQuery.error)}
        </p>
        <Button className="mt-3" onClick={() => void campaignQuery.refetch()}>
          Try again
        </Button>
      </Card>
    );
  const campaign = campaignQuery.data.campaign;
  if (!campaign && community) return null;
  if (!campaign)
    return (
      <Card className={cardClass}>
        <h2 className="text-lg font-medium">No active feedback campaign</h2>
        <p className={`mt-1 text-sm ${community ? "text-[#53688f]" : "text-muted"}`}>
          There isn’t a campaign open right now. Check back later.
        </p>
      </Card>
    );
  const alreadyResponded = campaignQuery.data.responses.some(
    (response) => response.campaignId === campaign.id,
  );
  async function sendFeedback() {
    try {
      await submit.mutateAsync({
        category,
        message: message.trim(),
        idempotencyKey: globalThis.crypto.randomUUID(),
      });
      setSubmitted(true);
      setMessage("");
    } catch {
      /* mutation error is displayed inline */
    }
  }
  if (community) return <>
    <section className="pinned-surface relative overflow-hidden rounded-[20px] px-6 py-7 text-white shadow-[0_18px_36px_-18px_var(--blue-deep)] sm:px-6" aria-label="Feedback campaign">
      <span className="pointer-events-none absolute right-[36px] top-[8px] h-[96px] w-[96px] rounded-full bg-white/[.12]" aria-hidden="true" />
      <span className="pointer-events-none absolute right-[132px] top-[64px] h-[54px] w-[54px] rounded-full bg-white/[.11]" aria-hidden="true" />
      <span className="pointer-events-none absolute right-[10px] top-[84px] h-[42px] w-[42px] rounded-full bg-white/[.11]" aria-hidden="true" />
      <span className="pointer-events-none absolute right-[116px] top-[8px] h-[24px] w-[24px] rounded-full bg-white/[.10]" aria-hidden="true" />
      <span className="pointer-events-none absolute right-[20px] top-[8px] h-[16px] w-[16px] rounded-full bg-white/[.10]" aria-hidden="true" />
      <div className="relative max-w-[720px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[.16em] text-white/75">Pinned · Feedback campaign</span>
          {alreadyResponded && <span className="rounded-full border border-white/50 px-2.5 py-1 text-xs">You have shared feedback</span>}
        </div>
        <h2 className="mt-3 text-[21px] font-semibold tracking-[-.02em]">{campaign.title}</h2>
        {campaign.description && <p className="mt-2 max-w-[680px] text-sm leading-6 text-white/85">{campaign.description}</p>}
        {submitted || alreadyResponded ? (
          <p className="mt-5 inline-flex rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white" role="status">Thanks for sharing your feedback. Your response has been received.</p>
        ) : (
          <button type="button" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-[10px] bg-white px-4 py-2 text-[13px] font-semibold text-[#174bc9] shadow-sm transition hover:bg-[#f1f5ff]" aria-haspopup="dialog" onClick={() => { submit.reset(); setExpanded(true); }}>
            Share Your Feedback <span aria-hidden="true">↗</span>
          </button>
        )}
      </div>
    </section>
    <Dialog open={expanded} onClose={() => { if (!submit.isPending) setExpanded(false); }} className="relative z-[80]">
      <div className="fixed inset-0 bg-[rgba(3,10,30,.55)] backdrop-blur-[5px]" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-5">
        <DialogPanel className="relative max-h-[88vh] w-full max-w-[520px] overflow-y-auto rounded-[20px] border border-[var(--line)] bg-[var(--card)] p-6 shadow-[0_24px_60px_-14px_rgba(3,10,30,.5)]">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-xl font-semibold">Share your feedback</DialogTitle>
            <button type="button" aria-label="Close feedback dialog" className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-[var(--line)] bg-white text-xl text-muted hover:bg-[var(--hover)]" onClick={() => setExpanded(false)}>×</button>
          </div>
          {submitted ? <div className="pt-6 text-center"><span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal/10 text-2xl text-teal">✓</span><h3 className="mt-3 text-lg font-semibold">Thank you</h3><p className="mt-2 text-sm text-muted">Your feedback has been received. You can follow it under My account › My Feedback.</p><Button variant="primary" className="mt-5" onClick={() => setExpanded(false)}>Done</Button></div> : <><p className="mt-2 text-sm text-muted">About AB Ignite itself: what would make it more valuable to you? This goes to the platform team, separately from the idea pipeline.</p>
            <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); void sendFeedback(); }}>
              <label className="block"><span className="field-label">Your feedback</span><textarea autoFocus className="input min-h-[130px] resize-y" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} required placeholder="What would make this platform more valuable to you?" /></label>
              <label className="block"><span className="field-label">Category</span><select className="input" value={category} onChange={(event) => setCategory(event.target.value as FeedbackCategory)}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              {submit.isError && <p className="text-sm text-[#d6336c]" role="alert">{messageFor(submit.error)}</p>}
              <div className="flex flex-wrap justify-end gap-2"><Button type="button" onClick={() => setExpanded(false)}>Cancel</Button><Button variant="primary" type="submit" disabled={!message.trim() || submit.isPending}>{submit.isPending ? "Sending…" : "Send feedback"}</Button></div>
            </form></>}
        </DialogPanel>
      </div>
    </Dialog>
  </>;
  return (
    <Card className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={`text-[11px] font-medium uppercase tracking-[.12em] ${community ? "text-[#3157a2]" : "text-blue"}`}>
            Pinned · Feedback campaign
          </span>
          <h2 className="mt-1 text-xl font-medium">{campaign.title}</h2>
        </div>
        <span className="pill">
          <span className="pill-dot" />
          Open
        </span>
      </div>
      {campaign.description && (
        <p className={`mt-2 text-sm leading-6 ${community ? "text-[#53688f]" : "text-muted"}`}>
          {campaign.description}
        </p>
      )}
      {submitted || alreadyResponded ? (
        <p
          className="mt-4 rounded-xl border border-teal/30 bg-teal/10 p-3 text-sm text-[#0e9f7a]"
          role="status"
        >
          Thanks for sharing your feedback. Your response has been received.
        </p>
      ) : (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void sendFeedback();
          }}
        >
          <label className="block">
            <span className={`field-label ${community ? "text-[#27477f]" : ""}`}>Category</span>
            <select
              className={`input ${community ? "!border-[#bdcffa] !bg-white !text-[#152b55]" : ""}`}
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as FeedbackCategory)
              }
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={`field-label ${community ? "text-[#27477f]" : ""}`}>Your feedback</span>
            <textarea
              className={`input min-h-[100px] resize-y ${community ? "!border-[#bdcffa] !bg-white !text-[#152b55] placeholder:!text-[#7787a5]" : ""}`}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={4000}
              required
              placeholder="What would make your experience better?"
            />
          </label>
          {submit.isError && (
            <p className="text-sm text-[#d6336c]" role="alert">
              {messageFor(submit.error)}
            </p>
          )}
          {submit.isSuccess && (
            <p className="text-sm text-[#0e9f7a]" role="status">
              Your feedback was submitted.
            </p>
          )}
          <Button
            variant="primary"
            type="submit"
            disabled={!message.trim() || submit.isPending}
          >
            {submit.isPending ? "Sending…" : "Send feedback"}
          </Button>
        </form>
      )}
    </Card>
  );
}

export function EmployeeNotificationsPanel({ onOpenNotification }: { onOpenNotification?: (notification: Notification) => void } = {}) {
  const query = useEmployeeNotifications();
  const setRead = useSetEmployeeNotificationRead();
  const navigate = useNotificationNavigation();
  const openNotification = onOpenNotification ?? navigate;
  const notifications = query.data?.items ?? [];
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium">Notifications</h2>
          <p className="mt-1 text-sm text-muted">
            {query.data?.unreadCount ?? 0} unread
          </p>
        </div>
        {Boolean(query.data?.unreadCount) && (
          <Button
            size="small"
            disabled={setRead.isPending}
            onClick={() => setRead.mutate({ all: true, read: true })}
          >
            {setRead.isPending && setRead.variables?.all ? "Marking…" : "Mark all read"}
          </Button>
        )}
      </div>
      {query.isPending ? (
        <p className="mt-4 text-sm text-muted" role="status">
          Loading notifications…
        </p>
      ) : query.isError ? (
        <div className="mt-4">
          <p className="text-sm text-[#d6336c]" role="alert">
            {messageFor(query.error)}
          </p>
          <Button className="mt-3" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          You’re all caught up. New updates will appear here.
        </p>
      ) : (
        <div className="mt-4 max-h-[28rem] overflow-y-auto pr-1">
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {notifications.map((notification) => (
              <li
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                key={notification.id}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-[var(--line-strong)]" : "bg-blue"}`}
                  aria-label={notification.isRead ? "Read" : "Unread"}
                />
                <div className="min-w-0 flex-1">
                  {openNotification && notificationDestination(notification.target).kind !== "none" ? (
                    <button type="button" className="block w-full rounded text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue" onClick={() => openNotification(notification)}>
                      <span className="block text-sm font-medium text-blue">{notification.title}</span>
                      <span className="mt-0.5 block text-sm text-muted">{notification.body}</span>
                    </button>
                  ) : (
                    <><p className="text-sm font-medium">{notification.title}</p><p className="mt-0.5 text-sm text-muted">{notification.body}</p>{notification.target.type !== "none" && !notification.target.available && <p className="mt-1 text-xs text-muted">This item is no longer available.</p>}</>
                  )}
                  <time
                    className="mt-1 block text-xs text-muted"
                    dateTime={notification.createdAt}
                  >
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </time>
                </div>
                {!notification.isRead && (
                  <Button
                    size="small"
                    disabled={setRead.isPending}
                    onClick={() =>
                      setRead.mutate({ id: notification.id, read: true })
                    }
                  >
                    {setRead.isPending && setRead.variables?.id === notification.id ? "Marking…" : "Mark read"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {query.hasNextPage && (
            <Button
              className="mt-3 w-full"
              size="small"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage
                ? "Loading…"
                : "Load more notifications"}
            </Button>
          )}
        </div>
      )}
      {setRead.isError && (
        <p className="mt-3 text-sm text-[#d6336c]" role="alert">
          {messageFor(setRead.error)}
        </p>
      )}
    </Card>
  );
}

export function EmployeeCommunityUpdates({
  onOpenAnnouncement,
}: {
  onOpenAnnouncement: (id: number) => void;
}) {
  const announcementsQuery = usePublishedAnnouncements();
  const announcements = announcementsQuery.data?.items ?? [];
  if (announcementsQuery.isPending) {
    return <p className="mt-4 text-sm text-muted" role="status">Loading updates…</p>;
  }
  if (announcementsQuery.isError) {
    return <div className="mt-4" role="alert"><p className="text-sm text-[#d6336c]">Announcements are temporarily unavailable.</p><button className="btn btn-small mt-3" onClick={() => void announcementsQuery.refetch()}>Try again</button></div>;
  }
  if (!announcements.length) {
    return <p className="py-3 text-[13px] text-muted">No announcements yet.</p>;
  }

  return <div className="mt-2">
    {announcements.map((announcement, index) => (
      <CommunityFeedRow key={announcement.id} icon="announcement" isLast={index === announcements.length - 1}>
      <button type="button" className="block w-full rounded text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue" onClick={() => onOpenAnnouncement(announcement.id)}>
        <span className="block text-[14px] font-medium leading-5">{announcement.title}</span>
        <span className="mt-1 block overflow-hidden text-[13px] leading-[1.55] text-muted" style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>{announcement.body}</span>
        <time className="mt-1 block text-xs text-muted" dateTime={announcement.publishedAt}>{new Date(announcement.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time>
      </button>
      </CommunityFeedRow>
    ))}
  </div>;
}
