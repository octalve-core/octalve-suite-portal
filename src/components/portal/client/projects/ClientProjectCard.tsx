import type React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  FolderKanban,
  Layers3,
} from "lucide-react";

import type { Project } from "@/lib/types";
import { getPackageTitle } from "../../packageCatalog";
import { ClientProjectStatusChip } from "./ClientProjectStatusChip";
import {
  approvedPhaseCount,
  formatProjectDate,
  getCurrentPhase,
  latestProjectActivityDate,
  packageBadgeStyle,
  projectProgress,
} from "./client-projects-utils";

function MiniMetric({
  icon,
  label,
  value,
  iconClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconClassName: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-2">
        <span
          className={[
            "grid h-8 w-8 shrink-0 place-items-center rounded-xl ring-1",
            iconClassName,
          ].join(" ")}
        >
          {icon}
        </span>

        <div className="min-w-0">
          <span className="block truncate text-[8.5px] font-bold uppercase tracking-[0.085em] text-slate-400">
            {label}
          </span>

          <strong className="mt-1 block truncate text-[13px] font-medium leading-5 text-slate-600">
            {value}
          </strong>
        </div>
      </div>
    </div>
  );
}

export function ClientProjectCard({
  project,
  onSelect,
}: {
  project: Project;
  onSelect: (projectId: string) => void;
}) {
  const progress = projectProgress(project);
  const currentPhase = getCurrentPhase(project);
  const approvedPhases = approvedPhaseCount(project);
  const lastUpdated = latestProjectActivityDate(project);

  return (
    <article className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.02)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_8px_20px_rgba(0,100,224,0.08)]">
      <div className="flex min-h-[350px] flex-col justify-between p-5">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black"
              style={packageBadgeStyle(project.packageType)}
            >
              <FolderKanban size={13} />
              {getPackageTitle(project.packageType)}
            </span>

            <ClientProjectStatusChip status={project.status} />
          </div>

          <div className="mt-5">
            <h3 className="line-clamp-2 text-xl font-semibold leading-tight tracking-[-0.045em] text-slate-950">
              {project.title}
            </h3>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              {project.projectCode}
            </p>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#0064E0]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-2 text-xs font-semibold text-slate-500">
              {approvedPhases}/{project.phases.length} phases approved
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniMetric
              icon={<CircleDot size={16} />}
              label="Current Phase"
              value={currentPhase?.title ?? "No phase available"}
              iconClassName="bg-blue-50 text-[#0064E0] ring-blue-100"
            />

            <MiniMetric
              icon={<CalendarDays size={16} />}
              label="Target Date"
              value={formatProjectDate(project.targetDate)}
              iconClassName="bg-orange-50 text-orange-700 ring-orange-100"
            />

            <MiniMetric
              icon={<Layers3 size={16} />}
              label="Deliverables"
              value={project.phases.reduce(
                (total, phase) => total + phase.deliverables.length,
                0,
              )}
              iconClassName="bg-violet-50 text-violet-700 ring-violet-100"
            />

            <MiniMetric
              icon={<Clock3 size={16} />}
              label="Last Updated"
              value={formatProjectDate(lastUpdated)}
              iconClassName="bg-cyan-50 text-cyan-700 ring-cyan-100"
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_52px] gap-3">
          <Link
            href={`/client/projects/${project.id}`}
            onClick={() => onSelect(project.id)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:bg-[#0052B8]"
          >
            Open Project
            <CheckCircle2 size={16} />
          </Link>

          <Link
            href={`/client/projects/${project.id}`}
            onClick={() => onSelect(project.id)}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#0064E0] transition hover:border-blue-200 hover:bg-blue-50"
            aria-label={`Open ${project.title}`}
          >
            <ArrowRight size={20} className="transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}