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
  if (status === "APPROVED") return <CheckCircle2 size={17} />;
  if (status === "LOCKED") return <LockKeyhole size={17} />;
  return <Layers3 size={17} />;
}

function metricBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <span className="block text-[9px] font-medium uppercase tracking-[0.09em] text-slate-400">
        {label}
      </span>
      <strong className="mt-1 block text-base font-semibold leading-none text-slate-950">
        {value}
      </strong>
    </div>
  );
}

function openButtonTone(status: ClientPhaseRow["phase"]["status"]) {
  if (status === "LOCKED") {
    return "border-slate-200 bg-white text-slate-500 hover:bg-slate-50";
  }

  return "border-blue-200 bg-white text-[#0064E0] hover:bg-blue-50";
}

export function ClientPhaseCard({ row }: { row: ClientPhaseRow }) {
  const { phase } = row;
  const progress = phaseProgress(phase);
  const safeProgress = Math.max(0, Math.min(100, progress));
  const approved = approvedDeliverableCount(phase);

  return (
    <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.02)]">
      <div className="flex items-start gap-3">
        <span
          className={[
            "grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black ring-1",
            phase.status === "LOCKED"
              ? "bg-slate-50 text-slate-600 ring-slate-200"
              : "bg-[#0064E0] text-white ring-blue-100",
          ].join(" ")}
        >
          {phase.phaseNumber}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 basis-[190px]">
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  className={[
                    "grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1",
                    phaseIconTone(phase.status),
                  ].join(" ")}
                >
                  {iconForStatus(phase.status)}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-[15px] font-semibold leading-5 tracking-[-0.035em] text-slate-950">
                    {phase.title}
                  </h3>

                  <p className="mt-1 break-words text-[13px] font-medium leading-6 text-slate-500">
                    {getPhaseDescription(phase)}
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-full shrink-0">
              <ClientPhaseStatusChip status={phase.status} />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
              <span>Progress</span>
              <span className="text-slate-600">{safeProgress}%</span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <span
                className="block h-full rounded-full bg-[#0064E0]"
                style={{ width: `${safeProgress}%` }}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {metricBox({
                label: "Deliverables",
                value: phase.deliverables.length,
              })}

              {metricBox({
                label: "Approved",
                value: approved,
              })}
            </div>
          </div>

          <Link
            href={`/client/phases/${phase.id}`}
            className={[
              "mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition",
              openButtonTone(phase.status),
            ].join(" ")}
          >
            Open Phase
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}