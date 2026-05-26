import Link from "next/link";
import { ArrowRight, Layers3, MessageSquareText, PackageCheck } from "lucide-react";

import type { ProjectPhase } from "@/lib/types";
import {
  getBadgeClasses,
  getPhaseProgress,
  getToneForStatus,
  statusLabel,
} from "./client-dashboard-utils";

export function ClientActivePhaseCard({
  phase,
}: {
  phase?: ProjectPhase;
}) {
  const tone = getToneForStatus(phase?.status);
  const progress = phase ? getPhaseProgress(phase) : 0;

  return (
    <article className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-950">
                Active Phase
              </span>

              {phase?.status ? (
                <span
                  className={[
                    "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                    getBadgeClasses(tone),
                  ].join(" ")}
                >
                  {statusLabel(phase.status)}
                </span>
              ) : null}
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
              {phase?.title ?? "No active phase"}
            </h2>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              {phase?.description ?? "Your active project movement appears here once delivery begins."}
            </p>
          </div>

          <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-2xl border border-blue-100 bg-blue-50 text-[#0064E0] sm:grid">
            <Layers3 size={28} />
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Phase readiness</span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#0064E0]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
              <PackageCheck size={13} />
              {phase?.deliverables.length ?? 0} deliverables
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
              <MessageSquareText size={13} />
              {phase?.messages.length ?? 0} messages
            </span>
          </div>
        </div>

        {phase ? (
          <Link
            href={`/client/phases/${phase.id}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(0,100,224,0.16)] transition hover:bg-[#0052B8]"
          >
            Open Phase
            <ArrowRight size={16} />
          </Link>
        ) : null}
      </div>
    </article>
  );
}