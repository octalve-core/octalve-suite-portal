import type React from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  ReceiptText,
} from "lucide-react";

import type { Project, ProjectPayment } from "@/lib/types";
import {
  formatPaymentDateTime,
  formatPaymentMoney,
} from "./client-payment-detail-utils";

function OverviewItem({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: "blue" | "green" | "red" | "purple" | "orange" | "slate";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-[#0064E0] ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    purple: "bg-violet-50 text-violet-700 ring-violet-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    slate: "bg-slate-50 text-slate-500 ring-slate-200",
  }[tone];

  return (
    <div className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <span
        className={[
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1",
          toneClass,
        ].join(" ")}
      >
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-500">
          {label}
        </span>
      </div>

      <strong className="shrink-0 text-right text-sm font-semibold text-slate-950">
        {value}
      </strong>
    </div>
  );
}

function getPaymentDate(payment: ProjectPayment) {
  const paymentRecord = payment as ProjectPayment & {
    updatedAt?: string;
    createdAt?: string;
  };

  return paymentRecord.updatedAt || payment.confirmedAt || paymentRecord.createdAt;
}

function getDueDate(project: Project, payment: ProjectPayment) {
  const projectRecord = project as Project & {
    targetDate?: string;
    dueDate?: string;
  };

  const paymentRecord = payment as ProjectPayment & {
    dueDate?: string;
  };

  return paymentRecord.dueDate || projectRecord.dueDate || projectRecord.targetDate;
}

export function ClientPaymentSummaryPanel({
  payment,
  project,
}: {
  payment: ProjectPayment;
  project: Project;
}) {
  const paidAmount = project.payments
    .filter((item) => item.status === "CONFIRMED")
    .reduce((sum, item) => sum + item.amount, 0);

  const amountDue = payment.status === "CONFIRMED" ? 0 : payment.amount;
  const dueDate = getDueDate(project, payment);
  const updatedAt = getPaymentDate(payment);

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] sm:p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
          Payment Overview
        </h2>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
          Summary of this payment.
        </p>
      </div>

      <div className="mt-5 grid gap-x-8 lg:grid-cols-2">
        <OverviewItem
          label="Total Amount"
          value={formatPaymentMoney(project.totalAmount)}
          icon={<CreditCard size={18} />}
        />

        <OverviewItem
          label="Amount Paid"
          value={formatPaymentMoney(paidAmount)}
          icon={<CheckCircle2 size={18} />}
          tone="green"
        />

        <OverviewItem
          label="Amount Due"
          value={
            <span className={amountDue > 0 ? "text-[#E61525]" : "text-emerald-700"}>
              {formatPaymentMoney(amountDue)}
            </span>
          }
          icon={<ReceiptText size={18} />}
          tone="red"
        />

        <OverviewItem
          label="Due Date"
          value={dueDate ? formatPaymentDateTime(dueDate) : "Not set"}
          icon={<CalendarDays size={18} />}
          tone="purple"
        />

        <OverviewItem
          label="Last Reminder"
          value="Not sent yet"
          icon={<Bell size={18} />}
          tone="orange"
        />

        <OverviewItem
          label="Last Updated"
          value={updatedAt ? formatPaymentDateTime(updatedAt) : "Not set"}
          icon={<Clock3 size={18} />}
          tone="slate"
        />
      </div>
    </section>
  );
}
