import { CheckCircle2 } from "lucide-react";
import type { ApprovalRow } from "./client-approvals-utils";
import { ClientApprovalCard } from "./ClientApprovalCard";

export function ClientApprovalList({
  rows,
  loadingAction,
  onApprove,
  onRequestChanges,
}: {
  rows: ApprovalRow[];
  loadingAction: string;
  onApprove: (row: ApprovalRow) => void;
  onRequestChanges: (row: ApprovalRow) => void;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950">
          No approvals match this filter
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Switch project or status filter to review other phase approval records.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {rows.map((row) => (
        <ClientApprovalCard
          key={`${row.project.id}-${row.phase.id}`}
          row={row}
          loadingAction={loadingAction}
          onApprove={onApprove}
          onRequestChanges={onRequestChanges}
        />
      ))}
    </div>
  );
}
