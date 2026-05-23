import type {
  Deliverable,
  DeliverableStatus,
  PhaseMessage,
  PhaseStatus,
  Project,
  ProjectPhase,
  Role,
  User,
} from "@/lib/types";

export type ClientThreadMessage = PhaseMessage & {
  author?: {
    id?: string;
    name?: string;
    role?: Role;
  } | null;
};

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

export const ROLE_LABELS: Record<Role | "SYSTEM", string> = {
  CLIENT: "Client",
  STAFF: "Staff",
  PROJECT_MANAGER: "Project Manager",
  SUPER_ADMIN: "Admin",
  SYSTEM: "System",
};

export function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
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

export function formatPhaseDateTime(value?: string | Date) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export function deliverableStatusTone(status: DeliverableStatus) {
  if (status === "APPROVED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "READY_FOR_REVIEW") return "border-blue-200 bg-blue-50 text-[#0064E0]";
  if (status === "NEEDS_CHANGES") return "border-red-200 bg-red-50 text-red-700";

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function visibleDeliverablesForClient(phase: ProjectPhase) {
  return phase.deliverables.filter((deliverable) => deliverable.visibleToClient);
}

export function getAssignee(phase: ProjectPhase, users: User[]) {
  if (!phase.assignedStaffId) return undefined;

  return users.find((user) => user.id === phase.assignedStaffId);
}

export function getSenderName(message: ClientThreadMessage) {
  return (
    message.author?.name ||
    message.senderName ||
    (message.senderRole === "SYSTEM" ? "Octalve System" : "Workspace User")
  );
}

export function getSenderRole(message: ClientThreadMessage) {
  return (message.senderRole || message.author?.role || "SYSTEM") as Role | "SYSTEM";
}

export function userInitial(value?: string) {
  return (value || "O").trim().slice(0, 1).toUpperCase();
}

export function deliverableLinkLabel(deliverable: Deliverable) {
  if (!deliverable.link) return "No link";

  return deliverable.linkType || "Open link";
}

export function canClientApprovePhase(phase: ProjectPhase) {
  return phase.status === "AWAITING_APPROVAL";
}

export function getBackHref(project?: Project) {
  return project ? `/client/projects/${project.id}` : "/client/phases";
}
