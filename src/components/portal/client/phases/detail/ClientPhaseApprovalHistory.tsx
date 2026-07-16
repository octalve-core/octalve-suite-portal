import { Clock3, ShieldCheck } from "lucide-react";

import type { ProjectPhase } from "@/lib/types";
import { formatPhaseDate } from "./client-phase-detail-utils";

export function ClientPhaseApprovalHistory({
  phase,
}: {
  phase: ProjectPhase;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.02)]">
      <h2 className="text-xl font-medium tracking-[-0.035em] text-slate-900">
        Approval History
      </h2>

      <div className="mt-5 grid gap-3">
        {phase.approvalRequestedAt ? (
          <div className="flex gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4">
            <Clock3 size={18} className="mt-0.5 shrink-0 text-orange-600" />
            <div>
              <strong className="block text-sm text-slate-950">
                Approval requested
              </strong>
              <span className="mt-1 block text-sm font-medium text-slate-500">
                {formatPhaseDate(phase.approvalRequestedAt)}
              </span>
            </div>
          </div>
        ) : null}

        {phase.approvedAt ? (
          <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <strong className="block text-sm text-slate-950">
                Phase approved
              </strong>
              <span className="mt-1 block text-sm font-medium text-slate-500">
                {formatPhaseDate(phase.approvedAt)}
              </span>
            </div>
          </div>
        ) : null}

        {phase.changeRequest ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <strong className="block text-sm text-red-800">
              Latest change request
            </strong>
            <p className="mt-2 text-sm font-medium leading-6 text-red-700">
              {phase.changeRequest}
            </p>
          </div>
        ) : null}

        {!phase.approvalRequestedAt && !phase.approvedAt && !phase.changeRequest ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-500">
            No approval activity has been recorded for this phase yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
