"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BarChart3,
  Bell,
  Check,
  CheckSquare,
  CircleHelp,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  FolderKanban,
  Grid2X2,
  Grid3X3,
  LayoutDashboard,
  Layers3,
  List,
  Loader2,
  LockKeyhole,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Sparkles,
  UserRoundCog,
  UsersRound,
  X,
} from "lucide-react";
import {
  DeliverableStatus,
  PackageType,
  PaymentStatus,
  PhaseStatus,
  Project,
  ProjectStatus,
  Role,
} from "@/lib/types";

type AnyStatus =
  | ProjectStatus
  | PhaseStatus
  | PaymentStatus
  | DeliverableStatus
  | Role
  | string;

function icon(Icon: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>, size = 18) {
  return <Icon size={size} strokeWidth={2.25} aria-hidden />;
}

export const Icons = {
  dashboard: icon(LayoutDashboard),
  projects: icon(FolderKanban),
  phases: icon(Layers3),
  approvals: icon(CheckSquare),
  support: icon(CircleHelp),
  clients: icon(UsersRound),
  templates: icon(FileText),
  team: icon(UserRoundCog),
  analytics: icon(BarChart3),
  payments: icon(CreditCard),
  settings: icon(Settings),
  ai: icon(Sparkles),
  bell: icon(Bell),
  plus: icon(Plus),
  arrow: icon(ArrowRight),
  back: icon(ArrowLeft),
  lock: icon(LockKeyhole),
  doc: icon(FileCheck2),
  check: icon(Check),
  clock: icon(Clock3),
  more: icon(MoreVertical),
  close: icon(X),
  search: icon(Search),
  list: icon(List),
  grid: icon(Grid2X2),
  gridLarge: icon(Grid3X3),
  sort: icon(ArrowUpDown),
};

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatNaira(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `₦${safeValue.toLocaleString("en-NG")}`;
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

export function packageClass(packageType?: string) {
  if (packageType === "Impact" || packageType === "BrandingStarter" || packageType === "BrandingProBiz" || packageType === "BrandingAdvance") {
    return "badge-red";
  }

  if (packageType === "Growth" || packageType === "WebsiteAdvance") {
    return "badge-green";
  }

  if (packageType === "Partner" || packageType === "Custom") {
    return "badge-purple";
  }

  if (packageType === "WebsiteStarter" || packageType === "WebsiteProBiz" || packageType === "LeapRegistration") {
    return "badge-orange";
  }

  return "badge-blue";
}

export function statusLabel(status?: AnyStatus) {
  if (!status) return "";

  return String(status)
    .split("_")
    .map((word) => word[0] + word.slice(1).toLowerCase())
    .join(" ");
}

export function statusClass(status: AnyStatus) {
  if (["ACTIVE", "APPROVED", "CONFIRMED", "COMPLETED"].includes(status)) {
    return "badge-green";
  }

  if (["IN_PROGRESS", "READY_FOR_REVIEW"].includes(status)) {
    return "badge-blue";
  }

  if (
    [
      "AWAITING_APPROVAL",
      "PENDING_CONFIRMATION",
      "PENDING_REVIEW",
      "APPROVED_AWAITING_DEPOSIT",
      "DEPOSIT_PENDING_CONFIRMATION",
      "AWAITING_BALANCE",
      "BALANCE_PENDING_CONFIRMATION",
      "INFO_REQUESTED",
    ].includes(status)
  ) {
    return "badge-orange";
  }

  if (["REJECTED", "CHANGES_REQUESTED", "NEEDS_CHANGES"].includes(status)) {
    return "badge-red";
  }

  if (["LOCKED", "NOT_STARTED", "UNPAID", "DRAFT", "CLIENT", "STAFF"].includes(status)) {
    return "badge-slate";
  }

  return "badge-purple";
}

export function Card({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
}) {
  return (
    <div className={cx("card", className)} {...props}>
      {children}
    </div>
  );
}

export function Spinner({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return <Loader2 size={size} className={cx("spinner", className)} aria-hidden />;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  loading = false,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "dark" | "danger" | "ghost" | "success";
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      type={type}
      className={cx("btn", `btn-${variant}`, className)}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
    >
      {loading && <Spinner size={18} />}
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

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("input", className)} {...props} />;
}

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("input textarea", className)} {...props} />;
}

