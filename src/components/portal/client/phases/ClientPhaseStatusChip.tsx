import type { PhaseStatus } from "@/lib/types";
import { PHASE_STATUS_LABELS, phaseStatusTone } from "./client-phases-utils";

export function ClientPhaseStatusChip({ status }: { status: PhaseStatus }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
        phaseStatusTone(status),
      ].join(" ")}
    >
      {PHASE_STATUS_LABELS[status]}
    </span>
  );
}
