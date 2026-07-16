import {
  CheckCircle2,
  Clock3,
  CreditCard,
  FolderKanban,
  Link2,
} from "lucide-react";

import type { PaymentBlock } from "./client-dashboard-utils";
import { ClientPaymentNotice } from "./ClientPaymentNotice";

function toneClass(tone: "blue" | "green" | "orange" | "purple" | "red") {
  return {
    blue: "bg-blue-50 text-[#0064E0] ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    purple: "bg-violet-50 text-violet-700 ring-violet-100",
    red: "bg-red-50 text-red-700 ring-red-100",
  }[tone];
}

function StatCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: React.ReactNode;
  tone: "blue" | "green" | "orange" | "purple" | "red";
}) {
  return (
    <article className="rounded-[18px] border border-slate-200 bg-white p-3.5 shadow-[0_4px_12px_rgba(15,23,42,0.018)]">
      <div className="flex items-start gap-3">
        <span
          className={[
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1",
            toneClass(tone),
          ].join(" ")}
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <span className="block break-words text-[11px] font-black leading-4 tracking-[-0.01em] text-slate-500">
            {label}
          </span>

          <strong className="mt-4 block text-[24px] font-semibold leading-none tracking-[-0.055em] text-slate-950">
            {value}
          </strong>

          <p className="mt-2 break-words text-[12px] font-semibold leading-4 text-slate-500">
            {helper}
          </p>
        </div>
      </div>
    </article>
  );
}

export function ClientDashboardStats({
  progress,
  approvedPhases,
  totalPhases,
  pendingApprovals,
  linksCount,
  outstandingPayments,
  paymentBlock,
  onPay,
}: {
  progress: number;
  approvedPhases: number;
  totalPhases: number;
  pendingApprovals: number;
  linksCount: number;
  outstandingPayments: number;
  paymentBlock?: PaymentBlock | null;
  onPay?: (paymentId: string) => void;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
      <h2 className="mb-4 text-[20px] font-semibold tracking-[-0.045em] text-slate-950">
        Project Overview
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <StatCard
          label="Progress"
          value={`${progress}%`}
          helper="Overall delivery movement"
          icon={<FolderKanban size={16} />}
          tone="blue"
        />

        <StatCard
          label="Approved Phases"
          value={`${approvedPhases} / ${totalPhases}`}
          helper="Completed approvals"
          icon={<CheckCircle2 size={16} />}
          tone="green"
        />

        <StatCard
          label="Pending Reviews"
          value={pendingApprovals}
          helper="Needs your review"
          icon={<Clock3 size={16} />}
          tone="orange"
        />

        <StatCard
          label="Deliverable Links"
          value={linksCount}
          helper="Visible resources"
          icon={<Link2 size={16} />}
          tone="purple"
        />

        <StatCard
          label="Unpaid Payments"
          value={outstandingPayments}
          helper={outstandingPayments > 0 ? "Payment required" : "No payment due"}
          icon={<CreditCard size={16} />}
          tone={outstandingPayments > 0 ? "red" : "green"}
        />
      </div>

      {paymentBlock && onPay ? (
        <div className="mt-4">
          <ClientPaymentNotice block={paymentBlock} onPay={onPay} />
        </div>
      ) : null}
    </section>
  );
}