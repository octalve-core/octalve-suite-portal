import type React from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";

function ApprovalStatCard({
  label,
  value,
  icon,
  tone,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
  accent: string;
}) {
  return (
    <article
      className={[
        "rounded-[18px] border border-slate-200 border-l-2 bg-white p-6 shadow-[0_6px_16px_rgba(15,23,42,0.02)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.07)]",
        accent,
      ].join(" ")}
    >
      <div className="flex items-center gap-5">
        <span
          className={[
            "grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-1",
            tone,
          ].join(" ")}
        >
          {icon}
        </span>

        <div>
          <strong className="block text-3xl font-semibold tracking-[-0.05em] text-slate-950">
            {value}
          </strong>
          <span className="mt-1 block text-sm font-semibold text-slate-500">
            {label}
          </span>
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
    <section className="grid gap-4 lg:grid-cols-3">
      <ApprovalStatCard
        label="Awaiting Review"
        value={awaiting}
        tone="bg-orange-50 text-orange-700 ring-orange-100"
        accent="border-l-[#FC7E24]"
        icon={<Clock3 size={22} />}
      />

      <ApprovalStatCard
        label="Approved"
        value={approved}
        tone="bg-emerald-50 text-emerald-700 ring-emerald-100"
        accent="border-l-[#29BE3E]"
        icon={<CheckCircle2 size={22} />}
      />

      <ApprovalStatCard
        label="Changes Requested"
        value={changes}
        tone="bg-red-50 text-red-700 ring-red-100"
        accent="border-l-[#E61525]"
        icon={<XCircle size={22} />}
      />
    </section>
  );
}
