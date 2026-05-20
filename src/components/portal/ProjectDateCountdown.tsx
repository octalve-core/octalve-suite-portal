"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function parseProjectDate(date?: string) {
  if (!date) return null;

  const value = date.includes("T") ? date : `${date}T23:59:59.999`;
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

export function formatProjectDate(date?: string) {
  const parsed = parseProjectDate(date);

  if (!parsed) return "No delivery date set";

  return parsed.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getDaysUntil(date?: string) {
  const parsed = parseProjectDate(date);

  if (!parsed) return null;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());

  return Math.ceil((target.getTime() - start.getTime()) / DAY);
}

function getCountdownParts(date?: string, now = Date.now()) {
  const target = parseProjectDate(date);

  if (!target) return null;

  const diff = target.getTime() - now;
  const abs = Math.abs(diff);

  return {
    overdue: diff < 0,
    days: Math.floor(abs / DAY),
    hours: Math.floor((abs % DAY) / HOUR),
    minutes: Math.floor((abs % HOUR) / MINUTE),
    seconds: Math.floor((abs % MINUTE) / SECOND),
  };
}

function getTone(parts: ReturnType<typeof getCountdownParts>) {
  if (!parts) {
    return {
      card: "border-slate-200 bg-slate-50 text-slate-600",
      badge: "border-slate-200 bg-white text-slate-600",
      value: "text-slate-700",
    };
  }

  if (parts.overdue) {
    return {
      card: "border-red-200 bg-red-50 text-red-700",
      badge: "border-red-200 bg-white text-red-700",
      value: "text-[#E61525]",
    };
  }

  if (parts.days <= 7) {
    return {
      card: "border-orange-200 bg-orange-50 text-orange-700",
      badge: "border-orange-200 bg-white text-orange-700",
      value: "text-[#FC7E24]",
    };
  }

  return {
    card: "border-emerald-200 bg-emerald-50 text-emerald-700",
    badge: "border-emerald-200 bg-white text-emerald-700",
    value: "text-[#29BE3E]",
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
    if (!targetDate) return;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, [targetDate]);

  const parts = useMemo(() => getCountdownParts(targetDate, now), [targetDate, now]);
  const tone = getTone(parts);

  if (compact) {
    const text = !parts
      ? "No delivery date set"
      : parts.overdue
        ? `${parts.days}d ${parts.hours}h overdue`
        : `${parts.days}d ${parts.hours}h ${parts.minutes}m left`;

    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <strong className="text-sm font-semibold text-slate-900">
          {formatProjectDate(targetDate)}
        </strong>
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
            tone.badge,
          ].join(" ")}
        >
          <CalendarClock size={12} />
          {text}
        </span>
      </span>
    );
  }

  if (!parts) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-slate-600">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#0064E0] ring-1 ring-slate-200">
            <CalendarClock size={18} />
          </span>
          <div>
            <strong className="block text-sm font-semibold text-slate-950">
              No delivery date set
            </strong>
            <span className="mt-1 block text-sm leading-6 text-slate-500">
              Set a target delivery date from the project settings to activate the countdown.
            </span>
          </div>
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
    <div
      className={[
        "rounded-[24px] border p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]",
        tone.card,
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="block text-xs font-bold uppercase tracking-[0.18em] opacity-70">
            {parts.overdue ? "Deadline overdue" : "Time remaining"}
          </span>
          <strong className="mt-1 block text-sm font-semibold text-slate-950">
            {formatProjectDate(targetDate)}
          </strong>
        </div>

        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
            tone.badge,
          ].join(" ")}
        >
          <CalendarClock size={13} />
          {parts.overdue ? "Overdue" : "Live countdown"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {units.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/70 bg-white p-4 text-center shadow-sm"
          >
            <strong className={["block text-2xl font-semibold tracking-[-0.05em]", tone.value].join(" ")}>
              {String(value).padStart(2, "0")}
            </strong>
            <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}