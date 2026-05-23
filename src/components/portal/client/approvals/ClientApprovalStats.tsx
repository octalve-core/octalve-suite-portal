import type React from "react";
import { CheckCircle2, Clock3, FileText } from "lucide-react";

function ApprovalStatCard({
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

        <div>
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

export function ClientApprovalStats({
  awaiting,
  approved,
  changes,
}: {
  awaiting: number;
  approved: number;
  changes: number;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <ApprovalStatCard
        label="Awaiting Review"
        value={awaiting}
        helper="Ready for decision"
        tone="bg-orange-50 text-orange-700 ring-orange-100"
        icon={<Clock3 size={19} />}
      />
      <ApprovalStatCard
        label="Approved"
        value={approved}
        helper="Accepted phases"
        tone="bg-emerald-50 text-emerald-700 ring-emerald-100"
        icon={<CheckCircle2 size={19} />}
      />
      <ApprovalStatCard
        label="Changes Requested"
        value={changes}
        helper="Needs adjustment"
        tone="bg-red-50 text-red-700 ring-red-100"
        icon={<FileText size={19} />}
      />
    </section>
  );
}
