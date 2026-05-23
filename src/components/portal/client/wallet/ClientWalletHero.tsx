import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Eye,
  LockKeyhole,
  Plus,
} from "lucide-react";

import type { WalletSummary } from "@/lib/types";
import { formatWalletMoney } from "./client-wallet-utils";

function HeroMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-t border-white/20 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15">
        {icon}
      </span>

      <div>
        <span className="block text-xs font-bold text-white/70">
          {label}
        </span>
        <strong className="mt-1 block text-sm font-semibold text-white">
          {formatWalletMoney(value)}
        </strong>
      </div>
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
  return (
    <section className="overflow-hidden rounded-[24px] bg-[#0064E0] text-white shadow-[0_20px_50px_rgba(0,100,224,0.22)]">
      <div className="relative p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_34%),linear-gradient(135deg,#003C9A_0%,#0064E0_45%,#0045B8_100%)]" />
        <div className="absolute right-[-80px] top-[-100px] h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[35%] h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/85">
                <span>Available Balance</span>
                <Eye size={16} />
              </div>

              <strong className="mt-4 block text-[40px] font-semibold leading-none tracking-[-0.07em] sm:text-[52px]">
                {formatWalletMoney(wallet?.availableBalance ?? 0)}
              </strong>

              <p className="mt-4 text-sm font-medium text-white/85">
                Ready to use on projects and payments.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onFundWallet}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-[#0064E0] shadow-[0_14px_30px_rgba(0,0,0,0.16)] transition hover:bg-blue-50"
                aria-label={`Fund ${userName}'s wallet`}
              >
                <Plus size={18} />
                Fund Wallet
              </button>

              <button
                type="button"
                disabled
                title="Statement export is disabled until an authenticated server export route exists."
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 text-sm font-bold text-white/80 transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Download size={17} />
                Download Statement
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-5 border-t border-white/20 pt-6 lg:grid-cols-3">
            <HeroMetric
              label="Held / Reserved"
              value={wallet?.heldBalance ?? 0}
              icon={<LockKeyhole size={19} />}
            />
            <HeroMetric
              label="Total Credited"
              value={wallet?.totalCredited ?? 0}
              icon={<ArrowDownLeft size={20} />}
            />
            <HeroMetric
              label="Project Spend"
              value={wallet?.totalSpent ?? 0}
              icon={<ArrowUpRight size={20} />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

