import Link from "next/link";
import { CheckCircle2, Clock3, Layers3 } from "lucide-react";

import type { ProjectPhase } from "@/lib/types";
import {
  getBadgeClasses,
  getPhaseProgress,
  getToneForStatus,
  statusLabel,
} from "./client-dashboard-utils";

export function ClientPhaseTimeline({ phases }: { phases: ProjectPhase[] }) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.055)]">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            Phase Timeline
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            See where your project currently stands.
          </p>
        </div>

        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
          <Layers3 size={20} />
        </span>
      </div>

      <div className="p-4">
        {phases.length ? (
          <div className="grid gap-3">
            {phases.map((phase, index) => {
              const approved = phase.status === "APPROVED";
              const active = ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED"].includes(phase.status);
              const tone = getToneForStatus(phase.status);
              const progress = getPhaseProgress(phase);

              return (
                <Link
                  key={phase.id}
                  href={`/client/phases/${phase.id}`}
                  className={[
                    "rounded-2xl border p-4 transition",
                    active
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/60",
                  ].join(" ")}
                >
                  <div className="flex gap-3">
                    <span
                      className={[
                        "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black ring-1",
                        approved
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                          : active
                            ? "bg-white text-[#0064E0] ring-blue-100"
                            : "bg-slate-50 text-slate-500 ring-slate-200",
                      ].join(" ")}
                    >
                      {approved ? <CheckCircle2 size={18} /> : active ? <Clock3 size={17} /> : index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="truncate text-sm font-semibold text-slate-950">
                          {phase.title}
                        </strong>

                        <span
                          className={[
                            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold",
                            getBadgeClasses(tone),
                          ].join(" ")}
                        >
                          {statusLabel(phase.status)}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">
                        {phase.description ?? "Phase details and progress updates."}
                      </p>

                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-[11px] font-bold text-slate-400">
                          <span>Readiness</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#0064E0]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
              <Layers3 size={22} />
            </span>
            <strong className="mt-4 block text-base font-semibold text-slate-950">
              No phases yet
            </strong>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              Project phases will appear here once the workspace is prepared.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}