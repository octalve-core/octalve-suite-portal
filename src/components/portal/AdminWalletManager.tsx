"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCcw,
  Search,
  WalletCards,
  XCircle,
} from "lucide-react";

import { api } from "@/lib/api";
import type { AdminWalletOverview, WalletLedgerEntry, WalletTopUp } from "@/lib/types";
import { Badge, Button, Card, EmptyState, Input, Select, Spinner, formatNaira } from "./UI";

type WalletTab = "CLIENTS" | "TOPUPS" | "LEDGER";
type StatusFilter = "ALL" | "INITIALIZED" | "PENDING" | "CONFIRMED" | "FAILED" | "CANCELLED";
type ProviderFilter = "ALL" | "PAYSTACK" | "FLUTTERWAVE" | "WALLET" | "MANUAL_BANK";

const STATUS_LABELS: Record<string, string> = {
  INITIALIZED: "Initialized",
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

function formatDateTime(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function providerLabel(value?: string) {
  if (!value) return "Not set";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(status?: string) {
  if (status === "CONFIRMED") return "badge-green";
  if (status === "FAILED" || status === "CANCELLED") return "badge-red";
  if (status === "PENDING" || status === "INITIALIZED") return "badge-orange";
  return "badge-slate";
}

function directionIcon(entry: WalletLedgerEntry) {
  return entry.direction === "IN" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />;
}

function referenceMatches(value: string | undefined, query: string) {
  return String(value ?? "").toLowerCase().includes(query);
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-sm font-bold text-slate-500">{label}</span>
          <strong className="mt-3 block text-3xl font-semibold tracking-[-0.055em] text-slate-950">
            {value}
          </strong>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{helper}</p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          {icon}
        </span>
      </div>
    </Card>
  );
}

function ClientWalletCard({
  client,
}: {
  client: AdminWalletOverview["clients"][number];
}) {
  return (
    <Card className="border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
            {client.user.name}
          </h3>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            {client.user.email}
            {client.user.company ? ` • ${client.user.company}` : ""}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right">
          <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Balance
          </span>
          <strong className="block text-lg font-semibold tracking-[-0.04em] text-emerald-800">
            {formatNaira(client.balance)}
          </strong>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <MiniMetric label="Credited" value={formatNaira(client.totalIn)} />
        <MiniMetric label="Spent" value={formatNaira(client.totalOut)} />
        <MiniMetric label="Top-ups" value={client.topUpCount} />
        <MiniMetric label="Ledger Entries" value={client.ledgerEntryCount} />
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-500">
        Last activity: {formatDateTime(client.lastActivityAt)}
      </div>
    </Card>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <strong className="mt-1 block truncate text-sm font-bold text-slate-900">
        {value}
      </strong>
    </div>
  );
}

function TopUpRow({ topUp }: { topUp: WalletTopUp & { user?: { name: string; email: string } | null } }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm font-bold text-slate-950">{topUp.reference}</strong>
            <Badge className={statusTone(topUp.status)}>
              {STATUS_LABELS[topUp.status] ?? topUp.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {topUp.user?.name ?? "Client"} • {providerLabel(topUp.provider)} • {formatDateTime(topUp.createdAt)}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <strong className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
            {formatNaira(topUp.amount)}
          </strong>
          <Link
            href={`/admin/wallet/${topUp.id}`}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:text-[#0064E0]"
          >
            Open Audit
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Provider Status" value={topUp.providerStatus ? providerLabel(topUp.providerStatus) : "Not set"} />
        <MiniMetric label="Provider Record" value={topUp.providerReference ? "Recorded" : "Not set"} />
        <MiniMetric label="Gateway Issue" value={topUp.failureReason ? "Recorded" : "None"} />
      </div>
    </div>
  );
}

function LedgerRow({
  entry,
}: {
  entry: AdminWalletOverview["ledgerEntries"][number];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-600 ring-1 ring-slate-200">
            {directionIcon(entry)}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm font-bold text-slate-950">
                {entry.description || entry.reference}
              </strong>
              <Badge className={entry.direction === "IN" ? "badge-green" : "badge-slate"}>
                {entry.entryType} / {entry.direction}
              </Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {entry.user?.name ?? "Client"} • {entry.reference} • {formatDateTime(entry.createdAt)}
            </p>
          </div>
        </div>

        <strong
          className={[
            "text-lg font-semibold tracking-[-0.04em]",
            entry.direction === "IN" ? "text-emerald-700" : "text-slate-950",
          ].join(" ")}
        >
          {entry.direction === "IN" ? "+" : "-"}
          {formatNaira(entry.amount)}
        </strong>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <MiniMetric label="Balance After" value={typeof entry.balanceAfter === "number" ? formatNaira(entry.balanceAfter) : "Not set"} />
        <MiniMetric label="Project" value={entry.project?.title ?? "Not linked"} />
        <MiniMetric label="Payment" value={entry.payment?.reference ?? "Not linked"} />
        <MiniMetric label="Top-up" value={entry.topUp?.reference ?? "Not linked"} />
      </div>
    </div>
  );
}

export function AdminWalletManager() {
  const [overview, setOverview] = useState<AdminWalletOverview | null>(null);
  const [activeTab, setActiveTab] = useState<WalletTab>("CLIENTS");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadWallet(mode: "initial" | "refresh" = "initial") {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const data = await api.adminWallet.overview();
      setOverview(data);
    } catch (err) {
      void err;
      setError("Unable to load admin wallet records. Please refresh or contact support.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadWallet("initial");
  }, []);

  const search = query.trim().toLowerCase();

  const clients = useMemo(() => {
    const rows = overview?.clients ?? [];

    if (!search) return rows;

    return rows.filter((client) =>
      [
        client.user.name,
        client.user.email,
        client.user.company,
        client.user.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [overview?.clients, search]);

  const topUps = useMemo(() => {
    return (overview?.topUps ?? [])
      .filter((topUp) => (statusFilter === "ALL" ? true : topUp.status === statusFilter))
      .filter((topUp) => (providerFilter === "ALL" ? true : topUp.provider === providerFilter))
      .filter((topUp) => {
        if (!search) return true;

        return [
          topUp.reference,
          topUp.provider,
          topUp.status,
          topUp.providerReference,
          topUp.providerStatus,
          topUp.user?.name,
          topUp.user?.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);
      });
  }, [overview?.topUps, providerFilter, search, statusFilter]);

  const ledgerEntries = useMemo(() => {
    return (overview?.ledgerEntries ?? [])
      .filter((entry) => (providerFilter === "ALL" ? true : referenceMatches(entry.reference, providerFilter.toLowerCase())))
      .filter((entry) => {
        if (!search) return true;

        return [
          entry.reference,
          entry.description,
          entry.entryType,
          entry.direction,
          entry.user?.name,
          entry.user?.email,
          entry.project?.title,
          entry.payment?.reference,
          entry.topUp?.reference,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);
      });
  }, [overview?.ledgerEntries, providerFilter, search]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-375 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="grid min-h-90 place-items-center border-slate-200 bg-white p-8">
          <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-500">
            <Spinner size={20} />
            Loading admin wallet...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-375 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#001f4f] to-[#0064E0] p-6 text-white sm:p-8">
          <div className="absolute right-[-90px] top-[-110px] h-72 w-72 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white/80">
                Finance Control
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
                Admin Wallet
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/75 sm:text-[15px]">
                Monitor client wallet balances, top-up attempts, confirmed wallet credits and project payment ledger deductions.
              </p>
            </div>

            <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 text-left backdrop-blur sm:min-w-80">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                Total Wallet Balance
              </span>
              <strong className="mt-2 block text-4xl font-semibold tracking-[-0.065em]">
                {formatNaira(overview?.summary.totalBalance ?? 0)}
              </strong>
              <p className="mt-2 text-sm font-medium text-white/65">
                Ledger-calculated across active client wallets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Active Wallets"
          value={overview?.summary.activeWalletCount ?? 0}
          helper={`${overview?.summary.clientCount ?? 0} client accounts in scope.`}
          icon={<WalletCards size={20} />}
        />
        <SummaryCard
          label="Confirmed Top-ups"
          value={formatNaira(overview?.summary.confirmedTopUpTotal ?? 0)}
          helper={`${overview?.summary.pendingTopUpCount ?? 0} pending top-up records.`}
          icon={<CheckCircle2 size={20} />}
        />
        <SummaryCard
          label="Total Spent"
          value={formatNaira(overview?.summary.totalSpent ?? 0)}
          helper="Project payment deductions and wallet outflows."
          icon={<CreditCard size={20} />}
        />
        <SummaryCard
          label="Failed Top-ups"
          value={overview?.summary.failedTopUpCount ?? 0}
          helper={`${overview?.summary.ledgerEntryCount ?? 0} ledger entries recorded.`}
          icon={<XCircle size={20} />}
        />
      </section>

      <section className="mt-6 rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                Wallet Visibility
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Read-only finance visibility for client wallet balances, top-up activity and wallet ledger entries.
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={() => loadWallet("refresh")}
              loading={refreshing}
              disabled={refreshing}
            >
              <RefreshCcw size={16} />
              Refresh
            </Button>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_190px_190px]">
            <label className="block">
              <span className="sr-only">Search wallet records</span>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search client, reference, provider..."
                  className="h-12 rounded-2xl border-slate-200 pl-11 text-sm placeholder:text-slate-400"
                />
              </div>
            </label>

            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-12 rounded-2xl border-slate-200 px-4 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="INITIALIZED">Initialized</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>

            <Select
              value={providerFilter}
              onChange={(event) => setProviderFilter(event.target.value as ProviderFilter)}
              className="h-12 rounded-2xl border-slate-200 px-4 text-sm"
            >
              <option value="ALL">All Providers</option>
              <option value="PAYSTACK">Paystack</option>
              <option value="FLUTTERWAVE">Flutterwave</option>
              <option value="WALLET">Wallet</option>
              <option value="MANUAL_BANK">Manual Bank</option>
            </Select>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(["CLIENTS", "TOPUPS", "LEDGER"] as WalletTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-bold transition",
                  activeTab === tab
                    ? "border-[#0064E0] bg-[#0064E0] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-[#0064E0]",
                ].join(" ")}
              >
                {tab === "CLIENTS" ? "Client Balances" : tab === "TOPUPS" ? "Top-ups" : "Ledger"}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === "CLIENTS" ? (
            clients.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {clients.map((client) => (
                  <ClientWalletCard key={client.user.id} client={client} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<WalletCards size={30} />}
                title="No client wallet records"
                body="Client wallet balances will appear after wallet funding or project payment ledger activity."
              />
            )
          ) : null}

          {activeTab === "TOPUPS" ? (
            topUps.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {topUps.map((topUp) => (
                  <TopUpRow key={topUp.id} topUp={topUp} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Clock3 size={30} />}
                title="No matching top-ups"
                body="Top-up records will appear here after clients initiate wallet funding."
              />
            )
          ) : null}

          {activeTab === "LEDGER" ? (
            ledgerEntries.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {ledgerEntries.map((entry) => (
                  <LedgerRow key={entry.id} entry={entry} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<WalletCards size={30} />}
                title="No matching ledger entries"
                body="Ledger entries will appear after confirmed top-ups, project payments or wallet movements."
              />
            )
          ) : null}
        </div>
      </section>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/admin/payments"
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-[#0064E0]"
        >
          Open Payments
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}