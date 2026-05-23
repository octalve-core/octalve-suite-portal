import type { PackageType, Project, ProjectRequest, ProjectStatus } from "@/lib/types";
import { getPackageCatalogItem, getPackageTitle } from "../../packageCatalog";

export type ProjectStatusFilter = "ALL" | ProjectStatus;
export type ProjectPackageFilter = "ALL" | PackageType;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PENDING_REVIEW: "Pending Review",
  APPROVED_AWAITING_DEPOSIT: "Awaiting Deposit",
  DEPOSIT_PENDING_CONFIRMATION: "Deposit Pending",
  ACTIVE: "Active",
  AWAITING_BALANCE: "Awaiting Balance",
  BALANCE_PENDING_CONFIRMATION: "Balance Pending",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export const REQUEST_STATUS_LABELS: Record<ProjectRequest["status"], string> = {
  PENDING_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  INFO_REQUESTED: "Info Requested",
};

export function formatProjectDate(value?: string) {
  if (!value) return "No target date";

  const date = new Date(value.includes("T") ? value : `${value}T23:59:59.999`);

  if (Number.isNaN(date.getTime())) return "No target date";

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function projectProgress(project: Project) {
  if (!project.phases.length) return 0;

  return Math.round(
    (project.phases.filter((phase) => phase.status === "APPROVED").length /
      project.phases.length) *
      100,
  );
}

export function approvedPhaseCount(project: Project) {
  return project.phases.filter((phase) => phase.status === "APPROVED").length;
}

export function pendingApprovalCount(project: Project) {
  return project.phases.filter((phase) => phase.status === "AWAITING_APPROVAL").length;
}

export function unpaidPaymentCount(project: Project) {
  return project.payments.filter((payment) => payment.status === "UNPAID").length;
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

  return "border-blue-200 bg-blue-50 text-[#0064E0]";
}

export function requestStatusTone(status: ProjectRequest["status"]) {
  if (status === "APPROVED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "REJECTED") return "border-red-200 bg-red-50 text-red-700";
  if (status === "INFO_REQUESTED") return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-blue-200 bg-blue-50 text-[#0064E0]";
}

export function packageBadgeStyle(packageType: PackageType) {
  const item = getPackageCatalogItem(packageType);

  return {
    color: item.color,
    borderColor: `${item.color}38`,
    backgroundColor: `${item.color}10`,
  };
}

export function rowMatchesProjectSearch(project: Project, query: string) {
  const value = query.trim().toLowerCase();

  if (!value) return true;

  return [
    project.title,
    project.businessName,
    project.clientEmail,
    project.projectCode,
    project.status,
    getPackageTitle(project.packageType),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(value);
}
