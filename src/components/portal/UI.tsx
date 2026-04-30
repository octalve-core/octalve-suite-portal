"use client";

import type React from "react";
import Link from "next/link";
import {
  DeliverableStatus,
  PackageType,
  PaymentStatus,
  PhaseStatus,
  Project,
  ProjectStatus,
  Role,
} from "@/lib/types";

export const Icons = {
  dashboard: "⌘",
  projects: "▣",
  phases: "▱",
  approvals: "☑",
  support: "?",
  clients: "♙",
  templates: "▤",
  team: "♟",
  analytics: "↗",
  payments: "₦",
  settings: "⚙",
  ai: "✦",
  bell: "🔔",
  plus: "+",
  arrow: "→",
  back: "←",
  lock: "▣",
  doc: "▤",
  check: "✓",
  clock: "◷",
  more: "⋮",
};

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

export function projectProgress(project: Project) {
  if (!project.phases.length) return 0;
  return Math.round(
    (project.phases.filter((phase) => phase.status === "APPROVED").length /
      project.phases.length) *
      100,
  );
}

export function activePhase(project: Project) {
  return (
    project.phases.find((phase) =>
      ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED"].includes(
        phase.status,
      ),
    ) ??
    project.phases.find((phase) => phase.status !== "LOCKED") ??
    project.phases[0]
  );
}

export function packageClass(type: PackageType) {
  const map: Record<PackageType, string> = {
    Launch: "badge-purple",
    Impact: "badge-orange",
    Growth: "badge-green",
    Partner: "badge-blue",
    Custom: "badge-slate",
  };
  return map[type];
}

export function statusLabel(
  status:
    | ProjectStatus
    | PhaseStatus
    | PaymentStatus
    | DeliverableStatus
    | Role,
) {
  return status
    .split("_")
    .map((word) => word[0] + word.slice(1).toLowerCase())
    .join(" ");
}

export function statusClass(
  status:
    | ProjectStatus
    | PhaseStatus
    | PaymentStatus
    | DeliverableStatus
    | Role,
) {
  if (["ACTIVE", "APPROVED", "CONFIRMED", "COMPLETED"].includes(status))
    return "badge-green";
  if (["IN_PROGRESS", "READY_FOR_REVIEW"].includes(status)) return "badge-blue";
  if (
    [
      "AWAITING_APPROVAL",
      "PENDING_CONFIRMATION",
      "PENDING_REVIEW",
      "APPROVED_AWAITING_DEPOSIT",
      "AWAITING_BALANCE",
      "BALANCE_PENDING_CONFIRMATION",
    ].includes(status)
  )
    return "badge-orange";
  if (["REJECTED", "CHANGES_REQUESTED", "NEEDS_CHANGES"].includes(status))
    return "badge-red";
  if (["LOCKED", "NOT_STARTED", "UNPAID", "DRAFT"].includes(status))
    return "badge-slate";
  return "badge-purple";
}

export function Card({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("card", className)} {...props}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "dark" | "danger" | "ghost" | "success";
}) {
  return (
    <button className={cx("btn", `btn-${variant}`, className)} {...props}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cx("badge", className)}>{children}</span>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return <textarea className="input textarea" {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="input select" {...props} />;
}

export function Modal({
  title,
  children,
  onClose,
  width = "520px",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  width?: string;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: width }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  icon = Icons.doc,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action && <div className="empty-action">{action}</div>}
    </Card>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress">
      <span style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
    </div>
  );
}

export function ProgressCircle({ value }: { value: number }) {
  return (
    <div
      className="circle-progress"
      style={{
        background: `conic-gradient(var(--primary) ${value * 3.6}deg, #eef2f7 0deg)`,
      }}
    >
      <div>
        <strong>{value}%</strong>
        <span>Complete</span>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function BackLink({
  href,
  label = "Back",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link className="back-link" href={href}>
      {Icons.back} {label}
    </Link>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  tone = "purple",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "purple" | "blue" | "green" | "orange" | "red";
}) {
  return (
    <Card className="metric-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className={cx("metric-icon", `tone-${tone}`)}>{icon}</div>
    </Card>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
