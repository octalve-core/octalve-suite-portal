import type React from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  XCircle,
} from "lucide-react";

import type { PaymentRow } from "./client-payments-utils";
import {
  formatPaymentMoney,
  STATUS_ACCENT_CLASSES,
} from "./client-payments-utils";

function PaymentStatCard({
  label,
  value,
  amount,
  icon,
  tone,
  accent,
}: {
  label: string;
  value: number;
  amount: number;
  icon: React.ReactNode;
  tone: string;
  accent: string;
}) {
  return (
    <article
      className={[
        "rounded-[18px] border border-slate-200 border-b-2 bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.02)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.07)]",
        accent,
      ].join(" ")}
    >
      <div className="flex items-center gap-4">
        <span
          className={[
            "grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-1",
            tone,
          ].join(" ")}
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <strong className="block text-[22px] font-medium tracking-[-0.04em] text-slate-700">
            {value}
          </strong>
          <span className="block text-sm font-medium text-slate-500">
            {label}
          </span>
          <span className="mt-1 block truncate text-xs font-medium text-slate-400">
            {formatPaymentMoney(amount)}
          </span>
        </div>

        <ChevronRight size={18} className="shrink-0 text-slate-400" />
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
  const rejectedAmount = rejected.reduce((total, row) => total + row.payment.amount, 0);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <PaymentStatCard
        label="Unpaid"
        value={unpaid.length}
        amount={unpaidAmount}
        tone="bg-blue-50 text-[#0064E0] ring-blue-100"
        accent={STATUS_ACCENT_CLASSES.UNPAID}
        icon={<CreditCard size={22} />}
      />
      <PaymentStatCard
        label="Awaiting Confirmation"
        value={pending.length}
        amount={pendingAmount}
        tone="bg-orange-50 text-orange-600 ring-orange-100"
        accent={STATUS_ACCENT_CLASSES.PENDING_CONFIRMATION}
        icon={<Clock3 size={22} />}
      />
      <PaymentStatCard
        label="Confirmed"
        value={confirmed.length}
        amount={confirmedAmount}
        tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
        accent={STATUS_ACCENT_CLASSES.CONFIRMED}
        icon={<CheckCircle2 size={22} />}
      />
      <PaymentStatCard
        label="Rejected"
        value={rejected.length}
        amount={rejectedAmount}
        tone="bg-red-50 text-red-600 ring-red-100"
        accent={STATUS_ACCENT_CLASSES.REJECTED}
        icon={<XCircle size={22} />}
      />
    </section>
  );
}
