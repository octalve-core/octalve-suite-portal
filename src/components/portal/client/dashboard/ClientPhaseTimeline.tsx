import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, LockKeyhole, Layers3 } from "lucide-react";
import type { ProjectPhase } from "@/lib/types";
import {
  getBadgeClasses,
  getPhaseProgress,
  getToneForStatus,
  statusLabel,
} from "./client-dashboard-utils";

function phaseIcon(status: string) {
  if (status === "APPROVED") return <CheckCircle2 size={18} />;
  if (status === "LOCKED") return <LockKeyhole size={18} />;
  if (status === "AWAITING_APPROVAL") return <Clock3 size={18} />;
  return <Layers3 size={18} />;
}

export function ClientPhaseTimeline({ phases }: { phases: ProjectPhase[] }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.055)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            Phase Timeline
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Follow each project phase from locked to approved.
          </p>
        </div>

        <Link
          href="/client/phases"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0064E0]"
        >
          View all
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-3 p-4">
        {phases.map((phase, index) => {
          const tone = getToneForStatus(phase.status);
          const progress = getPhaseProgress(phase);

          return (
            <Link
              key={phase.id}
              href={`/client/phases/${phase.id}`}
              className="group rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span
                  className={[
                    "grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1",
                    tone === "green"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                      : tone === "orange"
                        ? "bg-orange-50 text-orange-700 ring-orange-100"
                        : tone === "red"
                          ? "bg-red-50 text-red-700 ring-red-100"
                          : tone === "slate"
                            ? "bg-slate-50 text-slate-500 ring-slate-200"
                            : "bg-blue-50 text-[#0064E0] ring-blue-100",
                  ].join(" ")}
                >
                  {phase.status === "LOCKED" ? <LockKeyhole size={18} /> : phaseIcon(phase.status) || index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <strong className="block text-sm font-semibold text-slate-950">
                        {phase.title}
                      </strong>
                      <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-slate-500">
                        {phase.status === "LOCKED"
                          ? "Complete previous phase first to unlock"
                          : phase.description}
                      </p>
                    </div>

                    <span
                      className={[
                        "inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold",
                        getBadgeClasses(tone),
                      ].join(" ")}
                    >
                      {statusLabel(phase.status)}
                    </span>
                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <span
                      className="block h-full rounded-full bg-[#0064E0]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
