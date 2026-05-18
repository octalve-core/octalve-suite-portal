"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

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
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());

  return Math.ceil((target.getTime() - start.getTime()) / DAY);
}

function getTargetTime(date?: string) {
  if (!date) return null;

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;

  parsed.setHours(23, 59, 59, 999);
  return parsed.getTime();
}

function getCountdownParts(date?: string, now = Date.now()) {
  const target = getTargetTime(date);

  if (!target) return null;

  const diff = target - now;
  const abs = Math.abs(diff);

  return {
    overdue: diff < 0,
    days: Math.floor(abs / DAY),
    hours: Math.floor((abs % DAY) / HOUR),
    minutes: Math.floor((abs % HOUR) / MINUTE),
    seconds: Math.floor((abs % MINUTE) / SECOND),
  };
}

export function ProjectDateCountdown({
  targetDate,
  compact = false,
}: {
  targetDate?: string;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = useMemo(() => getCountdownParts(targetDate, now), [targetDate, now]);

  const tone =
    !parts
      ? "badge-slate"
      : parts.overdue
        ? "badge-red"
        : parts.days <= 7
          ? "badge-orange"
          : "badge-green";

  if (compact) {
    const text = !parts
      ? "No deadline"
      : parts.overdue
        ? `${parts.days}d ${parts.hours}h overdue`
        : `${parts.days}d ${parts.hours}h ${parts.minutes}m`;

    return (
      <span className="project-date-compact">
        <strong>{formatProjectDate(targetDate)}</strong>
        <span className={`badge ${tone}`}>
          <CalendarClock size={12} /> {text}
        </span>
      </span>
    );
  }

  if (!parts) {
    return (
      <div className="premium-countdown empty">
        <div>
          <CalendarClock size={18} />
          <strong>No deadline set</strong>
          <span>Target date will appear once the project has a delivery date.</span>
        </div>
      </div>
    );
  }

  const units = [
    ["Days", parts.days],
    ["Hours", parts.hours],
    ["Minutes", parts.minutes],
    ["Seconds", parts.seconds],
  ];

  return (
    <div className={parts.overdue ? "premium-countdown is-overdue" : "premium-countdown"}>
      <div className="premium-countdown-head">
        <span>{parts.overdue ? "Deadline overdue" : "Time remaining"}</span>
        <strong>{formatProjectDate(targetDate)}</strong>
      </div>

      <div className="premium-countdown-grid">
        {units.map(([label, value]) => (
          <div key={label}>
            <strong>{String(value).padStart(2, "0")}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
