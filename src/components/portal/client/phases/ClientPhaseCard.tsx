import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Layers3,
} from "lucide-react";

import type { ClientPhaseRow } from "./client-phases-utils";
import {
  approvedDeliverableCount,
  getPhaseDescription,
  phaseIconTone,
  phaseProgress,
} from "./client-phases-utils";
import { ClientPhaseStatusChip } from "./ClientPhaseStatusChip";

function iconForStatus(status: ClientPhaseRow["phase"]["status"]) {
  if (status === "APPROVED") return <CheckCircle2 size={18} />;
  if (status === "LOCKED") return <LockKeyhole size={18} />;
  return <Layers3 size={18} />;
}

export function ClientPhaseCard({ row }: { row: ClientPhaseRow }) {
  const { phase } = row;
  const progress = phaseProgress(phase);

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.02)]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0064E0] text-sm font-black text-white">
          {phase.phaseNumber}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={[
                  "grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1",
                  phaseIconTone(phase.status),
                ].join(" ")}
              >
                {iconForStatus(phase.status)}
              </span>

              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold tracking-[-0.035em] text-slate-950">
                  {phase.title}
                </h3>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  {getPhaseDescription(phase)}
                </p>
              </div>
            </div>

            <ClientPhaseStatusChip status={phase.status} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Progress
              </span>
              <strong className="mt-1 block text-sm text-slate-950">
                {progress}%
              </strong>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <span
                  className="block h-full rounded-full bg-[#0064E0]"
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Deliverables
              </span>
              <strong className="mt-1 block text-sm text-slate-950">
                {phase.deliverables.length}
              </strong>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Approved
              </span>
              <strong className="mt-1 block text-sm text-slate-950">
                {approvedDeliverableCount(phase)}
              </strong>
            </div>
          </div>

          <Link
            href={`/client/phases/${phase.id}`}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-[#0064E0] transition hover:bg-blue-50"
          >
            Open Phase
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
