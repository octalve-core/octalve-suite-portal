import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Layers3,
  LockKeyhole,
} from "lucide-react";

import type { ClientPhaseRow } from "./client-phases-utils";
import {
  approvedDeliverableCount,
  getPhaseDescription,
  phaseIconTone,
  phaseProgress,
} from "./client-phases-utils";
import { ClientPhaseCard } from "./ClientPhaseCard";
import { ClientPhaseStatusChip } from "./ClientPhaseStatusChip";

function iconForStatus(status: ClientPhaseRow["phase"]["status"]) {
  if (status === "APPROVED") return <CheckCircle2 size={17} />;
  if (status === "LOCKED") return <LockKeyhole size={17} />;
  return <Layers3 size={17} />;
}

function actionTone(status: ClientPhaseRow["phase"]["status"]) {
  if (status === "LOCKED") {
    return "border-slate-200 text-slate-400 hover:bg-slate-50";
  }

  return "border-blue-200 text-[#0064E0] hover:bg-blue-50";
}

export function ClientPhaseList({ rows }: { rows: ClientPhaseRow[] }) {
  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
          <Layers3 size={24} />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950">
          No phases available
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Select another project or wait for Octalve to configure the project phases.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1100px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              <th className="w-[70px] px-5 py-4">#</th>
              <th className="px-5 py-4">Phase</th>
              <th className="px-5 py-4">Description</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Progress</th>
              <th className="px-5 py-4">Deliverables</th>
              <th className="px-5 py-4">Approved</th>
              <th className="px-5 py-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const { phase } = row;
              const progress = phaseProgress(phase);
              const approved = approvedDeliverableCount(phase);

              return (
                <tr
                  key={phase.id}
                  className="border-b border-slate-200 bg-white text-sm transition last:border-b-0 hover:bg-slate-50/70"
                >
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "grid h-9 w-9 place-items-center rounded-full text-sm font-black ring-1",
                          phase.status === "LOCKED"
                            ? "bg-white text-slate-600 ring-slate-200"
                            : "bg-[#0064E0] text-white ring-blue-100",
                        ].join(" ")}
                      >
                        {phase.phaseNumber}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={[
                          "grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1",
                          phaseIconTone(phase.status),
                        ].join(" ")}
                      >
                        {iconForStatus(phase.status)}
                      </span>

                      <strong className="block max-w-[220px] truncate text-sm font-semibold text-slate-950">
                        {phase.title}
                      </strong>
                    </div>
                  </td>

                  <td className="px-5 py-5">
                    <p className="line-clamp-2 max-w-[330px] text-sm font-medium leading-6 text-slate-500">
                      {getPhaseDescription(phase)}
                    </p>
                  </td>

                  <td className="px-5 py-5">
                    <ClientPhaseStatusChip status={phase.status} />
                  </td>

                  <td className="px-5 py-5">
                    <div className="min-w-[160px]">
                      <strong className="block text-sm text-slate-950">
                        {progress}%
                      </strong>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <span
                          className="block h-full rounded-full bg-[#0064E0]"
                          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-5 font-semibold text-slate-950">
                    {phase.deliverables.length}
                  </td>

                  <td className="px-5 py-5 font-semibold text-slate-950">
                    {approved}
                  </td>

                  <td className="px-5 py-5 text-center">
                    <Link
                      href={`/client/phases/${phase.id}`}
                      className={[
                        "inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition",
                        actionTone(phase.status),
                      ].join(" ")}
                      aria-label={`Open ${phase.title}`}
                    >
                      <ArrowRight size={17} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 pb-28 lg:hidden">
        {rows.map((row) => (
          <ClientPhaseCard
            key={`${row.project.id}-${row.phase.id}`}
            row={row}
          />
        ))}
      </div>

      <div className="border-t border-slate-100 px-5 py-4 text-center text-sm font-semibold text-slate-500">
        Complete each phase in order to unlock the next.
      </div>
    </section>
  );
}
