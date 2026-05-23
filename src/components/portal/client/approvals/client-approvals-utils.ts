import type { Project, ProjectPhase } from "@/lib/types";

export type ApprovalRow = {
  project: Project;
  phase: ProjectPhase;
};

export type ApprovalStatusFilter = "awaiting" | "approved" | "changes" | "all";
export type ApprovalSortOption = "NEWEST" | "OLDEST" | "PROJECT" | "STATUS";

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatusFilter, string> = {
  all: "All Statuses",
  awaiting: "Awaiting Review",
  approved: "Approved",
  changes: "Changes Requested",
};

export function approvalStatusLabel(status: ProjectPhase["status"]) {
  if (status === "AWAITING_APPROVAL") return "Awaiting Review";
  if (status === "APPROVED") return "Approved";
  if (status === "CHANGES_REQUESTED") return "Changes Requested";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export function approvalTone(status: ProjectPhase["status"]) {
  if (status === "APPROVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "CHANGES_REQUESTED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "AWAITING_APPROVAL") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function approvalIconTone(status: ProjectPhase["status"]) {
  if (status === "APPROVED") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (status === "CHANGES_REQUESTED") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (status === "AWAITING_APPROVAL") {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  return "bg-slate-50 text-slate-500 ring-slate-200";
}

export function approvalCardAccent(status: ProjectPhase["status"]) {
  if (status === "APPROVED") return "border-l-[#29BE3E]";
  if (status === "CHANGES_REQUESTED") return "border-l-[#E61525]";
  if (status === "AWAITING_APPROVAL") return "border-l-[#FC7E24]";

  return "border-l-slate-300";
}

export function approvalActionLabel(status: ProjectPhase["status"]) {
  if (status === "AWAITING_APPROVAL") return "Review approval";
  if (status === "APPROVED") return "View details";
  if (status === "CHANGES_REQUESTED") return "View details";

  return "View details";
}

export function approvalMatchesSearch(row: ApprovalRow, query: string) {
  const value = query.trim().toLowerCase();

  if (!value) return true;

  return [
    row.phase.title,
    row.phase.description,
    row.phase.status,
    row.project.title,
    row.project.businessName,
    row.project.projectCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(value);
}

export function filterApprovalStatus(row: ApprovalRow, filter: ApprovalStatusFilter) {
  if (filter === "all") return true;
  if (filter === "awaiting") return row.phase.status === "AWAITING_APPROVAL";
  if (filter === "approved") return row.phase.status === "APPROVED";
  return row.phase.status === "CHANGES_REQUESTED";
}

export function getApprovalDate(row: ApprovalRow) {
  if (row.phase.status === "APPROVED") {
    return row.phase.approvedAt || row.phase.approvalRequestedAt || row.project.createdAt;
  }

  return row.phase.approvalRequestedAt || row.phase.approvedAt || row.project.createdAt;
}

export function formatApprovalDate(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatApprovalTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function sortApprovalRows(rows: ApprovalRow[], sortBy: ApprovalSortOption) {
  return [...rows].sort((a, b) => {
    if (sortBy === "OLDEST") {
      return new Date(getApprovalDate(a)).getTime() - new Date(getApprovalDate(b)).getTime();
    }

    if (sortBy === "PROJECT") {
      return a.project.title.localeCompare(b.project.title);
    }

    if (sortBy === "STATUS") {
      return approvalStatusLabel(a.phase.status).localeCompare(
        approvalStatusLabel(b.phase.status),
      );
    }

    return new Date(getApprovalDate(b)).getTime() - new Date(getApprovalDate(a)).getTime();
  });
}
