import type React from "react";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  WalletCards,
  XCircle,
} from "lucide-react";

import type { PaymentRow } from "./client-payments-utils";
import { formatPaymentMoney } from "./client-payments-utils";

function PaymentStatCard({
  label,
  value,
  amount,
  icon,
  tone,
}: {
  label: string;
  value: number;
  amount?: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
      <div className="flex items-center gap-4">
        <span
          className={[
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1",
            tone,
          ].join(" ")}
        >
          {icon}
        </span>

        <div className="min-w-0">
          <strong className="block text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {value}
          </strong>
          <span className="block text-sm font-medium text-slate-500">
            {label}
          </span>
          {typeof amount === "number" ? (
            <span className="mt-1 block truncate text-xs font-bold text-slate-400">
              {formatPaymentMoney(amount)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ClientPaymentStats({ rows }: { rows: PaymentRow[] }) {
  const unpaid = rows.filter((row) => row.payment.status === "UNPAID");
  const pending = rows.filter((row) => row.payment.status === "PENDING_CONFIRMATION");
  const confirmed = rows.filter((row) => row.payment.status === "CONFIRMED");
  const rejected = rows.filter((row) => row.payment.status === "REJECTED");

  const unpaidAmount = unpaid.reduce((total, row) => total + row.payment.amount, 0);
  const pendingAmount = pending.reduce((total, row) => total + row.payment.amount, 0);
  const confirmedAmount = confirmed.reduce((total, row) => total + row.payment.amount, 0);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <PaymentStatCard
        label="Unpaid"
        value={unpaid.length}
        amount={unpaidAmount}
        tone="bg-blue-50 text-[#0064E0] ring-blue-100"
        icon={<CreditCard size={19} />}
      />
      <PaymentStatCard
        label="Awaiting Confirmation"
        value={pending.length}
        amount={pendingAmount}
        tone="bg-orange-50 text-orange-600 ring-orange-100"
        icon={<Clock3 size={19} />}
      />
      <PaymentStatCard
        label="Confirmed"
        value={confirmed.length}
        amount={confirmedAmount}
        tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
        icon={<CheckCircle2 size={19} />}
      />
      <PaymentStatCard
        label="Rejected"
        value={rejected.length}
        tone="bg-red-50 text-red-600 ring-red-100"
        icon={<XCircle size={19} />}
      />
    </section>
  );
}
