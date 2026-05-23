import Link from "next/link";
import { ArrowRight, CalendarDays, CreditCard, Layers3 } from "lucide-react";
import type { Project } from "@/lib/types";
import { getPackageTitle } from "../../packageCatalog";
import { ClientProjectStatusChip } from "./ClientProjectStatusChip";
import {
  approvedPhaseCount,
  formatProjectDate,
  packageBadgeStyle,
  pendingApprovalCount,
  projectProgress,
  unpaidPaymentCount,
} from "./client-projects-utils";

export function ClientProjectCard({
  project,
  onSelect,
}: {
  project: Project;
  onSelect: (projectId: string) => void;
}) {
  const progress = projectProgress(project);
  const unpaid = unpaidPaymentCount(project);
  const approvals = pendingApprovalCount(project);

  return (
    <Link
      href={`/client/projects/${project.id}`}
      onClick={() => onSelect(project.id)}
      className="group block rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_22px_50px_rgba(0,100,224,0.10)]"
    >
      <div className="flex min-h-[270px] flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className="inline-flex rounded-full border px-3 py-1 text-xs font-extrabold"
              style={packageBadgeStyle(project.packageType)}
            >
              {getPackageTitle(project.packageType)}
            </span>

            <ClientProjectStatusChip status={project.status} />
          </div>

          <h3 className="mt-6 text-xl font-semibold tracking-[-0.04em] text-slate-950">
            {project.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {project.businessName}
          </p>

          <div className="mt-5 grid gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <CalendarDays size={16} className="text-[#0064E0]" />
              {formatProjectDate(project.targetDate)}
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Layers3 size={16} className="text-[#0064E0]" />
              {approvedPhaseCount(project)}/{project.phases.length} phases approved
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <CreditCard size={16} className={unpaid ? "text-red-600" : "text-slate-400"} />
              {unpaid} unpaid payment{unpaid === 1 ? "" : "s"} Â· {approvals} pending approval{approvals === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">Progress</span>
            <strong className="text-slate-950">{progress}%</strong>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <span
              className="block h-full rounded-full bg-[#0064E0] transition-all"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#0064E0]">
            Open project
            <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
