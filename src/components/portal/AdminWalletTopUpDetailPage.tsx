"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  RefreshCcw,
  ShieldCheck,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import { api } from "@/lib/api";
import type { AdminWalletTopUpAudit } from "@/lib/types";
import { Badge, Button, Card, Spinner, formatNaira } from "./UI";

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
  if (status === "CONFIRMED" || status === "PROCESSED") return "badge-green";
  if (status === "FAILED" || status === "CANCELLED") return "badge-red";
  if (status === "PENDING" || status === "INITIALIZED" || status === "RECEIVED") return "badge-orange";
  return "badge-slate";
}

function CopyInlineValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-left text-sm font-bold text-slate-900 transition hover:border-blue-200 hover:text-[#0064E0]"
      title="Copy"
    >
      <span className="truncate">{value}</span>
      <Copy size={14} className={copied ? "shrink-0 text-emerald-600" : "shrink-0 text-slate-400"} />
      <small className={copied ? "shrink-0 text-emerald-600" : "shrink-0 text-slate-400"}>
        {copied ? "Copied" : "Copy"}
      </small>
    </button>
  );
}

function DetailMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
            {icon}
          </span>
        ) : null}

        <div className="min-w-0">
          <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
            {label}
          </span>
          <strong className="mt-1 block break-words text-sm font-semibold leading-6 text-slate-900">
            {value || "Not set"}
          </strong>
        </div>
      </div>
    </div>
  );
}

function AuditRecordCard({
  title,
  status,
  children,
}: {
  title: string;
  status?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-sm font-bold text-slate-950">{title}</strong>
        {status ? <Badge className={statusTone(status)}>{providerLabel(status)}</Badge> : null}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function EmptyAuditState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
      {label}
    </div>
  );
}

