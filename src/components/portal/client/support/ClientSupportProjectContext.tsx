import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Layers3,
} from "lucide-react";

import type { Project, ProjectPhase } from "@/lib/types";
import {
  formatSupportDate,
  getProjectStatusLabel,
  getProjectStatusTone,
} from "./client-support-utils";

export function ClientSupportProjectContext({
  project,
  activePhase,
}: {
  project?: Project;
  activePhase?: ProjectPhase;
}) {
  if (!project) {
    return (
      <section className="rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          <CheckCircle2 size={24} />
        </div>

        <h2 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-slate-950">
          No active project yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
          Once your project is active, support actions, phase messages, project manager information and project-linked context will appear here.
        </p>

        <Link
          href="/client/projects/new"
          className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white transition hover:bg-[#0052B8]"
        >
          Create Project
          <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  const pendingApprovals = project.phases.filter(
    (phase) => phase.status === "AWAITING_APPROVAL",
  ).length;

  const unpaidPayments = project.payments.filter(
    (payment) => payment.status === "UNPAID",
  ).length;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span
              className={[
                "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                getProjectStatusTone(project.status),
              ].join(" ")}
            >
              {getProjectStatusLabel(project.status)}
            </span>

            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
              {project.title}
            </h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              {project.businessName} - {project.projectCode}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/client/projects/${project.id}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-[#0064E0]"
            >
              Project Details
              <ArrowRight size={16} />
            </Link>

            <Link
              href={activePhase ? `/client/phases/${activePhase.id}` : "/client/phases"}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-4 text-sm font-semibold text-white transition hover:bg-[#0052B8]"
            >
              Message Thread
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <CalendarDays size={18} className="text-[#0064E0]" />
          <span className="mt-3 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Target Date
          </span>
          <strong className="mt-1 block text-sm text-slate-950">
            {formatSupportDate(project.targetDate)}
          </strong>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <Layers3 size={18} className="text-[#0064E0]" />
          <span className="mt-3 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Active Phase
          </span>
          <strong className="mt-1 block truncate text-sm text-slate-950">
            {activePhase?.title ?? "No active phase"}
          </strong>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <CheckCircle2 size={18} className="text-[#0064E0]" />
          <span className="mt-3 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Pending Reviews
          </span>
          <strong className="mt-1 block text-sm text-slate-950">
            {pendingApprovals}
          </strong>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <CreditCard size={18} className="text-[#0064E0]" />
          <span className="mt-3 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Unpaid Payments
          </span>
          <strong className="mt-1 block text-sm text-slate-950">
            {unpaidPayments}
          </strong>
        </div>
      </div>
    </section>
  );
}