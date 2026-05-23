import { Layers3 } from "lucide-react";
import type { ClientPhaseRow } from "./client-phases-utils";
import { ClientPhaseCard } from "./ClientPhaseCard";

export function ClientPhaseList({ rows }: { rows: ClientPhaseRow[] }) {
  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
          <Layers3 size={24} />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950">
          No matching phases
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Adjust the filter or open another project. Phase records appear after project setup.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
      {rows.map((row) => (
        <ClientPhaseCard
          key={`${row.project.id}-${row.phase.id}`}
          row={row}
        />
      ))}
    </div>
  );
}
