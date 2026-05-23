import type { Project, ProjectPayment, ProjectPhase } from "@/lib/types";

export type DashboardTone = "blue" | "green" | "orange" | "red" | "purple" | "slate";

export type PaymentBlock = {
  payment: ProjectPayment;
  title: string;
  body: string;
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatNaira(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(safeValue);
}

export function formatProjectDate(value?: string) {
  if (!value) return "No date set";

  const date = new Date(value.includes("T") ? value : `${value}T23:59:59.999`);

  if (Number.isNaN(date.getTime())) return "No date set";

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getCountdownParts(value?: string, now = Date.now()) {
  if (!value) return null;

  const target = new Date(value.includes("T") ? value : `${value}T23:59:59.999`);

  if (Number.isNaN(target.getTime())) return null;

  const diff = target.getTime() - now;
  const abs = Math.abs(diff);

  return {
    overdue: diff < 0,
    days: Math.floor(abs / DAY),
    hours: Math.floor((abs % DAY) / HOUR),
    minutes: Math.floor((abs % HOUR) / MINUTE),
    seconds: Math.floor((abs % MINUTE) / SECOND),
  };
}

export function formatCountdown(value?: string, now = Date.now()) {
  const parts = getCountdownParts(value, now);

  if (!parts) return "No countdown set";

  const prefix = parts.overdue ? "overdue" : "left";

  return `${parts.days}d ${parts.hours}h ${parts.minutes}m ${parts.seconds}s ${prefix}`;
}

export function statusLabel(status?: string) {
  if (!status) return "Unknown";

  return status
    .split("_")
    .map((word) => word[0] + word.slice(1).toLowerCase())
    .join(" ");
}

export function projectProgress(project: Project) {
  if (!project.phases.length) return 0;

  return Math.round(
    (project.phases.filter((phase) => phase.status === "APPROVED").length /
      project.phases.length) *
      100,
  );
}

export function getActivePhase(project: Project) {
  return (
    project.phases.find((phase) =>
      ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED"].includes(
        phase.status,
      ),
    ) ??
    project.phases.find((phase) => phase.status !== "LOCKED") ??
    project.phases[0]
  );
}

export function getPaymentBlock(project: Project): PaymentBlock | null {
  const deposit = project.payments.find((payment) => payment.type === "DEPOSIT");
  const balance = project.payments.find((payment) => payment.type === "BALANCE");

  if (project.status === "APPROVED_AWAITING_DEPOSIT" && deposit) {
    return {
      payment: deposit,
      title: "Payment Required",
      body: "Deposit payment is required to unlock project tracking.",
    };
  }

  if (project.status === "DEPOSIT_PENDING_CONFIRMATION" && deposit) {
    return {
      payment: deposit,
      title: "Deposit submitted",
      body: "We are confirming your transfer. Your project opens once confirmed.",
    };
  }

  if (project.status === "AWAITING_BALANCE" && balance) {
    return {
      payment: balance,
      title: "Balance payment required",
      body: "Complete your balance payment to unlock final delivery.",
    };
  }

  if (project.status === "BALANCE_PENDING_CONFIRMATION" && balance) {
    return {
      payment: balance,
      title: "Balance submitted",
      body: "We are confirming your transfer. The final phase opens once confirmed.",
    };
  }

  return null;
}

export function getToneForProgress(value: number): DashboardTone {
  if (value >= 80) return "green";
  if (value >= 40) return "blue";
  if (value > 0) return "orange";
  return "slate";
}

export function getToneForStatus(status?: string): DashboardTone {
  if (!status) return "slate";

  if (["ACTIVE", "APPROVED", "CONFIRMED", "COMPLETED"].includes(status)) {
    return "green";
  }

  if (["IN_PROGRESS", "READY_FOR_REVIEW"].includes(status)) {
    return "blue";
  }

  if (
    [
      "AWAITING_APPROVAL",
      "PENDING_CONFIRMATION",
      "PENDING_REVIEW",
      "APPROVED_AWAITING_DEPOSIT",
      "DEPOSIT_PENDING_CONFIRMATION",
      "AWAITING_BALANCE",
      "BALANCE_PENDING_CONFIRMATION",
      "INFO_REQUESTED",
      "UNPAID",
    ].includes(status)
  ) {
    return "orange";
  }

  if (["REJECTED", "CHANGES_REQUESTED", "NEEDS_CHANGES"].includes(status)) {
    return "red";
  }

  return "purple";
}

export function getToneClasses(tone: DashboardTone) {
  const map: Record<DashboardTone, string> = {
    blue: "bg-blue-50 text-[#0064E0] ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
    slate: "bg-slate-50 text-slate-600 ring-slate-200",
  };

  return map[tone];
}

export function getBadgeClasses(tone: DashboardTone) {
  const map: Record<DashboardTone, string> = {
    blue: "border-blue-200 bg-blue-50 text-[#0064E0]",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    red: "border-red-200 bg-red-50 text-red-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return map[tone];
}

export function getPhaseProgress(phase: ProjectPhase) {
  if (!phase.deliverables.length) {
    return phase.status === "APPROVED" ? 100 : 0;
  }

  return Math.round(
    (phase.deliverables.filter((deliverable) => deliverable.status === "APPROVED")
      .length /
      phase.deliverables.length) *
      100,
  );
}
