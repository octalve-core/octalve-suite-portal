"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock3,
  Filter,
  RefreshCcw,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";

import { api } from "@/lib/api";
import type { AdminActionAuditPage, AdminActionAuditRecord } from "@/lib/types";

const ACTION_OPTIONS = [
  "FLAG_THREAT",
  "CLEAR_THREAT",
  "TEAM_MEMBER_CREATE",
  "TEAM_MEMBER_UPDATE",
  "TEAM_MEMBER_DEACTIVATE",
  "DEACTIVATE_CLIENT",
  "REACTIVATE_CLIENT",
  "UPDATE_CLIENT_ROLE",
  "PROJECT_DEACTIVATE",
  "PROJECT_REACTIVATE",
  "PAYMENT_CONFIRM",
  "PAYMENT_REJECT",
];

const RISK_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TARGET_OPTIONS = ["CLIENT", "TEAM_MEMBER", "PROJECT", "PAYMENT"];

function labelFromConstant(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function riskClass(value: string) {
  if (value === "CRITICAL") return "border-red-200 bg-red-50 text-red-700";
  if (value === "HIGH") return "border-orange-200 bg-orange-50 text-orange-700";
  if (value === "LOW") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-blue-100 bg-blue-50 text-blue-700";
}

function formatDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "Unknown time";

  return `${parsed.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })} ${parsed.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function metadataEntries(metadata?: Record<string, unknown> | null) {
  if (!metadata) return [];

  return Object.entries(metadata)
    .filter(([key]) => key !== "redactedFieldCount")
    .slice(0, 8)
    .map(([key, value]) => {
      const rawValue =
        typeof value === "string"
          ? value
          : JSON.stringify(value, null, 0) ?? "";

      return {
        key,
        value: rawValue.length > 120 ? `${rawValue.slice(0, 120)}...` : rawValue,
      };
    });
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      >
        <option value="ALL">All</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {labelFromConstant(item)}
          </option>
        ))}
      </select>
    </label>
  );
}

function AuditStatCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  tone: "blue" | "orange" | "red";
}) {
  const toneClass =
    tone === "red"
      ? "bg-red-50 text-red-700 ring-red-100"
      : tone === "orange"
        ? "bg-orange-50 text-orange-700 ring-orange-100"
        : "bg-blue-50 text-[#0064E0] ring-blue-100";

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <span className={["grid h-11 w-11 place-items-center rounded-2xl ring-1", toneClass].join(" ")}>
        {tone === "red" ? <AlertTriangle size={19} /> : <ShieldCheck size={19} />}
      </span>
      <strong className="mt-4 block text-3xl font-semibold tracking-[-0.055em] text-slate-950">
        {value}
      </strong>
      <span className="mt-1 block text-sm font-bold text-slate-700">{label}</span>
      <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p>
    </div>
  );
}

function AuditRecordCard({ item }: { item: AdminActionAuditRecord }) {
  const entries = metadataEntries(item.metadata);
  const redactedFieldCount =
    item.metadata && typeof item.metadata.redactedFieldCount === "number"
      ? item.metadata.redactedFieldCount
      : 0;

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={["rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em]", riskClass(item.riskLevel)].join(" ")}>
              {item.riskLevel}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
              {item.targetType}
            </span>
          </div>

          <h2 className="mt-3 text-lg font-semibold tracking-[-0.035em] text-slate-950">
            {labelFromConstant(item.action)}
          </h2>

          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Target: {item.targetLabel || item.targetId || "Not recorded"}
          </p>
        </div>

        <div className="grid gap-2 text-sm text-slate-500 lg:min-w-[250px]">
          <span className="inline-flex items-center gap-2 font-semibold">
            <Clock3 size={15} />
            {formatDateTime(item.createdAt)}
          </span>
          <span className="inline-flex items-center gap-2 font-semibold">
            <UserRoundCog size={15} />
            {item.actorName || item.actorEmail || "System / unknown actor"}
          </span>
        </div>
      </div>

      {item.reason ? (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
          {item.reason}
        </div>
      ) : null}

      {entries.length || redactedFieldCount ? (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              Safe metadata
            </span>
            {redactedFieldCount ? (
              <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-black text-orange-700">
                {redactedFieldCount} redacted
              </span>
            ) : null}
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {entries.map((entry) => (
              <div key={entry.key} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <span className="block text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                  {entry.key}
                </span>
                <span className="mt-1 block break-words text-sm font-semibold text-slate-700">
                  {entry.value || "Not set"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function AdminAuditWorkspace() {
  const [page, setPage] = useState<AdminActionAuditPage | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [action, setAction] = useState("ALL");
  const [riskLevel, setRiskLevel] = useState("ALL");
  const [targetType, setTargetType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const activeFilters = useMemo(
    () => [action, riskLevel, targetType].filter((item) => item !== "ALL").length,
    [action, riskLevel, targetType],
  );

  async function loadAudit(mode: "initial" | "refresh" = "initial") {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);

    setError("");

    try {
      const data = await api.adminAudit.list({
        page: pageNumber,
        pageSize: 25,
        action: action === "ALL" ? undefined : action,
        riskLevel: riskLevel === "ALL" ? undefined : riskLevel,
        targetType: targetType === "ALL" ? undefined : targetType,
      });

      setPage(data);
    } catch (err) {
      void err;
      setError("Unable to load admin audit logs. Please refresh and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAudit("initial");
  }, [pageNumber, action, riskLevel, targetType]);

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPageNumber(1);
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-linear-to-br from-white via-white to-blue-50 p-6 shadow-[0_22px_65px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.28em] text-[#0064E0]">
              Admin Audit
            </span>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-[46px]">
              Action audit trail
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-[15px]">
              Review sensitive admin actions, role changes, project deactivations, client controls and payment decisions from sanitized audit records.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white/80 p-4 text-sm font-semibold leading-6 text-blue-900 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            Sensitive metadata is sanitized server-side before display. Provider references, tokens, secrets and raw error details are not shown.
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        <AuditStatCard
          label="Shown Records"
          value={page?.summary.shownCount ?? 0}
          helper="Records currently visible on this page."
          tone="blue"
        />
        <AuditStatCard
          label="High Risk"
          value={page?.summary.highCount ?? 0}
          helper="High-risk actions in the selected filter."
          tone="orange"
        />
        <AuditStatCard
          label="Critical Risk"
          value={page?.summary.criticalCount ?? 0}
          helper="Critical actions in the selected filter."
          tone="red"
        />
      </section>

      <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
              <Filter size={18} />
            </span>
            <div>
              <strong className="block text-sm font-bold text-slate-950">
                Filters
              </strong>
              <span className="text-sm font-medium text-slate-500">
                {activeFilters ? `${activeFilters} active filter${activeFilters === 1 ? "" : "s"}` : "Showing all audit actions"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadAudit("refresh")}
            disabled={loading || refreshing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <FilterSelect
            label="Action"
            value={action}
            options={ACTION_OPTIONS}
            onChange={(value) => updateFilter(setAction, value)}
          />
          <FilterSelect
            label="Risk"
            value={riskLevel}
            options={RISK_OPTIONS}
            onChange={(value) => updateFilter(setRiskLevel, value)}
          />
          <FilterSelect
            label="Target"
            value={targetType}
            options={TARGET_OPTIONS}
            onChange={(value) => updateFilter(setTargetType, value)}
          />
        </div>
      </section>

      {error ? (
        <section className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </section>
      ) : null}

      {loading ? (
        <section className="mt-5 grid min-h-72 place-items-center rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-500">
            <RefreshCcw size={18} className="animate-spin" />
            Loading admin audit logs...
          </div>
        </section>
      ) : null}

      {!loading && page && page.items.length ? (
        <section className="mt-5 grid gap-4">
          {page.items.map((item) => (
            <AuditRecordCard key={item.id} item={item} />
          ))}
        </section>
      ) : null}

      {!loading && page && !page.items.length ? (
        <section className="mt-5 grid min-h-72 place-items-center rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <div>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
              <ShieldCheck size={24} />
            </span>
            <h2 className="mt-4 text-lg font-semibold tracking-[-0.035em] text-slate-950">
              No audit records found
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Audit logs will appear here after protected admin actions are performed.
            </p>
          </div>
        </section>
      ) : null}

      {page ? (
        <section className="mt-5 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-slate-500">
            Page {page.pagination.page} of {page.pagination.totalPages} • {page.pagination.total} total records
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!page.pagination.hasPreviousPage || loading}
              onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
              className="min-h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!page.pagination.hasNextPage || loading}
              onClick={() => setPageNumber((value) => value + 1)}
              className="min-h-10 rounded-2xl bg-[#0064E0] px-4 text-sm font-bold text-white transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
