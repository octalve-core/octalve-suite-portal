import Link from "next/link";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";

import type { Project, ProjectPhase } from "@/lib/types";
import {
  PHASE_STATUS_LABELS,
  canClientApprovePhase,
  phaseStatusTone,
} from "./client-phase-detail-utils";

export function ClientPhaseDetailHeader({
  phase,
  project,
  backHref,
  approveLoading,
  onApprove,
}: {
  phase: ProjectPhase;
  project?: Project;
  backHref: string;
  approveLoading: boolean;
  onApprove: () => Promise<void>;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.025)] sm:p-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 transition hover:text-[#0064E0]"
      >
        <ArrowLeft size={17} />
        Back to Phases
      </Link>

      <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <span
            className={[
              "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
              phaseStatusTone(phase.status),
            ].join(" ")}
          >
            {PHASE_STATUS_LABELS[phase.status]}
          </span>

          <h1 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.065em] text-slate-950 sm:text-[42px]">
            {phase.title}
          </h1>

          <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-slate-500 sm:text-[15px]">
            {phase.description ||
              "Review the deliverables, approval status and phase discussion for this project stage."}
          </p>

          {project ? (
            <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
              {project.title} - {project.projectCode}
            </div>
          ) : null}
        </div>

        {canClientApprovePhase(phase) ? (
          <button
            type="button"
            onClick={() => void onApprove()}
            disabled={approveLoading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {approveLoading ? (
              <>
                <Send size={17} />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 size={17} />
                Approve Phase
              </>
            )}
          </button>
        ) : null}
      </div>
    </section>
  );
}
