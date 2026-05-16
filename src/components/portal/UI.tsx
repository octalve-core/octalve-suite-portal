"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
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
  status?:
    | ProjectStatus
    | PhaseStatus
    | PaymentStatus
    | DeliverableStatus
    | Role
    | string,
) {
  if (!status) return "";
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
  loading = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "dark" | "danger" | "ghost" | "success";
  loading?: boolean;
}) {
  return (
    <button
      className={cx("btn", `btn-${variant}`, className, loading && "loading")}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg
          className="spinner"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: "spin 0.8s linear infinite" }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )}
      {children}
    </button>
  );
}

export function Badge({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={cx("badge", className)} style={style}>
      {children}
    </span>
  );
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

export function ProgressBar({
  value,
  className = "",
  style,
}: {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cx("progress", className)} style={style}>
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

export type ViewMode = "list" | "grid" | "grid2" | "grid3";

export interface DataListProps<T> {
  data: T[];
  filterFn?: (item: T, query: string) => boolean;
  renderItem: (item: T, viewMode: ViewMode) => React.ReactNode;
  itemsPerPage?: number;
  emptyState?: React.ReactNode;
  title?: React.ReactNode;
  allowedViews?: ViewMode[];
  defaultView?: ViewMode;
  allowReverse?: boolean;
  actions?: React.ReactNode;
}

export function DataList<T>({
  data,
  filterFn,
  renderItem,
  itemsPerPage = 10,
  emptyState,
  title,
  allowedViews = ["list", "grid"],
  defaultView = "list",
  allowReverse = true,
  actions,
}: DataListProps<T>) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>(defaultView);
  const [isReversed, setIsReversed] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = data;
    if (query && filterFn) {
      result = data.filter((item) => filterFn(item, query));
    }
    if (isReversed) {
      result = [...result].reverse();
    }
    return result;
  }, [data, query, filterFn, isReversed]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const currentData = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  // Reset page when query changes
  useEffect(() => setPage(1), [query]);

  const viewClassMap: Record<ViewMode, string> = {
    list: "stack",
    grid: "grid-2-even", // 2 items per row
    grid2: "grid-3", // 3 items per row
    grid3: "grid-4", // 4 items per row
  };

  return (
    <Card className="datalist-card">
      <div
        className="card-title datalist-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div className="datalist-title">{title}</div>
        <div
          className="datalist-controls"
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            flex: 1,
            justifyContent: "flex-end",
          }}
        >
          {actions && (
            <div
              className="datalist-actions"
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              {actions}
            </div>
          )}
          {filterFn && (
            <div
              className="datalist-search"
              style={{ position: "relative", minWidth: 160 }}
            >
              <Input
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 12px 6px 12px",
                  height: 36,
                  fontSize: 13,
                }}
              />
            </div>
          )}
          <div
            className="datalist-views"
            style={{
              display: "flex",
              gap: 4,
              background: "var(--surface-soft)",
              padding: 4,
              borderRadius: 8,
              border: "1px solid var(--line)",
            }}
          >
            {allowReverse && (
              <button
                onClick={() => setIsReversed(!isReversed)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: isReversed ? "var(--surface)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Reverse Order"
              >
                ⇅
              </button>
            )}

            {allowedViews.map((v) => {
              let icon = "☰";
              if (v === "grid") icon = "⊞";
              if (v === "grid2") icon = "⊟"; // using a different box for grid2
              if (v === "grid3") icon = "▦";

              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    background: view === v ? "var(--surface)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={`${v} View`}
                >
                  {icon}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`card-body ${viewClassMap[view]}`}>
        {currentData.length > 0
          ? currentData.map((item, index) => renderItem(item, view))
          : emptyState || <p>No results found.</p>}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            padding: 16,
            borderTop: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>

          <span style={{ fontSize: 14, color: "var(--muted)" }}>
            Page {page} of {totalPages}
          </span>

          <Button
            variant="secondary"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </Card>
  );
}

export function Spinner({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={cx("spinner", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function Skeleton({
  className = "",
  width,
  height,
  circle = false,
}: {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}) {
  return (
    <div
      className={cx("skeleton", className)}
      style={{
        width,
        height,
        borderRadius: circle ? "50%" : undefined,
      }}
    />
  );
}

export function PageLoading() {
  return (
    <div className="page-loading-wrapper">
      <div className="page-loading-logo">
        <div
          className="logo-mark"
          style={{ width: 64, height: 64, fontSize: 32 }}
        >
          O
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Spinner size={20} />
        <span
          style={{
            fontWeight: 700,
            color: "var(--muted)",
            letterSpacing: "0.05em",
          }}
        >
          LOADING PORTAL...
        </span>
      </div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <Card style={{ padding: 24 }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <Skeleton circle width={48} height={48} />
        <div style={{ flex: 1, display: "grid", gap: 8 }}>
          <Skeleton width="40%" height={20} />
          <Skeleton width="60%" height={14} />
        </div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <Skeleton width="100%" height={16} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="80%" height={16} />
      </div>
    </Card>
  );
}
