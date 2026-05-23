import type React from "react";
import { CheckCircle2, Clock3, FileText, LockKeyhole } from "lucide-react";
import type { ClientPhaseRow } from "./client-phases-utils";

function PhaseStatCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
      <div className="flex items-start gap-4">
        <span
          className={[
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1",
            tone,
          ].join(" ")}
        >
          {icon}
        </span>

        <div className="min-w-0">
          <strong className="block text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {value}
          </strong>
          <span className="block text-sm font-medium text-slate-500">
            {label}
          </span>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
            {helper}
          </p>
        </div>
      </div>
    </article>
  );
}

export function ClientPhaseStats({ rows }: { rows: ClientPhaseRow[] }) {
  const awaiting = rows.filter((row) => row.phase.status === "AWAITING_APPROVAL").length;
  const approved = rows.filter((row) => row.phase.status === "APPROVED").length;
  const changes = rows.filter((row) => row.phase.status === "CHANGES_REQUESTED").length;
  const locked = rows.filter((row) => row.phase.status === "LOCKED").length;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <PhaseStatCard
        label="Awaiting Approval"
        value={awaiting}
        helper="Ready for client review"
        tone="bg-orange-50 text-orange-700 ring-orange-100"
        icon={<Clock3 size={19} />}
      />
      <PhaseStatCard
        label="Approved"
        value={approved}
        helper="Completed phase approvals"
        tone="bg-emerald-50 text-emerald-700 ring-emerald-100"
        icon={<CheckCircle2 size={19} />}
      />
      <PhaseStatCard
        label="Changes Requested"
        value={changes}
        helper="Needs delivery revision"
        tone="bg-red-50 text-red-700 ring-red-100"
        icon={<FileText size={19} />}
      />
      <PhaseStatCard
        label="Locked"
        value={locked}
        helper="Waiting for previous steps"
        tone="bg-slate-50 text-slate-600 ring-slate-200"
        icon={<LockKeyhole size={19} />}
      />
    </section>
  );
}
