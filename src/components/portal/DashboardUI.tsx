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
    role === "SUPER_ADMIN" || role === "PROJECT_MANAGER" || lowerEyebrow.includes("admin")
      ? "admin"
      : role === "STAFF" || lowerEyebrow.includes("staff")
        ? "staff"
        : role === "CLIENT" || lowerEyebrow.includes("client")
          ? "client"
          : "default";

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  const userLabel =
    currentUser?.company ||
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "there";

  const isWelcome =
    lowerTitle.includes("welcome") ||
    lowerEyebrow.includes("workspace") ||
    lowerEyebrow.includes("client");

  const heroTitle =
    isWelcome && tone === "client"
      ? "Welcome back to your workspace"
      : title;

  const heroSubtitle =
    isWelcome && tone === "client"
      ? "Track active projects, approvals, payments and delivery timelines from one premium workspace."
      : subtitle;

  return (
    <section className={`dashboard-hero-compact dashboard-hero-compact-${tone}`}>
      <div className="dashboard-hero-glow" />

      <div className="dashboard-hero-compact-content">
        <div className="dashboard-hero-compact-copy">
          <span className="dashboard-hero-greeting">
            {greeting}, {userLabel}.
          </span>

          {eyebrow && !isWelcome && (
            <span className="dashboard-hero-kicker">{eyebrow}</span>
          )}

          <h1>{heroTitle}</h1>

          {heroSubtitle && <p>{heroSubtitle}</p>}

          {meta && <div className="dashboard-hero-compact-meta">{meta}</div>}
        </div>

        {action && (
          <div className="dashboard-hero-compact-actions">
            {action}
          </div>
        )}
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
