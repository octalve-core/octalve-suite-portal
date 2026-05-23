import {
  BriefcaseBusiness,
  CalendarDays,
  Layers3,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import type { Project, User } from "@/lib/types";
import { getPackageTitle } from "../../../packageCatalog";
import { ClientProjectStatusChip } from "../ClientProjectStatusChip";
import {
  approvedPhaseCount,
  packageBadgeStyle,
  projectProgress,
} from "../client-projects-utils";
import { daysUntil, formatDetailDate } from "./client-project-detail-utils";

function SummaryMetric({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 border-t border-slate-100 px-4 py-4 sm:border-l sm:border-t-0">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
            {icon}
          </span>
        ) : null}

        <div className="min-w-0">
          <span className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </span>
          <strong className="mt-1 block truncate text-sm font-semibold text-slate-950">
            {value}
          </strong>
          {helper ? (
            <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
              {helper}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ClientProjectDetailSummary({
  project,
  manager,
}: {
  project: Project;
  manager?: User;
}) {
  const progress = projectProgress(project);
  const approved = approvedPhaseCount(project);

  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(280px,1.25fr)_repeat(5,minmax(120px,1fr))]">
        <div className="flex min-w-0 items-center gap-4 p-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#000A16] text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]">
            <BriefcaseBusiness size={23} />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex rounded-full border px-3 py-1 text-xs font-extrabold"
                style={packageBadgeStyle(project.packageType)}
              >
                {getPackageTitle(project.packageType)}
              </span>
              <ClientProjectStatusChip status={project.status} />
            </div>

            <h2 className="mt-3 truncate text-xl font-semibold tracking-[-0.04em] text-slate-950">
              {project.title}
            </h2>
            <p className="mt-1 truncate text-sm font-medium text-slate-500">
              {project.businessName} - {project.clientEmail}
            </p>
          </div>
        </div>

        <SummaryMetric
          label="Progress"
          value={`${progress}%`}
          helper={`${approved} of ${project.phases.length} phases`}
          icon={<ShieldCheck size={17} />}
        />

        <SummaryMetric
          label="Phases"
          value={`${approved} of ${project.phases.length}`}
          helper="Complete"
          icon={<Layers3 size={17} />}
        />

        <SummaryMetric
          label="Target Date"
          value={formatDetailDate(project.targetDate)}
          helper={daysUntil(project.targetDate)}
          icon={<CalendarDays size={17} />}
        />

        <SummaryMetric
          label="Project Code"
          value={project.projectCode}
          helper="Workspace ID"
          icon={<BriefcaseBusiness size={17} />}
        />

        <SummaryMetric
          label="Manager"
          value={manager?.name ?? "Not assigned"}
          helper={manager?.email}
          icon={<UserRound size={17} />}
        />
      </div>
    </section>
  );
}
