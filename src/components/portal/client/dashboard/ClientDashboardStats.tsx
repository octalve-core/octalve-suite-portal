import {
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  FolderKanban,
  Link2,
} from "lucide-react";

function StatCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: React.ReactNode;
  tone: "blue" | "green" | "orange" | "purple" | "red";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-[#0064E0] ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    purple: "bg-violet-50 text-violet-700 ring-violet-100",
    red: "bg-red-50 text-red-700 ring-red-100",
  }[tone];

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="block text-[11px] font-black uppercase tracking-[0.13em] text-slate-400">
            {label}
          </span>

          <strong className="mt-3 block text-[30px] font-semibold leading-none tracking-[-0.055em] text-slate-950">
            {value}
          </strong>

          <p className="mt-2 truncate text-sm font-semibold text-slate-500">
            {helper}
          </p>
        </div>

        <span className={["grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1", toneClass].join(" ")}>
          {icon}
        </span>
      </div>
    </article>
  );
}

export function ClientDashboardStats({
  progress,
  approvedPhases,
  totalPhases,
  pendingApprovals,
  linksCount,
  outstandingPayments,
}: {
  progress: number;
  approvedPhases: number;
  totalPhases: number;
  pendingApprovals: number;
  linksCount: number;
  outstandingPayments: number;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Progress"
        value={`${progress}%`}
        helper="Overall delivery movement"
        icon={<FolderKanban size={20} />}
        tone="blue"
      />

      <StatCard
        label="Approved Phases"
        value={`${approvedPhases}/${totalPhases}`}
        helper="Completed approvals"
        icon={<CheckCircle2 size={20} />}
        tone="green"
      />

      <StatCard
        label="Pending Reviews"
        value={pendingApprovals}
        helper="Needs your review"
        icon={<Clock3 size={20} />}
        tone="orange"
      />

      <StatCard
        label="Deliverable Links"
        value={linksCount}
        helper="Visible resources"
        icon={<Link2 size={20} />}
        tone="purple"
      />

      <StatCard
        label="Unpaid Payments"
        value={outstandingPayments}
        helper={outstandingPayments > 0 ? "Payment required" : "No payment due"}
        icon={<CreditCard size={20} />}
        tone={outstandingPayments > 0 ? "red" : "green"}
      />
    </section>
  );
}