export function AdminWalletTopUpDetailPage({ topUpId }: { topUpId: string }) {
  const [audit, setAudit] = useState<AdminWalletTopUpAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadAudit(mode: "initial" | "refresh" = "initial") {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const data = await api.adminWallet.topUpAudit(topUpId);
      setAudit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load wallet top-up audit.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAudit("initial");
  }, [topUpId]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-330 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="grid min-h-90 place-items-center border-slate-200 bg-white p-8">
          <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-500">
            <Spinner size={20} />
            Loading top-up audit...
          </div>
        </Card>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="mx-auto w-full max-w-330 px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/admin/wallet" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0064E0]">
          <ArrowLeft size={17} />
          Back to Wallet
        </Link>

        <Card className="mt-6 border-red-200 bg-red-50 p-8 text-center">
          <XCircle className="mx-auto text-red-500" size={28} />
          <h1 className="mt-3 text-xl font-semibold text-red-800">Top-up audit unavailable</h1>
          <p className="mt-2 text-sm font-semibold text-red-700">{error || "The requested wallet top-up could not be loaded."}</p>
        </Card>
      </div>
    );
  }

  const { topUp, user, ledgerEntries, webhookEvents, timeline, summary } = audit;

  return (
    <div className="mx-auto w-full max-w-330 px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/admin/wallet" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0064E0]">
        <ArrowLeft size={17} />
        Back to Wallet
      </Link>

      <section className="mt-5 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusTone(topUp.status)}>{providerLabel(topUp.status)}</Badge>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                  {providerLabel(topUp.provider)}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-5xl">
                Wallet Top-up Audit
              </h1>

              <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-white/70 sm:text-[15px]">
                {user.name} • {user.email} • {topUp.reference}
              </p>
            </div>

            <div className="grid h-20 min-w-20 place-items-center rounded-3xl bg-white/10 px-5 text-right ring-1 ring-white/15">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                Amount
              </span>
              <strong className="text-xl font-semibold tracking-[-0.04em]">
                {formatNaira(topUp.amount)}
              </strong>
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <main className="space-y-5">
          <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                  Top-up Details
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Provider, reference, failure and confirmation data for support review.
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={() => loadAudit("refresh")}
                loading={refreshing}
                disabled={refreshing}
              >
                <RefreshCcw size={16} />
                Refresh
              </Button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailMetric label="Client" value={`${user.name} • ${user.email}`} icon={<UserRound size={17} />} />
              <DetailMetric label="Wallet Balance" value={formatNaira(audit.walletBalance)} icon={<WalletCards size={17} />} />
              <DetailMetric label="Reference" value={<CopyInlineValue value={topUp.reference} />} icon={<FileText size={17} />} />
              <DetailMetric label="Idempotency Key" value={<CopyInlineValue value={topUp.idempotencyKey} />} icon={<ShieldCheck size={17} />} />
              <DetailMetric label="Provider Reference" value={topUp.providerReference ? <CopyInlineValue value={topUp.providerReference} /> : "Not set"} icon={<CreditCard size={17} />} />
              <DetailMetric label="Provider Status" value={topUp.providerStatus ?? "Not set"} icon={<Clock3 size={17} />} />
              <DetailMetric label="Created" value={formatDateTime(topUp.createdAt)} icon={<Clock3 size={17} />} />
              <DetailMetric label="Confirmed" value={formatDateTime(topUp.confirmedAt)} icon={<CheckCircle2 size={17} />} />
            </div>

            {topUp.failureReason ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
                Failure reason: {topUp.failureReason}
              </div>
            ) : null}

            {topUp.authorizationUrl ? (
              <a
                href={topUp.authorizationUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-[#0064E0]"
              >
                Open Provider Checkout
                <ExternalLink size={16} />
              </a>
            ) : null}
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-6">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
              Wallet Ledger Entries
            </h2>

            <div className="mt-5 grid gap-3">
              {ledgerEntries.length ? (
                ledgerEntries.map((entry) => (
                  <AuditRecordCard
                    key={entry.id}
                    title={entry.reference}
                    status={`${entry.entryType} / ${entry.direction}`}
                  >
                    <DetailMetric label="Amount" value={formatNaira(entry.amount)} />
                    <DetailMetric label="Balance After" value={typeof entry.balanceAfter === "number" ? formatNaira(entry.balanceAfter) : "Not set"} />
                    <DetailMetric label="Description" value={entry.description ?? "Not set"} />
                    <DetailMetric label="Created" value={formatDateTime(entry.createdAt)} />
                    <DetailMetric label="Project" value={entry.project?.title ?? "Not linked"} />
                    <DetailMetric label="Payment" value={entry.payment?.reference ?? "Not linked"} />
                  </AuditRecordCard>
                ))
              ) : (
                <EmptyAuditState label="No wallet ledger entry is linked to this top-up." />
              )}
            </div>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-6">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
              Webhook Events
            </h2>

            <div className="mt-5 grid gap-3">
              {webhookEvents.length ? (
                webhookEvents.map((event) => (
                  <AuditRecordCard key={event.id} title={event.eventType} status={event.status}>
                    <DetailMetric label="Provider" value={providerLabel(event.provider)} />
                    <DetailMetric label="Reference" value={event.reference ?? "Not set"} />
                    <DetailMetric label="Signature Valid" value={event.signatureValid ? "Yes" : "No"} />
                    <DetailMetric label="Processed At" value={formatDateTime(event.processedAt)} />
                    <DetailMetric label="Event ID" value={event.eventId ? <CopyInlineValue value={event.eventId} /> : "Not set"} />
                    <DetailMetric label="Processing Error" value={event.processingError ?? "None"} />
                  </AuditRecordCard>
                ))
              ) : (
                <EmptyAuditState label="No webhook event is linked by this top-up reference." />
              )}
            </div>
          </Card>
        </main>

        <aside className="space-y-5">
          <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
              Audit Summary
            </h2>

            <div className="mt-5 grid gap-3">
              <DetailMetric label="Ledger Credit" value={formatNaira(summary.ledgerCreditTotal)} />
              <DetailMetric label="Ledger Debit" value={formatNaira(summary.ledgerDebitTotal)} />
              <DetailMetric label="Ledger Net" value={formatNaira(summary.ledgerNet)} />
              <DetailMetric label="Webhook Count" value={summary.webhookCount} />
            </div>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
              Timeline
            </h2>

            <div className="mt-5 grid gap-3">
              {timeline.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm font-bold text-slate-950">{item.label}</strong>
                    <Badge className={statusTone(item.status)}>{providerLabel(item.status)}</Badge>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {formatDateTime(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-blue-100 bg-blue-50 p-5 text-sm font-semibold leading-7 text-slate-700">
            This page is read-only. Manual confirmation or retry controls are intentionally not enabled until a stronger support control policy is designed.
          </Card>
        </aside>
      </div>
    </div>
  );
}