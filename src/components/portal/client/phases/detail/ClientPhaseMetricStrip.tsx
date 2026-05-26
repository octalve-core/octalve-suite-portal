import type React from "react";
import {
  BriefcaseBusiness,
  FileText,
  MessageSquareText,
  UsersRound,
} from "lucide-react";

import type { Project, ProjectPhase, User } from "@/lib/types";
import { visibleDeliverablesForClient } from "./client-phase-detail-utils";

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <article className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.02)]">
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
          <span className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </span>
          <strong className="mt-1 block truncate text-sm font-semibold text-slate-950">
            {value}
          </strong>
        </div>
      </div>
    </article>
  );
}

export function ClientPhaseMetricStrip({
  project,
  phase,
  assignee,
}: {
  project?: Project;
  phase: ProjectPhase;
  assignee?: User;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Project"
        value={project?.title ?? "Unknown project"}
        tone="bg-blue-50 text-[#0064E0] ring-blue-100"
        icon={<BriefcaseBusiness size={20} />}
      />

      <MetricCard
        label="Assigned Staff"
        value={assignee?.name ?? "Not assigned"}
        tone="bg-emerald-50 text-emerald-700 ring-emerald-100"
        icon={<UsersRound size={20} />}
      />

      <MetricCard
        label="Deliverables"
        value={visibleDeliverablesForClient(phase).length}
        tone="bg-orange-50 text-orange-700 ring-orange-100"
        icon={<FileText size={20} />}
      />

      <MetricCard
        label="Messages"
        value={phase.messages.length}
        tone="bg-purple-50 text-purple-700 ring-purple-100"
        icon={<MessageSquareText size={20} />}
      />
    </section>
  );
}
