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
import { Role } from "@/lib/types";
import { useApp } from "./AppContext";
import { Badge } from "./UI";

function roleFallbackHref(role?: Role) {
  if (role === "SUPER_ADMIN") return "/admin";
  if (role === "CLIENT") return "/client";
  return "/staff";
}

function formatNotificationDate(value?: string) {
  if (!value) return "Now";

  try {
    return new Date(value).toLocaleString("en-NG", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Now";
  }
}

export function NotificationBell() {
  const { state, currentUser, refresh } = useApp();

  const [open, setOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const notifications = useMemo(() => {
    return [...(state.notifications ?? [])]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 8);
  }, [state.notifications]);

  const unread = notifications.filter((notification) => !notification.read);
  const unreadCount = unread.length;

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
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        await refresh();
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function markAllRead() {
    if (!unread.length) return;

    setMarkingAll(true);

    try {
      await Promise.all(
        unread.map((notification) =>
          fetch(`/api/notifications/${notification.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ read: true }),
          }),
        ),
      );

      await refresh();
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="notification-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className={
          unreadCount
            ? "notification-btn notification-btn-active"
            : "notification-btn"
        }
        onClick={() => setOpen((value) => !value)}
        aria-label={`${unreadCount} unread notifications`}
        aria-expanded={open}
      >
        <Bell size={16} strokeWidth={2.25} />
        <span>Alerts</span>
        {unreadCount > 0 && (
          <em className="topbar-action-badge">{unreadCount}</em>
        )}
      </button>

      {open && (
        <section className="notification-menu" aria-label="Notifications">
          <div className="notification-menu-head">
            <div>
              <strong>Notifications</strong>
              <span>{unreadCount} unread</span>
            </div>

            <button
              type="button"
              className="icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
            >
              <X size={16} strokeWidth={2.25} />
            </button>
          </div>

          {notifications.length ? (
            <>
              <div className="notification-menu-actions">
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={!unread.length || markingAll}
                >
                  {markingAll ? (
                    <Loader2 size={14} className="spinner" />
                  ) : (
                    <CheckCheck size={14} />
                  )}
                  Mark all read
                </button>
              </div>

              <div className="notification-menu-list">
                {notifications.map((notification) => {
                  const href =
                    notification.href || roleFallbackHref(currentUser?.role);

                  return (
                    <div
                      key={notification.id}
                      className={
                        notification.read
                          ? "notification-menu-item is-read"
                          : "notification-menu-item"
                      }
                    >
                      <Link
                        href={href}
                        onClick={() => {
                          setOpen(false);
                          if (!notification.read) {
                            markRead(notification.id);
                          }
                        }}
                      >
                        <span className="notification-menu-icon">
                          {notification.read ? (
                            <CheckCheck size={16} />
                          ) : (
                            <Clock3 size={16} />
                          )}
                        </span>

                        <span className="notification-menu-copy">
                          <strong>{notification.title}</strong>
                          <span>{notification.body}</span>
                          <em>{formatNotificationDate(notification.createdAt)}</em>
                        </span>
                      </Link>

                      {!notification.read && (
                        <button
                          type="button"
                          className="notification-read-btn"
                          onClick={() => markRead(notification.id)}
                          disabled={loadingId === notification.id}
                        >
                          {loadingId === notification.id ? (
                            <Loader2 size={14} className="spinner" />
                          ) : (
                            "Read"
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="notification-empty">
              <Inbox size={22} />
              <strong>No notifications yet</strong>
              <span>Your workspace alerts will appear here.</span>
            </div>
          )}

          <div className="notification-menu-foot">
            <Badge className={unreadCount ? "badge-orange" : "badge-green"}>
              {unreadCount ? "Attention needed" : "All caught up"}
            </Badge>
          </div>
        </section>
      )}
    </div>
  );
}
