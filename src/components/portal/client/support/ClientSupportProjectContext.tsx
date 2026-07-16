import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Layers3,
} from "lucide-react";

import type { Project, ProjectPhase } from "@/lib/types";
import {
  formatSupportDate,
  getPrimaryPayment,
} from "./client-support-utils";

function SupportMetric({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "blue" | "green" | "orange" | "purple";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-[#0064E0] ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    purple: "bg-violet-50 text-violet-700 ring-violet-100",
  }[tone];

  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <span
        className={[
          "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1",
          toneClass,
        ].join(" ")}
      >
        {icon}
      </span>

      <div className="min-w-0">
        <span className="block text-sm font-medium text-slate-500">
          {label}
        </span>
        <strong className="mt-1 block truncate text-sm font-medium text-slate-700">
          {value}
        </strong>
      </div>
    </div>
  );
}

export function ClientSupportProjectContext({
  project,
  activePhase,
}: {
  project?: Project;
  activePhase?: ProjectPhase;
}) {
  const pendingApprovals =
    project?.phases.filter((phase) => phase.status === "AWAITING_APPROVAL")
      .length ?? 0;

  const unpaidPayments =
    project?.payments.filter((payment) => payment.status === "UNPAID").length ?? 0;

  const payment = getPrimaryPayment(project);

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.02)]">
      <div className="grid md:grid-cols-2 xl:grid-cols-5">
        <SupportMetric
          label="Active Phase"
          value={activePhase?.title ?? "No active phase"}
          icon={<Layers3 size={21} />}
        />

        <SupportMetric
          label="Target Date"
          value={formatSupportDate(project?.targetDate)}
          icon={<CalendarDays size={21} />}
        />

        <SupportMetric
          label="Pending Reviews"
          value={pendingApprovals}
          icon={<CheckCircle2 size={21} />}
          tone="orange"
        />

        <SupportMetric
          label="Unpaid Payments"
          value={unpaidPayments}
          icon={<CreditCard size={21} />}
          tone="green"
        />

        <SupportMetric
          label="Payment Reference"
          value={payment?.reference ?? "Not available"}
          icon={<FileText size={21} />}
          tone="purple"
        />
      </div>
    </section>
  );
}