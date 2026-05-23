import type React from "react";
import { CheckCircle2, Clock3, CreditCard, FolderKanban } from "lucide-react";
import type { Project } from "@/lib/types";
import {
  approvedPhaseCount,
  pendingApprovalCount,
  unpaidPaymentCount,
} from "./client-projects-utils";

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
  tone: string;
}) {
  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
      <div className="flex items-start gap-4">
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
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
            {helper}
          </p>
        </div>
      </div>
    </article>
  );
}

export function ClientProjectsStats({ projects }: { projects: Project[] }) {
  const active = projects.filter((project) => project.status === "ACTIVE").length;
  const completed = projects.filter((project) => project.status === "COMPLETED").length;
  const pendingApprovals = projects.reduce(
    (total, project) => total + pendingApprovalCount(project),
    0,
  );
  const unpaidPayments = projects.reduce(
    (total, project) => total + unpaidPaymentCount(project),
    0,
  );
  const approvedPhases = projects.reduce(
    (total, project) => total + approvedPhaseCount(project),
    0,
  );

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Active Projects"
        value={active}
        helper={`${completed} completed`}
        tone="bg-blue-50 text-[#0064E0] ring-blue-100"
        icon={<FolderKanban size={19} />}
      />
      <StatCard
        label="Approved Phases"
        value={approvedPhases}
        helper="Total phase approvals"
        tone="bg-emerald-50 text-emerald-700 ring-emerald-100"
        icon={<CheckCircle2 size={19} />}
      />
      <StatCard
        label="Pending Approvals"
        value={pendingApprovals}
        helper="Need client review"
        tone="bg-orange-50 text-orange-700 ring-orange-100"
        icon={<Clock3 size={19} />}
      />
      <StatCard
        label="Unpaid Payments"
        value={unpaidPayments}
        helper="Payment action required"
        tone="bg-red-50 text-red-700 ring-red-100"
        icon={<CreditCard size={19} />}
      />
    </section>
  );
}
