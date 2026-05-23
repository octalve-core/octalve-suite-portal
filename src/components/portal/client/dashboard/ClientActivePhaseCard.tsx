import { Layers3 } from "lucide-react";
import type { ProjectPhase } from "@/lib/types";
import {
  getBadgeClasses,
  getToneForStatus,
  statusLabel,
} from "./client-dashboard-utils";

export function ClientActivePhaseCard({
  phase,
}: {
  phase?: ProjectPhase;
}) {
  const tone = getToneForStatus(phase?.status);

  return (
    <article className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
      <div className="flex items-center justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-950">Active Phase</span>

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

          <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-[#334a7d]">
            {phase?.description ?? "Your active project movement appears here."}
          </p>
        </div>

        <span className="hidden h-20 w-20 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-[#0064E0] shadow-[0_10px_28px_rgba(15,23,42,0.055)] sm:grid">
          <Layers3 size={34} />
        </span>
      </div>
    </article>
  );
}
