import type { Project, ProjectPhase } from "@/lib/types";

export type ApprovalRow = {
  project: Project;
  phase: ProjectPhase;
};

export type ApprovalStatusFilter = "awaiting" | "approved" | "changes" | "all";

export function approvalStatusLabel(status: ProjectPhase["status"]) {
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
