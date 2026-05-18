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
  action?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  const { currentUser } = useApp();

  const lowerEyebrow = String(eyebrow ?? "").toLowerCase();
  const lowerTitle = String(title ?? "").toLowerCase();

  const isClientHero =
    currentUser?.role === "CLIENT" ||
    lowerEyebrow.includes("client");

  const isAdminHero =
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "PROJECT_MANAGER" ||
    lowerEyebrow.includes("admin");

  const isStaffHero =
    currentUser?.role === "STAFF" ||
    lowerEyebrow.includes("staff");

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  const userLabel =
    currentUser?.name ||
    currentUser?.company ||
    currentUser?.email?.split("@")[0] ||
    "there";

  const heroTone = isClientHero
    ? "dashboard-hero-client"
    : isAdminHero
      ? "dashboard-hero-admin"
      : isStaffHero
        ? "dashboard-hero-staff"
        : "dashboard-hero-default";

  const shouldPersonalizeClient =
    isClientHero &&
    (lowerTitle.includes("welcome") || lowerEyebrow.includes("client"));

  const displayTitle = shouldPersonalizeClient
    ? `${greeting}, ${userLabel}`
    : title;

  const displaySubtitle = shouldPersonalizeClient
    ? "Track your active project, approvals, payments, and delivery deadlines from one premium workspace."
    : subtitle;

  const showEyebrow = Boolean(eyebrow) && !shouldPersonalizeClient;

  return (
    <section className={`dashboard-hero dashboard-hero-solid ${heroTone}`}>
      <div className="dashboard-hero-content">
        <div className="dashboard-hero-copy">
          {showEyebrow && <span className="dashboard-eyebrow">{eyebrow}</span>}

          <h1>{displayTitle}</h1>

          {displaySubtitle && <p>{displaySubtitle}</p>}

          {meta && <div className="dashboard-hero-meta">{meta}</div>}
        </div>

        {action && <div className="dashboard-hero-action">{action}</div>}
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
