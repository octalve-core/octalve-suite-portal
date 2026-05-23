import type React from "react";
import { CheckCircle2, Clock3, FileCheck2, FolderKanban } from "lucide-react";
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
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: React.ReactNode;
  tone: DashboardTone;
}) {
  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_38px_rgba(15,23,42,0.055)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-slate-500">{label}</span>
          <strong className="mt-3 block text-3xl font-semibold tracking-[-0.055em] text-slate-950">
            {value}
          </strong>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            {helper}
          </p>
        </div>

        <span
          className={[
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1",
            getToneClasses(tone),
          ].join(" ")}
        >
          {icon}
        </span>
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
}: {
  progress: number;
  approvedPhases: number;
  totalPhases: number;
  pendingApprovals: number;
  linksCount: number;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <StatCard
        label="Project Progress"
        value={`${progress}%`}
        tone={progress >= 80 ? "green" : progress >= 40 ? "blue" : "orange"}
        icon={<FolderKanban size={20} />}
        helper="Overall delivery movement"
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
        icon={<FileCheck2 size={20} />}
        helper="Visible resources"
      />
    </section>
  );
}
