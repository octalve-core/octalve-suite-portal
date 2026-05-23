import type {
  PhaseStatus,
  Project,
  ProjectPhase,
  ProjectStatus,
} from "@/lib/types";

export type ClientPhaseRow = {
  project: Project;
  phase: ProjectPhase;
};

export type PhaseStatusFilter = "ALL" | PhaseStatus;

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  LOCKED: "Locked",
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  AWAITING_APPROVAL: "Awaiting Approval",
  CHANGES_REQUESTED: "Changes Requested",
  APPROVED: "Approved",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PENDING_REVIEW: "Pending Review",
  APPROVED_AWAITING_DEPOSIT: "Approved Awaiting Deposit",
  DEPOSIT_PENDING_CONFIRMATION: "Deposit Pending Confirmation",
  ACTIVE: "Active",
  AWAITING_BALANCE: "Awaiting Balance",
  BALANCE_PENDING_CONFIRMATION: "Balance Pending Confirmation",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export const PHASE_STATUS_ORDER: Record<PhaseStatus, number> = {
  AWAITING_APPROVAL: 0,
  CHANGES_REQUESTED: 1,
  IN_PROGRESS: 2,
  NOT_STARTED: 3,
  LOCKED: 4,
  APPROVED: 5,
};

export function phaseStatusTone(status: PhaseStatus) {
  if (status === "APPROVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "AWAITING_APPROVAL") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "CHANGES_REQUESTED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "LOCKED") {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  return "border-blue-200 bg-blue-50 text-[#0064E0]";
}

export function phaseIconTone(status: PhaseStatus) {
  if (status === "APPROVED") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (status === "AWAITING_APPROVAL") {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  if (status === "CHANGES_REQUESTED") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (status === "LOCKED") {
    return "bg-slate-50 text-slate-500 ring-slate-200";
  }

  return "bg-blue-50 text-[#0064E0] ring-blue-100";
}

export function projectStatusTone(status: ProjectStatus) {
  if (status === "ACTIVE" || status === "COMPLETED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    status === "APPROVED_AWAITING_DEPOSIT" ||
    status === "DEPOSIT_PENDING_CONFIRMATION" ||
    status === "AWAITING_BALANCE" ||
    status === "BALANCE_PENDING_CONFIRMATION" ||
    status === "PENDING_REVIEW"
  ) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "REJECTED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function phaseProgress(phase: ProjectPhase) {
  if (!phase.deliverables.length) {
    return phase.status === "APPROVED" ? 100 : 0;
  }

  return Math.round(
    (phase.deliverables.filter((deliverable) => deliverable.status === "APPROVED").length /
      phase.deliverables.length) *
      100,
  );
}

export function approvedDeliverableCount(phase: ProjectPhase) {
  return phase.deliverables.filter((deliverable) => deliverable.status === "APPROVED").length;
}

export function formatPhaseDate(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function phaseMatchesSearch(row: ClientPhaseRow, query: string) {
  const value = query.trim().toLowerCase();

  if (!value) return true;

  const content = [
    row.phase.title,
    row.phase.description,
    row.phase.status,
    row.project.title,
    row.project.businessName,
    row.project.projectCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return content.includes(value);
}

export function isProjectPhaseLocked(project: Project) {
  return project.status !== "ACTIVE" && project.status !== "AWAITING_BALANCE";
}

export function getCurrentPhase(project: Project) {
  return (
    project.phases.find((phase) =>
      ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED", "NOT_STARTED"].includes(
        phase.status,
      ),
    ) ??
    project.phases.find((phase) => phase.status === "LOCKED") ??
    project.phases[0]
  );
}

export function getCurrentPhasePosition(rows: ClientPhaseRow[]) {
  if (!rows.length) return "0 of 0";

  const current =
    rows.find((row) =>
      ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED", "NOT_STARTED"].includes(
        row.phase.status,
      ),
    ) ?? rows.find((row) => row.phase.status === "LOCKED") ?? rows[0];

  const index = rows.findIndex((row) => row.phase.id === current.phase.id);

  return `${Math.max(index + 1, 1)} of ${rows.length}`;
}

export function getPhaseDescription(phase: ProjectPhase) {
  if (phase.status === "LOCKED") {
    return "Complete previous phase first to unlock.";
  }

  return phase.description || "Project delivery phase.";
}
