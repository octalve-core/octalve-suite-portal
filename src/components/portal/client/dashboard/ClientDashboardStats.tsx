import {
  CheckCircle2,
  Clock3,
  CreditCard,
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

  const valueClass = {
    blue: "text-slate-950",
    green: "text-slate-950",
    orange: "text-slate-950",
    purple: "text-slate-950",
    red: "text-slate-950",
  }[tone];

  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.02)]">
      <span
        className={[
          "grid h-11 w-11 place-items-center rounded-2xl ring-1",
          toneClass,
        ].join(" ")}
      >
        {icon}
      </span>

      <span className="mt-4 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>

      <strong
        className={[
          "mt-4 block text-[28px] font-semibold leading-none tracking-[-0.055em]",
          valueClass,
        ].join(" ")}
      >
        {value}
      </strong>

      <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">
        {helper}
      </p>
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
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
      <h2 className="mb-4 text-xl font-semibold tracking-[-0.04em] text-slate-950">
        Project Overview
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Progress"
          value={`${progress}%`}
          helper="Overall delivery movement"
          icon={<FolderKanban size={18} />}
          tone="blue"
        />

        <StatCard
          label="Approved Phases"
          value={`${approvedPhases} / ${totalPhases}`}
          helper="Completed approvals"
          icon={<CheckCircle2 size={18} />}
          tone="green"
        />

        <StatCard
          label="Pending Reviews"
          value={pendingApprovals}
          helper="Needs your review"
          icon={<Clock3 size={18} />}
          tone="orange"
        />

        <StatCard
          label="Deliverable Links"
          value={linksCount}
          helper="Visible resources"
          icon={<Link2 size={18} />}
          tone="purple"
        />

        <StatCard
          label="Unpaid Payments"
          value={outstandingPayments}
          helper={outstandingPayments > 0 ? "Payment required" : "No payment due"}
          icon={<CreditCard size={18} />}
          tone={outstandingPayments > 0 ? "red" : "green"}
        />
      </div>
    </section>
  );
}