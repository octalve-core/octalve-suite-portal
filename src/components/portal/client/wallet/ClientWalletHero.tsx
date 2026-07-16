"use client";

import { useState } from "react";
import {
  ArrowRight,
  Download,
  Eye,
  EyeOff,
  History,
  Plus,
  ShieldCheck,
} from "lucide-react";

import type { WalletSummary } from "@/lib/types";
import { formatWalletMoney } from "./client-wallet-utils";

function safeMoney(value: number, visible: boolean) {
  return visible ? formatWalletMoney(value) : "••••••";
}

function CompactStat({
  label,
  value,
  visible,
}: {
  label: string;
  value: number;
  visible: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/12">
      <span className="block truncate text-[11px] font-bold text-white/65">
        {label}
      </span>
      <strong className="mt-1 block truncate text-sm font-semibold text-white">
        {safeMoney(value, visible)}
      </strong>
    </div>
  );
}

export function ClientWalletHero({
  wallet,
  userName,
  onFundWallet,
}: {
  wallet: WalletSummary | null;
  userName: string;
  onFundWallet: () => void;
}) {
  const [showBalance, setShowBalance] = useState(false);

  return (
    <section className="overflow-hidden rounded-[24px] bg-[#0064E0] text-white shadow-[0_16px_36px_rgba(0,100,224,0.20)]">
      <div className="relative p-4 sm:p-6">
        <div className="absolute inset-0 bg-[#0064E0]" />
        <div className="absolute right-[-70px] top-[-90px] h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-80px] left-[-60px] h-52 w-52 rounded-full bg-white/8 blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/75">
                <ShieldCheck size={15} />
                <span>Available Balance</span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <strong className="block truncate text-[32px] font-semibold leading-none tracking-[-0.075em] sm:text-[46px]">
                  {safeMoney(wallet?.availableBalance ?? 0, showBalance)}
                </strong>

                <button
                  type="button"
                  onClick={() => setShowBalance((value) => !value)}
                  aria-pressed={showBalance}
                  aria-label={showBalance ? "Hide wallet balance" : "Show wallet balance"}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/18 bg-white/10 text-white transition hover:bg-white/15"
                >
                  {showBalance ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/78">
                Your secure Octalve wallet for project payments and approved funding.
              </p>
            </div>

            <a
              href="#wallet-transactions"
              className="hidden min-h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-xs font-black text-[#0064E0] transition hover:bg-blue-50 sm:inline-flex"
            >
              History
              <ArrowRight size={14} />
            </a>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onFundWallet}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#0064E0] shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition hover:bg-blue-50"
              aria-label={`Add money to ${userName}'s wallet`}
            >
              <Plus size={17} />
              Add Money
            </button>

            <a
              href="/api/wallet/statement"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/22 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15"
            >
              <Download size={16} />
              Statement
            </a>

            <a
              href="#wallet-transactions"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/22 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15 sm:hidden"
            >
              <History size={16} />
              History
            </a>

            <div className="hidden sm:block" />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <CompactStat
              label="Total Added"
              value={wallet?.totalCredited ?? 0}
              visible={showBalance}
            />
            <CompactStat
              label="Project Spend"
              value={wallet?.totalSpent ?? 0}
              visible={showBalance}
            />
            <CompactStat
              label="Reserved"
              value={wallet?.heldBalance ?? 0}
              visible={showBalance}
            />
          </div>
        </div>
      </div>
    </section>
  );
}