import type React from "react";
import {
  ArrowDownLeft,
  Clock3,
  CreditCard,
  WalletCards,
} from "lucide-react";

import type { WalletSummary } from "@/lib/types";
import { formatWalletMoney } from "./client-wallet-utils";

function WalletMetricCard({
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
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-sm font-bold text-slate-500">{label}</span>
          <strong className="mt-3 block truncate text-3xl font-semibold tracking-[-0.055em] text-slate-950">
            {formatWalletMoney(value)}
          </strong>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            {helper}
          </p>
        </div>

        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          {icon}
        </span>
      </div>
    </article>
  );
}

export function ClientWalletMetrics({ wallet }: { wallet: WalletSummary | null }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <WalletMetricCard
        label="Available"
        value={wallet?.availableBalance ?? 0}
        helper="Net usable wallet value."
        icon={<WalletCards size={20} />}
      />

      <WalletMetricCard
        label="Held"
        value={wallet?.heldBalance ?? 0}
        helper="Reserved or pending wallet movement."
        icon={<Clock3 size={20} />}
      />

      <WalletMetricCard
        label="Total Credited"
        value={wallet?.totalCredited ?? 0}
        helper="Confirmed credits and external payment records."
        icon={<ArrowDownLeft size={20} />}
      />

      <WalletMetricCard
        label="Project Spend"
        value={wallet?.totalSpent ?? 0}
        helper="Confirmed project payment applications."
        icon={<CreditCard size={20} />}
      />
    </section>
  );
}
