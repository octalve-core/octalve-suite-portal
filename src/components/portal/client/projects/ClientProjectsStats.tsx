import type React from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  LoaderCircle,
} from "lucide-react";
import type { Project } from "@/lib/types";
import {
  awaitingDepositCount,
  inProgressProjectCount,
} from "./client-projects-utils";

function ProjectStatCard({
  label,
  value,
  helper,
  icon,
  tone,
  accent,
}: {
  label: string;
  value: number;
  helper: string;
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

        <div className="min-w-0">
          <strong className="block text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {value}
          </strong>
          <span className="block text-sm font-semibold text-slate-600">
            {label}
          </span>
          <span className="mt-1 block text-xs font-bold text-slate-500">
            {helper}
          </span>
        </div>
      </div>
    </article>
  );
}

export function ClientProjectsStats({ projects }: { projects: Project[] }) {
  const active = projects.filter((project) => project.status === "ACTIVE").length;
  const awaitingDeposit = awaitingDepositCount(projects);
  const inProgress = inProgressProjectCount(projects);
  const completed = projects.filter((project) => project.status === "COMPLETED").length;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ProjectStatCard
        label="Active Projects"
        value={active}
        helper="View all active projects"
        tone="bg-blue-50 text-[#0064E0] ring-blue-100"
        accent="border-b-[#0064E0]"
        icon={<BriefcaseBusiness size={22} />}
      />
      <ProjectStatCard
        label="Awaiting Deposit"
        value={awaitingDeposit}
        helper="Pending client deposit"
        tone="bg-purple-50 text-purple-700 ring-purple-100"
        accent="border-b-purple-300"
        icon={<Clock3 size={22} />}
      />
      <ProjectStatCard
        label="In Progress"
        value={inProgress}
        helper="Currently in progress"
        tone="bg-orange-50 text-orange-600 ring-orange-100"
        accent="border-b-[#FC7E24]"
        icon={<LoaderCircle size={22} />}
      />
      <ProjectStatCard
        label="Completed"
        value={completed}
        helper="Successfully completed"
        tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
        accent="border-b-[#29BE3E]"
        icon={<CheckCircle2 size={22} />}
      />
    </section>
  );
}
