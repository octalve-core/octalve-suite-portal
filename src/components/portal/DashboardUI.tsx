"use client";

import { useApp } from "./AppContext";
import Link from "next/link";
import type React from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Layers3,
  TrendingUp,
} from "lucide-react";
import { Card, cx, ProgressBar } from "./UI";

type Tone = "blue" | "green" | "orange" | "red" | "purple" | "slate";

function toneClass(tone: Tone) {
  return `dash-tone-${tone}`;
}

export function DashboardHero({
  eyebrow,
  title,
  subtitle,
  action,
  meta,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: any;
  meta?: any;
}) {
  const { currentUser } = useApp();

  const role = currentUser?.role;
  const lowerEyebrow = String(eyebrow ?? "").toLowerCase();
  const lowerTitle = String(title ?? "").toLowerCase();

  const tone =
    role === "SUPER_ADMIN" ||
    role === "PROJECT_MANAGER" ||
    lowerEyebrow.includes("admin") ||
    lowerEyebrow.includes("command")
      ? "admin"
      : role === "STAFF" || lowerEyebrow.includes("staff")
        ? "staff"
        : "client";

  const toneClass =
    tone === "admin"
      ? "bg-[#E61525]"
      : tone === "staff"
        ? "bg-[#29BE3E]"
        : "bg-[#0064E0]";

  const actionToneClass =
    tone === "admin"
      ? "[&_button]:!text-[#E61525] [&_a]:!text-[#E61525]"
      : tone === "staff"
        ? "[&_button]:!text-[#29BE3E] [&_a]:!text-[#29BE3E]"
        : "[&_button]:!text-[#0064E0] [&_a]:!text-[#0064E0]";

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  const userLabel =
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "there";

  const isWelcome =
    lowerTitle.includes("welcome") ||
    lowerEyebrow.includes("workspace") ||
    lowerEyebrow.includes("client");

  const finalTitle =
    isWelcome && tone === "client"
      ? "Welcome back to your workspace"
      : title;

  const finalSubtitle =
    isWelcome && tone === "client"
      ? "Track projects, approvals, payments and delivery timelines from one clean workspace."
      : subtitle;

  return (
    <section
      className={[
        "relative isolate mb-7 overflow-hidden rounded-[28px]",
        "px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10",
        "shadow-[0_22px_60px_rgba(15,23,42,0.14)]",
        toneClass,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute right-8 top-10 hidden h-24 w-24 rounded-[28px] bg-white/10 lg:block" />

      <div className="relative z-10 grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">          {!lowerEyebrow.includes("team operations") && !lowerEyebrow.includes("client feedback") ? (
            <p className="mb-3 text-sm font-semibold tracking-[-0.01em] text-white/80">
              {greeting}, {userLabel}.
            </p>
          ) : null}

          {!isWelcome && eyebrow ? (
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/70">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="max-w-205 text-[32px] font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:text-[42px] lg:text-[52px]">
            {finalTitle}
          </h1>

          {finalSubtitle ? (
            <p className="mt-4 max-w-175 text-[15px] font-medium leading-7 text-white/85 sm:text-[16px]">
              {finalSubtitle}
            </p>
          ) : null}

          {meta ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 text-white [&_.badge]:border-white/25 [&_.badge]:bg-white/12 [&_.badge]:text-white">
              {meta}
            </div>
          ) : null}
        </div>

        {action ? (
          <div
            className={[
              "flex shrink-0 items-center justify-start lg:justify-end",
              "[&_a]:bg-transparent! [&_a]:p-0! [&_a]:shadow-none!",
              "[&_button]:min-h-12! [&_button]:rounded-2xl! [&_button]:border-0!",
              "[&_button]:bg-white! [&_button]:px-6! [&_button]:font-semibold!",
              "[&_button]:shadow-[0_16px_34px_rgba(15,23,42,0.16)]!",
              actionToneClass,
            ].join(" ")}
          >
            {action}
          </div>
        ) : null}
      </div>
    </section>
  );
}





export function DashboardStats({
  items,
}: {
  items: Array<{
    label: string;
    value: string | number;
    tone?: Tone;
    icon?: React.ReactNode;
    helper?: string;
  }>;
}) {
  return (
    <div className="dashboard-stats">
      {items.map((item) => (
        <Card key={item.label} className="dashboard-stat-card">
          <div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.helper && <p>{item.helper}</p>}
          </div>
          <div className={cx("dashboard-stat-icon", toneClass(item.tone ?? "blue"))}>
            {item.icon ?? <TrendingUp size={20} />}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function DashboardPanel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cx("dashboard-panel", className)}>
      <div className="dashboard-panel-head">
        <h2>{title}</h2>
        {action}
      </div>
      <div className="dashboard-panel-body">{children}</div>
    </Card>
  );
}

export function DashboardProgressCard({
  label,
  title,
  value,
  helper,
  tone = "blue",
}: {
  label: string;
  title: string;
  value: number;
  helper?: string;
  tone?: Tone;
}) {
  const safeValue = Math.max(0, Math.min(value, 100));

  return (
    <Card className="dashboard-progress-card">
      <div className="dashboard-progress-top">
        <span>{label}</span>
        <strong>{safeValue}%</strong>
      </div>
      <h3>{title}</h3>
      {helper && <p>{helper}</p>}
      <ProgressBar
        value={safeValue}
        style={{
          "--progress-fill":
            tone === "green"
              ? "#10b981"
              : tone === "orange"
                ? "#f59e0b"
                : tone === "red"
                  ? "#ef4444"
                  : "#0064E0",
        } as React.CSSProperties}
      />
    </Card>
  );
}

export function DashboardListItem({
  href,
  title,
  subtitle,
  badge,
  meta,
  icon,
}: {
  href?: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const content = (
    <>
      <div className="dashboard-list-main">
        <div className="dashboard-list-icon">
          {icon ?? <FolderKanban size={18} />}
        </div>
        <div>
          <strong>{title}</strong>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="dashboard-list-side">
        {badge}
        {meta}
        {href && <ArrowRight size={16} />}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="dashboard-list-item">
        {content}
      </Link>
    );
  }

  return <div className="dashboard-list-item">{content}</div>;
}

export const DashboardIcons = {
  project: <FolderKanban size={20} />,
  phase: <Layers3 size={20} />,
  clock: <Clock3 size={20} />,
  check: <CheckCircle2 size={20} />,
};