export function Select({
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx("input select", className)} {...props} />;
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
          <button className="icon-btn" onClick={onClose} type="button" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: emptyIcon = Icons.doc,
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
      <div className="empty-icon">{emptyIcon}</div>
      {title && <h3>{title}</h3>}
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
  style?: React.CSSProperties & { "--progress-fill"?: string };
}) {
  const percentage = Math.max(0, Math.min(value, 100));
  const fill = style?.["--progress-fill"];

  return (
    <div className={cx("progress", className)} style={style}>
      <span style={{ width: `${percentage}%`, background: fill }} />
    </div>
  );
}

export function ProgressCircle({ value }: { value: number }) {
  const percentage = Math.max(0, Math.min(value, 100));

  return (
    <div
      className="circle-progress"
      style={{
        background: `conic-gradient(var(--primary) ${percentage * 3.6}deg, #eef2f7 0deg)`,
      }}
    >
      <div>
        <strong>{percentage}%</strong>
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
      <ArrowLeft size={17} /> {label}
    </Link>
  );
}

export function MetricCard({
  label,
  value,
  metricIcon,
  icon: legacyIcon,
  tone = "purple",
}: {
  label: string;
  value: string | number | undefined;
  metricIcon?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "purple" | "blue" | "green" | "orange" | "red";
}) {
  return (
    <Card className="metric-card">
      <div>
        <span>{label}</span>
        <strong>{value ?? 0}</strong>
      </div>
      <div className={cx("metric-icon", `tone-${tone}`)}>
        {metricIcon ?? legacyIcon}
      </div>
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

const viewIconMap: Record<ViewMode, React.ReactNode> = {
  list: <List size={16} />,
  grid: <Grid2X2 size={16} />,
  grid2: <Grid3X3 size={16} />,
  grid3: <Grid3X3 size={16} />,
};

export function DataList<T>({
  data,
  filterFn,
  renderItem,
  itemsPerPage: initialItemsPerPage = 10,
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
  const [pageSize, setPageSize] = useState(initialItemsPerPage);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentData = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [query, pageSize]);

  const viewClassMap: Record<ViewMode, string> = {
    list: "stack",
    grid: "grid-2-even",
    grid2: "grid-3",
    grid3: "grid-4",
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
              style={{ position: "relative", minWidth: 180 }}
            >
              <Input
                placeholder="Search..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  height: 36,
                  minHeight: 36,
                  fontSize: 13,
                }}
              />
            </div>
          )}

          <div
            className="datalist-pagesize"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Show:</span>
            <Select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              style={{
                height: 36,
                minHeight: 36,
                padding: "0 24px 0 10px",
                fontSize: 13,
                minWidth: 70,
                background: "var(--surface-soft)",
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Select>
          </div>

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
                onClick={() => setIsReversed((value) => !value)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: isReversed ? "var(--surface)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isReversed ? "var(--primary)" : "var(--muted)",
                }}
                title="Reverse order"
                type="button"
              >
                <ArrowUpDown size={16} />
              </button>
            )}

            {allowedViews.map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: view === mode ? "var(--surface)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: view === mode ? "var(--primary)" : "var(--muted)",
                }}
                title={`${mode} view`}
                type="button"
              >
                {viewIconMap[mode]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`card-body ${viewClassMap[view]}`}>
        {currentData.length > 0
          ? currentData.map((item) => renderItem(item, view))
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
            gap: 12,
          }}
        >
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>

          <span style={{ fontSize: 14, color: "var(--muted)" }}>
            Page {page} of {totalPages}
          </span>

          <Button
            variant="secondary"
            disabled={page === totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </Card>
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
        <img
          src="/octalve-logo.svg"
          alt="Octalve"
          className="brand-logo"
          style={{ width: 64, height: 64 }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Spinner size={22} />
        <span
          style={{
            fontWeight: 700,
            color: "var(--muted)",
            letterSpacing: "0.05em",
          }}
        >
          LOADING WORKSPACE...
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
