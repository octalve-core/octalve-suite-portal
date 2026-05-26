import type React from "react";
import {
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import type { ClientPhaseRow } from "./client-phases-utils";
import { getCurrentPhasePosition } from "./client-phases-utils";

function PhaseStatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <article className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.02)]">
      <div className="flex items-center gap-4">
        <span
          className={[
            "grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-1",
            tone,
          ].join(" ")}
        >
          {icon}
        </span>

        <div className="min-w-0">
          <span className="block text-sm font-semibold text-slate-500">
            {label}
          </span>
          <strong className="mt-1 block text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {value}
          </strong>
        </div>
      </div>
    </article>
  );
}

export function ClientPhaseStats({ rows }: { rows: ClientPhaseRow[] }) {
  const total = rows.length;
  const approved = rows.filter((row) => row.phase.status === "APPROVED").length;
  const locked = rows.filter((row) => row.phase.status === "LOCKED").length;
  const current = getCurrentPhasePosition(rows);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <PhaseStatCard
        label="Total Phases"
        value={total}
        tone="bg-blue-50 text-[#0064E0] ring-blue-100"
        icon={<ClipboardList size={22} />}
      />

      <PhaseStatCard
        label="Approved Phases"
        value={approved}
        tone="bg-emerald-50 text-emerald-700 ring-emerald-100"
        icon={<CheckCircle2 size={22} />}
      />

      <PhaseStatCard
        label="Locked Phases"
        value={locked}
        tone="bg-purple-50 text-purple-700 ring-purple-100"
        icon={<LockKeyhole size={22} />}
      />

      <PhaseStatCard
        label="Current Phase"
        value={current}
        tone="bg-blue-50 text-[#0064E0] ring-blue-100"
        icon={<ShieldCheck size={22} />}
      />
    </section>
  );
}
