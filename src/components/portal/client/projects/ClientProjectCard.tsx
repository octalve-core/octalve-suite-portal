import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleDot,
  FolderKanban,
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

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_22px_50px_rgba(0,100,224,0.10)]">
      <div className="flex min-h-[320px] flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold"
              style={packageBadgeStyle(project.packageType)}
            >
              <FolderKanban size={13} />
              {getPackageTitle(project.packageType)}
            </span>

            <ClientProjectStatusChip status={project.status} />
          </div>

          <h3 className="mt-6 truncate text-xl font-semibold tracking-[-0.04em] text-slate-950">
            {project.title}
          </h3>

          <p className="mt-1 truncate text-sm font-medium text-slate-500">
            {project.businessName}
          </p>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-500">Progress</span>
              <strong className="text-slate-950">
                {approvedPhases}/{project.phases.length} phases
              </strong>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <span
                className="block h-full rounded-full bg-[#0064E0] transition-all"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
                <CircleDot size={18} />
              </span>

              <div className="min-w-0">
                <span className="block text-xs font-semibold text-slate-500">
                  Current phase
                </span>
                <strong className="mt-1 block truncate text-sm text-slate-950">
                  {currentPhase?.title ?? "No phase available"}
                </strong>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                <CalendarDays size={17} />
              </span>

              <div className="min-w-0">
                <span className="block text-xs font-semibold text-slate-500">
                  Last updated
                </span>
                <strong className="mt-1 block truncate text-sm text-slate-950">
                  {formatProjectDate(latestProjectActivityDate(project))}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_72px] gap-3">
          <Link
            href={`/client/projects/${project.id}`}
            onClick={() => onSelect(project.id)}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0064E0] transition hover:border-blue-200 hover:bg-blue-50"
          >
            Open Project
          </Link>

          <Link
            href={`/client/projects/${project.id}`}
            onClick={() => onSelect(project.id)}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#0064E0] transition hover:border-blue-200 hover:bg-blue-50"
            aria-label={`Open ${project.title}`}
          >
            <ArrowRight size={22} />
          </Link>
        </div>
      </div>
    </article>
  );
}
