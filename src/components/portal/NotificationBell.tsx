"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  Clock3,
  Inbox,
  Loader2,
  X,
} from "lucide-react";

import { api } from "@/lib/api";
import type { Role } from "@/lib/types";
import { useApp } from "./AppContext";

function roleFallbackHref(role?: Role) {
  if (role === "SUPER_ADMIN") return "/admin";
  if (role === "PROJECT_MANAGER" || role === "STAFF") return "/staff";
  return "/client";
}

function formatNotificationDate(value?: string) {
  if (!value) return "Now";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Now";

  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell() {
  const { state, currentUser, refresh } = useApp();

  const [open, setOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const notifications = useMemo(() => {
    return [...(state.notifications ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [state.notifications]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const visibleNotifications = notifications.slice(0, 8);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!wrapRef.current) return;

      if (!wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClick);

    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markRead(id: string) {
    setLoadingId(id);

    try {
      await api.notifications.markRead(id);
      await refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function markAllRead() {
    if (!unreadCount) return;

    setMarkingAll(true);

    try {
      await api.notifications.markAllRead();
      await refresh();
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="relative inline-flex" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`${unreadCount} unread notifications`}
        aria-expanded={open}
        className={[
          "relative inline-flex h-11 items-center gap-2 rounded-2xl border px-3.5 text-sm font-bold transition",
          unreadCount
            ? "border-blue-200 bg-blue-50 text-[#0064E0] shadow-[0_10px_24px_rgba(0,100,224,0.10)]"
            : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-[#0064E0]",
        ].join(" ")}
      >
        <Bell size={16} strokeWidth={2.25} />
        <span className="hidden sm:inline">Alerts</span>

        {unreadCount > 0 ? (
          <em className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#E61525] px-1.5 text-[10px] font-black not-italic text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </em>
        ) : null}
      </button>

      {open ? (
        <section
          aria-label="Notifications"
          className="fixed left-3 right-3 top-[76px] z-[90] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+12px)] sm:w-[390px]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
            <div>
              <strong className="block text-base font-semibold tracking-[-0.03em] text-slate-950">
                Notifications
              </strong>
              <span className="mt-1 block text-xs font-semibold text-slate-500">
                {unreadCount} unread alert{unreadCount === 1 ? "" : "s"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-[#E61525]"
            >
              <X size={16} strokeWidth={2.25} />
            </button>
          </div>

          {visibleNotifications.length ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Recent activity
                </span>

                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={!unreadCount || markingAll}
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold text-[#0064E0] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {markingAll ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCheck size={14} />
                  )}
                  Mark all read
                </button>
              </div>

              <div className="max-h-[min(460px,calc(100vh-230px))] overflow-auto">
                {visibleNotifications.map((notification) => {
                  const href = notification.href || roleFallbackHref(currentUser?.role);
                  const isLoading = loadingId === notification.id;

                  return (
                    <article
                      key={notification.id}
                      className={[
                        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0",
                        notification.read ? "bg-white" : "bg-blue-50/50",
                      ].join(" ")}
                    >
                      <Link
                        href={href}
                        onClick={() => {
                          setOpen(false);

                          if (!notification.read) {
                            void markRead(notification.id);
                          }
                        }}
                        className="flex min-w-0 items-start gap-3"
                      >
                        <span
                          className={[
                            "grid h-9 w-9 shrink-0 place-items-center rounded-2xl border",
                            notification.read
                              ? "border-slate-200 bg-slate-50 text-slate-400"
                              : "border-blue-100 bg-white text-[#0064E0]",
                          ].join(" ")}
                        >
                          {notification.read ? (
                            <CheckCheck size={16} />
                          ) : (
                            <Clock3 size={16} />
                          )}
                        </span>

                        <span className="min-w-0">
                          <strong className="block text-sm font-semibold leading-5 text-slate-950">
                            {notification.title}
                          </strong>
                          <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">
                            {notification.body}
                          </span>
                          <em className="mt-1.5 block text-[11px] font-bold not-italic uppercase tracking-[0.12em] text-slate-400">
                            {formatNotificationDate(notification.createdAt)}
                          </em>
                        </span>
                      </Link>

                      {!notification.read ? (
                        <button
                          type="button"
                          onClick={() => markRead(notification.id)}
                          disabled={isLoading}
                          className="inline-flex min-h-8 items-center justify-center rounded-full border border-blue-100 bg-white px-3 text-[11px] font-black text-[#0064E0] transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-70"
                        >
                          {isLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            "Read"
                          )}
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="grid min-h-[210px] place-items-center px-6 py-10 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
                  <Inbox size={22} />
                </span>
                <strong className="mt-4 block text-base font-semibold tracking-[-0.03em] text-slate-950">
                  No notifications yet
                </strong>
                <span className="mt-1 block text-sm font-medium leading-6 text-slate-500">
                  Project, payment and approval alerts will appear here.
                </span>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
            <span
              className={[
                "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                unreadCount
                  ? "border-orange-200 bg-orange-50 text-[#FC7E24]"
                  : "border-emerald-200 bg-emerald-50 text-[#29BE3E]",
              ].join(" ")}
            >
              {unreadCount ? "Attention needed" : "All caught up"}
            </span>
          </div>
        </section>
      ) : null}
    </div>
  );
}