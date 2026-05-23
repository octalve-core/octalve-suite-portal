import type { Project, ProjectPhase, ProjectStatus, User } from "@/lib/types";

export const SUPPORT_EMAIL = "info@octalve.com";

export type SupportFaqItem = {
  question: string;
  answer: string;
};

export type SupportResourceItem = {
  title: string;
  description: string;
  href: string;
  label: string;
};

export const SUPPORT_FAQS: SupportFaqItem[] = [
  {
    question: "How do I approve a phase?",
    answer:
      "Open Approvals, review the submitted deliverables and messages, then approve the phase or request changes.",
  },
  {
    question: "Where do I send feedback?",
    answer:
      "Open the relevant phase detail page and use the message thread. That keeps feedback tied to the correct project phase.",
  },
  {
    question: "How do I make payment?",
    answer:
      "Open Payments, choose an enabled payment option, then complete payment through bank transfer, online checkout, or wallet if available.",
  },
  {
    question: "Where are my deliverable links?",
    answer:
      "Open the phase detail page. Client-visible deliverables and links are listed inside the relevant phase workspace.",
  },
  {
    question: "What should I do if payment was deducted but not confirmed?",
    answer:
      "Do not retry immediately. Contact support with the payment reference, gateway used, amount, and project code.",
  },
];

export const SUPPORT_RESOURCES: SupportResourceItem[] = [
  {
    title: "Project Workspace Guide",
    description: "Understand projects, phases, approvals, messages and deliverables.",
    href: "/client/projects",
    label: "Open Projects",
  },
  {
    title: "Approval Best Practices",
    description: "Review submitted work carefully before approving or requesting changes.",
    href: "/client/approvals",
    label: "Open Approvals",
  },
  {
    title: "Payments & Wallet",
    description: "Track payments, wallet funding, confirmation and project billing status.",
    href: "/client/payments",
    label: "Open Payments",
  },
];

export function getActiveSupportPhase(project?: Project): ProjectPhase | undefined {
  return (
    project?.phases.find((phase) =>
      ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED"].includes(
        phase.status,
      ),
    ) ?? project?.phases.find((phase) => phase.status !== "LOCKED")
  );
}

export function getProjectManager(project: Project | undefined, users: User[]) {
  if (!project?.projectManagerId) return undefined;

  return users.find((user) => user.id === project.projectManagerId);
}

export function getProjectStatusLabel(status?: ProjectStatus) {
  if (!status) return "No active project";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

export function getProjectStatusTone(status?: ProjectStatus) {
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

export function buildSupportMailto({
  email,
  project,
  phase,
}: {
  email: string;
  project?: Project;
  phase?: ProjectPhase;
}) {
  const subject = project
    ? `Support request for ${project.title}`
    : "Octalve Workspace support request";

  const body = project
    ? [
        "Hello Octalve Team,",
        "",
        `I need help with ${project.title}.`,
        "",
        `Project Code: ${project.projectCode}`,
        phase ? `Active Phase: ${phase.title}` : undefined,
        "",
        "Issue:",
      ]
        .filter(Boolean)
        .join("\n")
    : ["Hello Octalve Team,", "", "I need help with my workspace.", "", "Issue:"].join(
        "\n",
      );

  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function formatSupportDate(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value.includes("T") ? value : `${value}T23:59:59.999`);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
