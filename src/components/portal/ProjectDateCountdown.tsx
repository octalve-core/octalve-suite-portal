"use client";

import { CalendarClock } from "lucide-react";

export function formatProjectDate(date?: string) {
  if (!date) return "Not set";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not set";

  return parsed.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getDaysUntil(date?: string) {
  if (!date) return null;

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );

  return Math.ceil((target.getTime() - start.getTime()) / 86400000);
}

export function ProjectDateCountdown({
  targetDate,
  compact = false,
}: {
  targetDate?: string;
  compact?: boolean;
}) {
  const days = getDaysUntil(targetDate);

  const text =
    days === null
      ? "No deadline"
      : days < 0
        ? `${Math.abs(days)} days overdue`
        : days === 0
          ? "Due today"
          : `${days} days left`;

  const tone =
    days === null
      ? "badge-slate"
      : days < 0
        ? "badge-red"
        : days <= 7
          ? "badge-orange"
          : "badge-green";

  if (compact) {
    return (
      <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
        <strong>{formatProjectDate(targetDate)}</strong>
        <span className={`badge ${tone}`}>
          <CalendarClock size={12} /> {text}
        </span>
      </span>
    );
  }

  return (
    <div className="date-inline">
      <strong>{formatProjectDate(targetDate)}</strong>
      <span className={`badge ${tone}`}>
        <CalendarClock size={12} /> {text}
      </span>
    </div>
  );
}
