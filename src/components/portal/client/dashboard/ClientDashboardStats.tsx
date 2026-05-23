import type React from "react";
import { CheckCircle2, Clock3, CreditCard, FileCheck2, FolderKanban, Link2 } from "lucide-react";
import {
  type DashboardTone,
  getToneClasses,
} from "./client-dashboard-utils";

function StatCard({
  label,
  value,
  helper,
  icon,
  tone,
  progressValue,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: React.ReactNode;
  tone: DashboardTone;
  progressValue?: number;
}) {
  return (
    <article className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
      <div className="flex items-start gap-4">
        {typeof progressValue === "number" ? (
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#0064E0 ${Math.max(0, Math.min(progressValue, 100)) * 3.6}deg, #e9eef7 0deg)`,
            }}
          >
            <span className="h-10 w-10 rounded-full bg-white" />
          </span>
        ) : (
          <span
            className={[
              "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1",
              getToneClasses(tone),
            ].join(" ")}
          >
            {icon}
          </span>
        )}

        <div className="min-w-0">
          <span className="text-sm font-semibold text-[#334a7d]">{label}</span>
          <strong className="mt-2 block text-3xl font-semibold tracking-[-0.055em] text-slate-950">
            {value}
          </strong>
          <p className="mt-2 text-sm font-medium leading-6 text-[#334a7d]">
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
}: {
  progress: number;
  approvedPhases: number;
  totalPhases: number;
  pendingApprovals: number;
  linksCount: number;
  outstandingPayments: number;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Project Progress"
        value={`${progress}%`}
        tone={progress >= 80 ? "green" : progress >= 40 ? "blue" : "orange"}
        icon={<FolderKanban size={20} />}
        helper="Overall delivery movement"
        progressValue={progress}
      />
      <StatCard
        label="Approved Phases"
        value={`${approvedPhases}/${totalPhases}`}
        tone="green"
        icon={<CheckCircle2 size={20} />}
        helper="Completed approvals"
      />
      <StatCard
        label="Pending Approvals"
        value={pendingApprovals}
        tone={pendingApprovals > 0 ? "orange" : "slate"}
        icon={<Clock3 size={20} />}
        helper="Needs your review"
      />
      <StatCard
        label="Deliverable Links"
        value={linksCount}
        tone="purple"
        icon={<Link2 size={20} />}
        helper="Visible resources"
      />
      <StatCard
        label="Outstanding Payments"
        value={outstandingPayments}
        tone={outstandingPayments > 0 ? "red" : "slate"}
        icon={<CreditCard size={20} />}
        helper={outstandingPayments > 0 ? "Payment required" : "No payment due"}
      />
    </section>
  );
}
