"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  CreditCard,
  Landmark,
  RefreshCcw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { api } from "@/lib/api";
import type { WalletLedgerEntry, WalletSummary } from "@/lib/types";
import { useApp } from "./AppContext";
import { Badge, Button, Card, EmptyState, PageHeader, Spinner, formatNaira } from "./UI";

function formatDate(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function entryTone(entry: WalletLedgerEntry) {
  if (entry.direction === "IN") return "badge-green";
  if (entry.entryType === "HOLD") return "badge-orange";
  if (entry.entryType === "REVERSAL") return "badge-red";
  return "badge-slate";
}

function entryIcon(entry: WalletLedgerEntry) {
  if (entry.direction === "IN") return <ArrowDownLeft size={18} />;
  return <ArrowUpRight size={18} />;
}

function WalletMetric({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-sm font-bold text-slate-500">{label}</span>
          <strong className="mt-3 block text-3xl font-semibold tracking-[-0.055em] text-slate-950">
            {formatNaira(value)}
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

function WalletEntryRow({ entry }: { entry: WalletLedgerEntry }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-600 ring-1 ring-slate-200">
            {entryIcon(entry)}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm text-slate-950">
                {entry.description || entry.entryType.replaceAll("_", " ")}
              </strong>
              <Badge className={entryTone(entry)}>{entry.entryType.replaceAll("_", " ")}</Badge>
            </div>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {entry.reference} • {formatDate(entry.createdAt)}
            </p>
          </div>
        </div>

        <strong
          className={[
            "text-lg font-semibold tracking-[-0.04em]",
            entry.direction === "IN" ? "text-emerald-700" : "text-slate-900",
          ].join(" ")}
        >
          {entry.direction === "IN" ? "+" : "-"}
          {formatNaira(entry.amount)}
        </strong>
      </div>
    </div>
  );
}

export function ClientWalletManager() {
  const { currentUser } = useApp();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
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
      const data = await api.wallet.get();
      setWallet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load wallet.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadWallet("initial");
  }, []);

  const entries = useMemo(() => wallet?.entries ?? [], [wallet]);

  if (loading) {
    return (
      <div className="content narrow">
        <Card className="grid min-h-[360px] place-items-center border-slate-200 bg-white p-8">
          <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-500">
            <Spinner size={20} />
            Loading wallet...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#001f4f] via-[#0064E0] to-[#0f172a] p-6 text-white sm:p-8">
          <div className="absolute right-[-90px] top-[-110px] h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-[-120px] left-[-120px] h-72 w-72 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white/80">
                Secure Wallet
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
                Octalve Wallet
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/75 sm:text-[15px]">
                View wallet balance, ledger movement, credits and project payment deductions from one protected account.
              </p>
            </div>

            <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 text-left backdrop-blur sm:min-w-[320px]">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                Available Balance
              </span>
              <strong className="mt-2 block text-4xl font-semibold tracking-[-0.065em]">
                {formatNaira(wallet?.availableBalance ?? 0)}
              </strong>
              <p className="mt-2 text-sm font-medium text-white/65">
                {currentUser?.name ?? "Client"} • Ledger-backed balance
              </p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WalletMetric
          label="Available"
          value={wallet?.availableBalance ?? 0}
          helper="Usable wallet value."
          icon={<WalletCards size={20} />}
        />
        <WalletMetric
          label="Held"
          value={wallet?.heldBalance ?? 0}
          helper="Reserved or pending wallet movement."
          icon={<Clock3 size={20} />}
        />
        <WalletMetric
          label="Total Credited"
          value={wallet?.totalCredited ?? 0}
          helper="All confirmed wallet credits."
          icon={<ArrowDownLeft size={20} />}
        />
        <WalletMetric
          label="Project Spend"
          value={wallet?.totalSpent ?? 0}
          helper="Wallet payments used for projects."
          icon={<CreditCard size={20} />}
        />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-slate-200 bg-white p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                Ledger History
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Every wallet movement will appear here once wallet funding or deductions are enabled.
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

          <div className="grid gap-3 p-5">
            {entries.length ? (
              entries.map((entry) => <WalletEntryRow key={entry.id} entry={entry} />)
            ) : (
              <EmptyState
                icon={<WalletCards size={30} />}
                title="No wallet activity yet"
                body="Wallet ledger records will appear here after approved top-ups, refunds, deductions, or project payments."
              />
            )}
          </div>
        </Card>

        <aside className="grid gap-4 self-start">
          <Card className="border-blue-100 bg-blue-50 p-5 shadow-[0_14px_34px_rgba(0,100,224,0.06)]">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-[#0064E0]" size={21} />
              <div>
                <strong className="block text-sm font-bold text-blue-950">
                  Ledger-backed wallet
                </strong>
                <p className="mt-1 text-sm leading-6 text-blue-800">
                  The wallet does not trust browser values. Balance is calculated from server-side ledger entries only.
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <div className="flex items-start gap-3">
              <Landmark className="mt-0.5 text-slate-600" size={21} />
              <div>
                <strong className="block text-sm font-bold text-slate-950">
                  Funding coming next
                </strong>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Wallet funding is reserved for the next finance ledger release.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </section>
    </div>
  );
}