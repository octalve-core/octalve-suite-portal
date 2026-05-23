import {
  ArrowDownLeft,
  ArrowUpRight,
  WalletCards,
} from "lucide-react";

import type { WalletLedgerEntry } from "@/lib/types";
import {
  entryTone,
  formatWalletDate,
  formatWalletMoney,
  normalizeEntryLabel,
} from "./client-wallet-utils";

function entryIcon(entry: WalletLedgerEntry) {
  if (entry.direction === "IN") return <ArrowDownLeft size={18} />;
  return <ArrowUpRight size={18} />;
}

export function ClientWalletLedgerRow({ entry }: { entry: WalletLedgerEntry }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-600 ring-1 ring-slate-200">
            {entryIcon(entry)}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm text-slate-950">
                {entry.description || normalizeEntryLabel(String(entry.entryType))}
              </strong>

              <span
                className={[
                  "inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize",
                  entryTone(entry),
                ].join(" ")}
              >
                {normalizeEntryLabel(String(entry.entryType))}
              </span>
            </div>

            <p className="mt-1 break-all text-sm leading-6 text-slate-500">
              {entry.reference} · {formatWalletDate(entry.createdAt)}
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
          {formatWalletMoney(entry.amount)}
        </strong>
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
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            Ledger History
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Confirmed wallet and project payment activity appears here as ledger records.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-3 p-5">
        {entries.length ? (
          entries.map((entry) => (
            <ClientWalletLedgerRow key={entry.id} entry={entry} />
          ))
        ) : (
          <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <div>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
                <WalletCards size={26} />
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950">
                No wallet activity yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Ledger records will appear after confirmed funding activity, project payments, refunds, or deductions.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
