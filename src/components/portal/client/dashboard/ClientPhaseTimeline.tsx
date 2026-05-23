import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole, Layers3 } from "lucide-react";
import type { ProjectPhase } from "@/lib/types";
import {
  getBadgeClasses,
  getToneForStatus,
  statusLabel,
} from "./client-dashboard-utils";

export function ClientPhaseTimeline({ phases }: { phases: ProjectPhase[] }) {
  return (
    <section className="rounded-[18px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
          Phase Timeline
        </h2>

        <Link
          href="/client/phases"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0064E0]"
        >
          View all
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-0 p-5">
        {phases.map((phase, index) => {
          const tone = getToneForStatus(phase.status);
          const locked = phase.status === "LOCKED";
          const approved = phase.status === "APPROVED";
          const active = ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED"].includes(phase.status);

          return (
            <Link
              key={phase.id}
              href={`/client/phases/${phase.id}`}
              className="group grid grid-cols-[40px_minmax(0,1fr)] gap-4"
            >
              <div className="relative flex justify-center">
                {index !== phases.length - 1 ? (
                  <span className="absolute bottom-0 top-10 w-px bg-slate-200" />
                ) : null}

                <span
                  className={[
                    "relative z-10 grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold",
                    active
                      ? "border-[#0064E0] bg-[#0064E0] text-white"
                      : approved
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600",
                  ].join(" ")}
                >
                  {approved ? <CheckCircle2 size={18} /> : index + 1}
                </span>
              </div>

              <div className="pb-4">
                <div className="rounded-2xl p-3 transition group-hover:bg-blue-50/50">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
                        {locked ? <LockKeyhole size={17} /> : <Layers3 size={17} />}
                      </span>

                      <div className="min-w-0">
                        <strong className="block text-sm font-semibold text-slate-950">
                          {phase.title}
                        </strong>
                        <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-[#334a7d]">
                          {locked
                            ? "Complete previous phase first to unlock."
                            : phase.description}
                        </p>
                      </div>
                    </div>

                    <span
                      className={[
                        "inline-flex w-fit rounded-xl border px-3 py-1 text-xs font-bold",
                        getBadgeClasses(tone),
                      ].join(" ")}
                    >
                      {statusLabel(phase.status)}
                    </span>
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
