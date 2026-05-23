import type {
  Deliverable,
  DeliverableStatus,
  Project,
  ProjectPhase,
  PhaseStatus,
  Role,
  User,
} from "@/lib/types";

export type ProjectDetailTab = "phases" | "team" | "notes";

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  LOCKED: "Locked",
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  AWAITING_APPROVAL: "Awaiting Approval",
  CHANGES_REQUESTED: "Changes Requested",
  APPROVED: "Approved",
};

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
  DRAFT: "Draft",
  READY_FOR_REVIEW: "Ready For Review",
  NEEDS_CHANGES: "Needs Changes",
  APPROVED: "Approved",
};

export function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

export function formatDetailDate(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value.includes("T") ? value : `${value}T23:59:59.999`);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function daysUntil(value?: string) {
  if (!value) return "No target date";

  const target = new Date(value.includes("T") ? value : `${value}T23:59:59.999`);
  const now = new Date();

  if (Number.isNaN(target.getTime())) return "No target date";

  const days = Math.ceil((target.getTime() - now.getTime()) / 86400000);

  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";

  return `${days} day${days === 1 ? "" : "s"} left`;
}

export function phaseProgress(phase: ProjectPhase) {
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

export function phaseStatusTone(status: PhaseStatus) {
  if (status === "APPROVED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "AWAITING_APPROVAL") return "border-orange-200 bg-orange-50 text-orange-700";
  if (status === "CHANGES_REQUESTED") return "border-red-200 bg-red-50 text-red-700";
  if (status === "LOCKED") return "border-slate-200 bg-slate-100 text-slate-600";

  return "border-blue-200 bg-blue-50 text-[#0064E0]";
}

export function phaseAccent(status: PhaseStatus) {
  if (status === "APPROVED") return "border-l-[#29BE3E]";
  if (status === "AWAITING_APPROVAL") return "border-l-[#FC7E24]";
  if (status === "CHANGES_REQUESTED") return "border-l-[#E61525]";
  if (status === "LOCKED") return "border-l-slate-400";

  return "border-l-[#0064E0]";
}

export function phaseNumberTone(status: PhaseStatus) {
  if (status === "APPROVED") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "AWAITING_APPROVAL") return "bg-orange-50 text-orange-700 ring-orange-100";
  if (status === "CHANGES_REQUESTED") return "bg-red-50 text-red-700 ring-red-100";
  if (status === "LOCKED") return "bg-slate-50 text-slate-600 ring-slate-200";

  return "bg-blue-50 text-[#0064E0] ring-blue-100";
}

export function deliverableStatusTone(status: DeliverableStatus) {
  if (status === "APPROVED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "READY_FOR_REVIEW") return "border-blue-200 bg-blue-50 text-[#0064E0]";
  if (status === "NEEDS_CHANGES") return "border-red-200 bg-red-50 text-red-700";

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function visibleDeliverablesForClient(phase: ProjectPhase) {
  return phase.deliverables.filter((deliverable) => deliverable.visibleToClient);
}

export function getManager(project: Project, users: User[]) {
  if (!project.projectManagerId) return undefined;

  return users.find((user) => user.id === project.projectManagerId);
}

export function getAssignedUsers(project: Project, users: User[]) {
  const map = new Map<string, User>();

  project.phases.forEach((phase) => {
    const user = users.find((item) => item.id === phase.assignedStaffId);
    if (user) map.set(user.id, user);
  });

  return Array.from(map.values());
}

export function userInitial(value?: string) {
  return (value || "O").trim().slice(0, 1).toUpperCase();
}

export function roleLabel(role?: Role) {
  if (!role) return "Workspace Member";

  return role
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export function deliverableLinkLabel(deliverable: Deliverable) {
  if (!deliverable.link) return "No link";

  return deliverable.linkType || "Open link";
}
