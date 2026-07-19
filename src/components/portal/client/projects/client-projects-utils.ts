import type {
  PackageType,
  Project,
  ProjectPhase,
  ProjectRequest,
  ProjectStatus,
} from "@/lib/types";
import { getPackageCatalogItem, getPackageTitle } from "../../packageCatalog";

export type ProjectStatusFilter = "ALL" | ProjectStatus;
export type ProjectPackageFilter = "ALL" | PackageType;
export type ProjectSortOption =
  | "NEWEST"
  | "OLDEST"
  | "PROGRESS_HIGH"
  | "PROGRESS_LOW"
  | "TITLE";

export type ProjectActivityItem = {
  id: string;
  projectId: string;
  projectTitle: string;
  label: string;
  description: string;
  date?: string;
  tone: "blue" | "green" | "orange" | "purple" | "slate";
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
  DEACTIVATED: "Deactivated",
};

export const REQUEST_STATUS_LABELS: Record<ProjectRequest["status"], string> = {
  PENDING_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  INFO_REQUESTED: "Info Requested",
};

export function formatProjectDate(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value.includes("T") ? value : `${value}T23:59:59.999`);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatProjectDateTime(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

export function awaitingDepositCount(projects: Project[]) {
  return projects.filter((project) =>
    ["APPROVED_AWAITING_DEPOSIT", "DEPOSIT_PENDING_CONFIRMATION"].includes(
      project.status,
    ),
  ).length;
}

export function inProgressProjectCount(projects: Project[]) {
  return projects.filter(
    (project) =>
      project.status === "ACTIVE" &&
      project.phases.some((phase) =>
        ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED"].includes(
          phase.status,
        ),
      ),
  ).length;
}

export function pendingApprovalCount(project: Project) {
  return project.phases.filter((phase) => phase.status === "AWAITING_APPROVAL")
    .length;
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
    return "border-blue-200 bg-blue-50 text-[#0064E0]";
  }

  if (status === "REJECTED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
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

export function getCurrentPhase(project: Project): ProjectPhase | undefined {
  return (
    project.phases.find((phase) =>
      ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED"].includes(
        phase.status,
      ),
    ) ??
    project.phases.find((phase) => phase.status !== "APPROVED") ??
    project.phases[0]
  );
}

export function latestProjectActivityDate(project: Project) {
  const values = [
    project.createdAt,
    ...project.phases.flatMap((phase) => [
      phase.approvalRequestedAt,
      phase.approvedAt,
      ...phase.messages.map((message) => message.createdAt),
    ]),
    ...project.payments.flatMap((payment) => [
      payment.clientMarkedPaidAt,
      payment.confirmedAt,
    ]),
  ].filter(Boolean) as string[];

  const timestamps = values
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  if (!timestamps.length) return project.createdAt;

  return new Date(Math.max(...timestamps)).toISOString();
}

export function sortProjects(
  projects: Project[],
  sortBy: ProjectSortOption,
) {
  return [...projects].sort((a, b) => {
    if (sortBy === "OLDEST") {
      return (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    if (sortBy === "PROGRESS_HIGH") {
      return projectProgress(b) - projectProgress(a);
    }

    if (sortBy === "PROGRESS_LOW") {
      return projectProgress(a) - projectProgress(b);
    }

    if (sortBy === "TITLE") {
      return a.title.localeCompare(b.title);
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function buildRecentProjectActivity(projects: Project[]) {
  const items: ProjectActivityItem[] = [];

  projects.forEach((project) => {
    items.push({
      id: `created-${project.id}`,
      projectId: project.id,
      projectTitle: project.title,
      label: "Project created",
      description: project.businessName,
      date: project.createdAt,
      tone: "purple",
    });

    const currentPhase = getCurrentPhase(project);

    if (currentPhase) {
      items.push({
        id: `phase-${currentPhase.id}`,
        projectId: project.id,
        projectTitle: project.title,
        label: `${currentPhase.title}`,
        description: "Current phase",
        date:
          currentPhase.approvalRequestedAt ||
          currentPhase.approvedAt ||
          project.createdAt,
        tone:
          currentPhase.status === "APPROVED"
            ? "green"
            : currentPhase.status === "AWAITING_APPROVAL"
              ? "orange"
              : "blue",
      });
    }

    const latestPayment = [...project.payments]
      .filter((payment) => payment.clientMarkedPaidAt || payment.confirmedAt)
      .sort(
        (a, b) =>
          new Date(b.confirmedAt || b.clientMarkedPaidAt || 0).getTime() -
          new Date(a.confirmedAt || a.clientMarkedPaidAt || 0).getTime(),
      )[0];

    if (latestPayment) {
      items.push({
        id: `payment-${latestPayment.id}`,
        projectId: project.id,
        projectTitle: project.title,
        label:
          latestPayment.status === "CONFIRMED"
            ? "Payment confirmed"
            : "Payment activity",
        description: latestPayment.reference,
        date: latestPayment.confirmedAt || latestPayment.clientMarkedPaidAt,
        tone: latestPayment.status === "CONFIRMED" ? "green" : "orange",
      });
    }
  });

  return items
    .sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    )
    .slice(0, 4);
}
