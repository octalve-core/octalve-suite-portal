"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import type { WalletLedgerEntry } from "@/lib/types";
import {
  entryAmountClass,
  entryTone,
  formatWalletDate,
  formatWalletTime,
  normalizeEntryLabel,
  signedWalletAmount,
  walletEntryActionHref,
  walletEntryKind,
} from "./client-wallet-utils";

function iconForEntry(entry: WalletLedgerEntry) {
  const kind = walletEntryKind(entry);

  if (kind === "credit") return <ArrowDownLeft size={18} />;
  if (kind === "debit") return <ArrowUpRight size={18} />;
  if (kind === "refund") return <RotateCcw size={18} />;

  return <CheckCircle2 size={18} />;
}

function WalletStatusChip() {
  return (
    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
      Completed
    </span>
  );
}

function WalletEntryCard({ entry }: { entry: WalletLedgerEntry }) {
  const href = walletEntryActionHref(entry);

  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        <span
          className={[
            "grid h-11 w-11 shrink-0 place-items-center rounded-full ring-1",
            entryTone(entry),
          ].join(" ")}
        >
          {iconForEntry(entry)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-950">
                {normalizeEntryLabel(String(entry.entryType))}
              </h3>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                {entry.reference}
              </p>
            </div>

            <strong className={["text-sm font-black", entryAmountClass(entry)].join(" ")}>
              {signedWalletAmount(entry)}
            </strong>
          </div>

          <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
            {entry.description || "Wallet ledger activity"}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              <span className="block text-xs font-semibold text-slate-500">
                {formatWalletDate(entry.createdAt)}
              </span>
              <span className="block text-xs font-semibold text-slate-400">
                {formatWalletTime(entry.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <WalletStatusChip />

              {href ? (
                <Link
                  href={href}
                  className="inline-flex min-h-9 items-center rounded-xl border border-blue-200 bg-white px-3 text-xs font-bold text-[#0064E0] transition hover:bg-blue-50"
                >
                  View details
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ClientWalletLedger({
  entries,
  refreshing,
  onRefresh,
}: {
  entries: WalletLedgerEntry[];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const [query, setQuery] = useState("");

  const filteredEntries = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return entries;

    return entries.filter((entry) =>
      [
        entry.reference,
        entry.description,
        entry.entryType,
        entry.direction,
        entry.currency,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [entries, query]);

  return (
    <section
      id="wallet-transactions"
      className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.055)]"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            Transaction History
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            A log of wallet funding, spending, refunds, and adjustments.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transactions..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100 sm:w-[260px]"
            />
          </label>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-[#0064E0]"
            title="Search filters apply automatically"
          >
            <SlidersHorizontal size={16} />
            Filter
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-[#0064E0] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {filteredEntries.length ? (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">Action</th>
                  <th className="w-10 px-2 py-4" />
                </tr>
              </thead>

              <tbody>
                {filteredEntries.map((entry) => {
                  const href = walletEntryActionHref(entry);

                  return (
                    <tr
                      key={entry.id}
                      className="border-b border-slate-200 bg-white text-sm transition last:border-b-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={[
                              "grid h-10 w-10 shrink-0 place-items-center rounded-full ring-1",
                              entryTone(entry),
                            ].join(" ")}
                          >
                            {iconForEntry(entry)}
                          </span>

                          <strong className="block max-w-[190px] truncate text-sm font-semibold text-slate-950">
                            {normalizeEntryLabel(String(entry.entryType))}
                          </strong>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <strong className="block max-w-[220px] truncate text-sm font-semibold text-slate-950">
                          {entry.reference}
                        </strong>
                        <span className="mt-1 block max-w-[240px] truncate text-xs font-semibold text-slate-500">
                          {entry.description || "Wallet activity"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <strong className="block text-sm font-semibold text-slate-950">
                          {formatWalletDate(entry.createdAt)}
                        </strong>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">
                          {formatWalletTime(entry.createdAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <strong
                          className={["block text-sm font-black", entryAmountClass(entry)].join(" ")}
                        >
                          {signedWalletAmount(entry)}
                        </strong>
                      </td>

                      <td className="px-5 py-4">
                        <WalletStatusChip />
                      </td>

                      <td className="px-5 py-4 text-center">
                        {href ? (
                          <Link
                            href={href}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-[#0064E0] transition hover:bg-blue-50"
                          >
                            View details
                          </Link>
                        ) : (
                          <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-400">
                            Ledger only
                          </span>
                        )}
                      </td>

                      <td className="px-2 py-4">
                        <button
                          type="button"
                          className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label="More transaction options"
                        >
                          <MoreVertical size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500">
              Showing 1 to {filteredEntries.length} of {entries.length} transactions
            </div>
          </div>

          <div className="grid gap-3 p-4 lg:hidden">
            {filteredEntries.map((entry) => (
              <WalletEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </>
      ) : (
        <div className="grid min-h-64 place-items-center p-8 text-center">
          <div>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-200">
              <Search size={23} />
            </div>

            <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950">
              No wallet transactions found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Wallet activity will appear after funding, project payment, refund, or adjustment.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
