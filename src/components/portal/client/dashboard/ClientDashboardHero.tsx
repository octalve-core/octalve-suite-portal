import Link from "next/link";
import { Plus, WalletCards } from "lucide-react";
import type { Project } from "@/lib/types";
import { getPackageTitle } from "../../packageCatalog";
import { ProjectDateCountdown } from "../../ProjectDateCountdown";
import { ClientProjectSwitcher } from "../shared/ClientProjectSwitcher";
import {
  getBadgeClasses,
  getToneForStatus,
  statusLabel,
} from "./client-dashboard-utils";

export function ClientDashboardHero({
  project,
  userName,
}: {
  project: Project;
  userName: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-[#0064E0] p-5 text-white shadow-[0_24px_70px_rgba(0,100,224,0.24)] sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute bottom-[-90px] left-[-90px] h-60 w-60 rounded-full bg-[#000A16]/20 blur-2xl" />

      <div className="relative z-10 grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white/80">
              Client Workspace
            </span>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/85">
              {getPackageTitle(project.packageType)}
            </span>
          </div>

          <p className="mt-7 text-sm font-semibold text-white/75">
            Welcome back, {userName}.
          </p>

          <h1 className="mt-2 max-w-4xl text-[34px] font-semibold leading-[1.02] tracking-[-0.065em] sm:text-[44px] lg:text-[58px]">
            Track your project with clarity.
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/82 sm:text-base">
            {project.title}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <ClientProjectSwitcher />

            <Link
              href="/client/projects/new"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-[#0064E0] shadow-[0_16px_34px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5"
            >
              <Plus size={17} />
              Create Project
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/15 bg-white/12 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#0064E0]">
              <WalletCards size={21} />
            </span>
            <div>
              <span className="block text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                Current Project
              </span>
              <strong className="mt-1 block truncate text-base font-semibold">
                {project.projectCode}
              </strong>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className={[
                "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                getBadgeClasses(getToneForStatus(project.status)),
              ].join(" ")}
            >
              {statusLabel(project.status)}
            </span>
          </div>

          <div className="mt-5 rounded-2xl bg-white p-4 text-slate-950">
            <ProjectDateCountdown targetDate={project.targetDate} compact />
          </div>
        </div>
      </div>
    </section>
  );
}
