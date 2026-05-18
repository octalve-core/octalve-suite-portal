"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  ChevronDown,
  Clock3,
  CreditCard,
  FileCheck2,
  Gauge,
  Layers3,
  Maximize2,
  MessageSquareText,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useApp } from "./AppContext";
import {
  Badge,
  Button,
  Input,
  formatNaira,
  projectProgress,
  statusLabel,
} from "./UI";

type ChatMessage = {
  from: "ai" | "me";
  text: string;
};

type WorkspaceIntent =
  | "summary"
  | "approvals"
  | "payments"
  | "next"
  | "deliverables"
  | "team"
  | "risk"
  | "help";

const adminSuggestions = [
  "Summarize workspace",
  "What needs admin attention?",
  "Explain payment status",
  "Show project risks",
];

const clientSuggestions = [
  "Summarize my project",
  "What should I approve?",
  "Explain my payments",
  "What is my next action?",
];

const staffSuggestions = [
  "Summarize my work",
  "What phase needs attention?",
  "Show pending deliverables",
  "What should I do next?",
];

function safeDate(value?: string) {
  if (!value) return "No date set";

  try {
    return new Date(value).toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "No date set";
  }
}

function asMoney(value?: number) {
  return formatNaira(Number.isFinite(value ?? 0) ? Number(value ?? 0) : 0);
}

function detectIntent(prompt: string): WorkspaceIntent {
  const lower = prompt.toLowerCase();

  if (
    lower.includes("approval") ||
    lower.includes("approve") ||
    lower.includes("review")
  ) {
    return "approvals";
  }

  if (
    lower.includes("payment") ||
    lower.includes("paid") ||
    lower.includes("deposit") ||
    lower.includes("balance") ||
    lower.includes("money")
  ) {
    return "payments";
  }

  if (
    lower.includes("deliverable") ||
    lower.includes("demo") ||
    lower.includes("link") ||
    lower.includes("preview")
  ) {
    return "deliverables";
  }

  if (
    lower.includes("team") ||
    lower.includes("staff") ||
    lower.includes("assign") ||
    lower.includes("workload")
  ) {
    return "team";
  }

  if (
    lower.includes("risk") ||
    lower.includes("stuck") ||
    lower.includes("delay") ||
    lower.includes("problem")
  ) {
    return "risk";
  }

  if (
    lower.includes("next") ||
    lower.includes("action") ||
    lower.includes("todo") ||
    lower.includes("what should")
  ) {
    return "next";
  }

  if (
    lower.includes("summarize") ||
    lower.includes("summary") ||
    lower.includes("overview") ||
    lower.includes("status")
  ) {
    return "summary";
  }

  return "help";
}

function projectHealth(project: any) {
  const progress = projectProgress(project);
  const awaiting = project.phases.filter(
    (phase: any) => phase.status === "AWAITING_APPROVAL",
  ).length;
  const changes = project.phases.filter(
    (phase: any) => phase.status === "CHANGES_REQUESTED",
  ).length;
  const pendingPayments = project.payments.filter(
    (payment: any) =>
      payment.status === "UNPAID" || payment.status === "PENDING_CONFIRMATION",
  ).length;

  if (changes > 0) return "Needs changes";
  if (awaiting > 0) return "Awaiting approval";
  if (pendingPayments > 0) return "Payment attention";
  if (progress >= 80) return "Near completion";
  if (progress >= 45) return "In progress";
  return "Early stage";
}

function summarizeProject(project: any) {
  const progress = projectProgress(project);
  const approved = project.phases.filter(
    (phase: any) => phase.status === "APPROVED",
  ).length;
  const awaiting = project.phases.filter(
    (phase: any) => phase.status === "AWAITING_APPROVAL",
  ).length;
  const activePhase =
    project.phases.find((phase: any) =>
      ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED"].includes(
        phase.status,
      ),
    ) ?? project.phases.find((phase: any) => phase.status !== "LOCKED");

  return [
    `${project.title} is ${progress}% complete.`,
    `Approved phases: ${approved}/${project.phases.length}.`,
    awaiting
      ? `${awaiting} phase(s) are awaiting approval.`
      : "No phase is currently awaiting approval.",
    activePhase
      ? `Current focus: ${activePhase.title} (${statusLabel(activePhase.status)}).`
      : "No active phase is available yet.",
    `Target date: ${safeDate(project.targetDate)}.`,
    `Health: ${projectHealth(project)}.`,
  ].join("\n");
}

function getRolePath(role?: string) {
  if (role === "SUPER_ADMIN") return "/admin";
  if (role === "CLIENT") return "/client";
  return "/staff";
}

export function AIAssistant() {
  const { currentUser, selectedProject, state, clientProjects } = useApp();

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");

  const role = currentUser?.role;
  const visibleProjects = role === "CLIENT" ? clientProjects : state.projects;
  const activeProject = selectedProject ?? visibleProjects[0];

  const stats = useMemo(() => {
    const phases = visibleProjects.flatMap((project) => project.phases);
    const payments = visibleProjects.flatMap((project) => project.payments);
    const deliverables = phases.flatMap((phase) => phase.deliverables);

    return {
      projects: visibleProjects.length,
      phases: phases.length,
      approvedPhases: phases.filter((phase) => phase.status === "APPROVED")
        .length,
      awaitingApprovals: phases.filter(
        (phase) => phase.status === "AWAITING_APPROVAL",
      ).length,
      changeRequests: phases.filter(
        (phase) => phase.status === "CHANGES_REQUESTED",
      ).length,
      unpaidPayments: payments.filter((payment) => payment.status === "UNPAID")
        .length,
      pendingPayments: payments.filter(
        (payment) => payment.status === "PENDING_CONFIRMATION",
      ).length,
      confirmedPayments: payments.filter(
        (payment) => payment.status === "CONFIRMED",
      ).length,
      deliverables: deliverables.length,
      readyDeliverables: deliverables.filter(
        (deliverable) => deliverable.status === "READY_FOR_REVIEW",
      ).length,
      draftDeliverables: deliverables.filter(
        (deliverable) => deliverable.status === "DRAFT",
      ).length,
    };
  }, [visibleProjects]);

  const suggestions = useMemo(() => {
    if (role === "SUPER_ADMIN") return adminSuggestions;
    if (role === "CLIENT") return clientSuggestions;
    return staffSuggestions;
  }, [role]);

  const intro = useMemo(() => {
    const firstName = currentUser?.name?.split(" ")[0] ?? "there";
    const projectLine = activeProject
      ? `I am currently watching ${activeProject.title}.`
      : "No active project is selected yet.";

    return `Hi ${firstName}. I can help you read the workspace, explain approvals, payments, deliverables, risks, and next actions. ${projectLine}`;
  }, [activeProject, currentUser?.name]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "ai",
      text: intro,
    },
  ]);

  function workspaceSummary() {
    if (!visibleProjects.length) {
      return "There are no projects visible in this workspace yet.\nNext action: create or approve a project so delivery tracking can begin.";
    }

    const lines = [
      `Workspace summary`,
      `${stats.projects} project(s), ${stats.phases} phase(s), ${stats.deliverables} deliverable(s).`,
      `${stats.approvedPhases} phase(s) approved and ${stats.awaitingApprovals} awaiting approval.`,
      `${stats.unpaidPayments} unpaid payment(s), ${stats.pendingPayments} payment(s) awaiting confirmation.`,
    ];

    if (activeProject) {
      lines.push("");
      lines.push(`Selected project`);
      lines.push(summarizeProject(activeProject));
    }

    return lines.join("\n");
  }

  function approvalSummary() {
    const approvalPhases = visibleProjects.flatMap((project) =>
      project.phases
        .filter((phase) => phase.status === "AWAITING_APPROVAL")
        .map((phase) => ({ project, phase })),
    );

    if (!approvalPhases.length) {
      return "No phase is currently awaiting approval.\nNext action: keep delivery moving by checking phases in progress and pending deliverables.";
    }

    const top = approvalPhases.slice(0, 5).map(({ project, phase }, index) => {
      return `${index + 1}. ${phase.title} — ${project.title}`;
    });

    const roleAdvice =
      role === "CLIENT"
        ? "Open Client Approvals and approve the work or request changes with a clear note."
        : "Open the phase detail page, review the deliverables, and follow up with the client if needed.";

    return [
      `${approvalPhases.length} phase(s) need approval attention.`,
      ...top,
      "",
      `Recommended action: ${roleAdvice}`,
    ].join("\n");
  }

  function paymentSummary() {
    const rows = visibleProjects.flatMap((project) =>
      project.payments.map((payment) => ({ project, payment })),
    );

    if (!rows.length) {
      return "No payment records are available yet.\nPayment records will appear when a project is approved or created with a payment structure.";
    }

    const unpaid = rows.filter(({ payment }) => payment.status === "UNPAID");
    const pending = rows.filter(
      ({ payment }) => payment.status === "PENDING_CONFIRMATION",
    );
    const confirmed = rows.filter(
      ({ payment }) => payment.status === "CONFIRMED",
    );

    const pendingValue = pending.reduce(
      (total, { payment }) => total + payment.amount,
      0,
    );
    const unpaidValue = unpaid.reduce(
      (total, { payment }) => total + payment.amount,
      0,
    );

    const nextLine =
      role === "CLIENT"
        ? unpaid.length
          ? "Next action: open Payments and click “I Have Paid” after making transfer."
          : pending.length
            ? "Next action: wait for admin confirmation or contact support if confirmation delays."
            : "Next action: no payment action is currently required."
        : pending.length
          ? "Next action: open Admin Payments and confirm or reject submitted payment confirmations."
          : unpaid.length
            ? "Next action: follow up with clients who still have unpaid records."
            : "Next action: no urgent payment action is currently required.";

    return [
      `Payment summary`,
      `${unpaid.length} unpaid payment(s), worth ${asMoney(unpaidValue)}.`,
      `${pending.length} payment(s) awaiting confirmation, worth ${asMoney(pendingValue)}.`,
      `${confirmed.length} payment(s) confirmed.`,
      nextLine,
    ].join("\n");
  }

  function deliverableSummary() {
    const rows = visibleProjects.flatMap((project) =>
      project.phases.flatMap((phase) =>
        phase.deliverables.map((deliverable) => ({
          project,
          phase,
          deliverable,
        })),
      ),
    );

    if (!rows.length) {
      return "No deliverables have been added yet.\nNext action: staff/admin should add deliverable links inside the relevant phase.";
    }

    const ready = rows.filter(
      ({ deliverable }) => deliverable.status === "READY_FOR_REVIEW",
    );
    const draft = rows.filter(({ deliverable }) => deliverable.status === "DRAFT");
    const approved = rows.filter(
      ({ deliverable }) => deliverable.status === "APPROVED",
    );

    const samples = rows.slice(0, 4).map(({ project, phase, deliverable }, index) => {
      return `${index + 1}. ${deliverable.name} — ${phase.title}, ${project.title} (${statusLabel(deliverable.status)})`;
    });

    return [
      `Deliverable summary`,
      `${rows.length} total deliverable(s).`,
      `${draft.length} draft, ${ready.length} ready for review, ${approved.length} approved.`,
      "",
      ...samples,
      "",
      "Recommended action: keep links updated and ensure client-visible deliverables are clean before approval.",
    ].join("\n");
  }

  function teamSummary() {
    const team = state.users.filter(
      (user) => user.role === "STAFF" || user.role === "PROJECT_MANAGER",
    );

    const phases = state.projects.flatMap((project) => project.phases);
    const assigned = phases.filter((phase) => phase.assignedStaffId);
    const unassigned = phases.filter(
      (phase) => !phase.assignedStaffId && phase.status !== "LOCKED",
    );

    if (role === "CLIENT") {
      return "Team details are managed by Octalve. For delivery support, use the Support page or send a phase message directly.";
    }

    return [
      `Team summary`,
      `${team.length} delivery team member(s).`,
      `${assigned.length} assigned phase(s).`,
      `${unassigned.length} unassigned open phase(s).`,
      unassigned.length
        ? "Recommended action: assign unassigned phases before they delay delivery."
        : "Recommended action: current open phases already have assignment coverage.",
    ].join("\n");
  }

  function riskSummary() {
    const riskyProjects = visibleProjects.filter((project) => {
      const hasChangeRequest = project.phases.some(
        (phase) => phase.status === "CHANGES_REQUESTED",
      );
      const hasPendingPayment = project.payments.some(
        (payment) =>
          payment.status === "UNPAID" || payment.status === "PENDING_CONFIRMATION",
      );
      const hasAwaitingApproval = project.phases.some(
        (phase) => phase.status === "AWAITING_APPROVAL",
      );

      return hasChangeRequest || hasPendingPayment || hasAwaitingApproval;
    });

    if (!riskyProjects.length) {
      return "I do not see major delivery blockers right now.\nKeep monitoring approvals, deliverables, and payments to prevent delays.";
    }

    const lines = riskyProjects.slice(0, 5).map((project, index) => {
      return `${index + 1}. ${project.title} — ${projectHealth(project)}`;
    });

    return [
      `${riskyProjects.length} project(s) need attention.`,
      ...lines,
      "",
      "Recommended action: start with projects that have change requests, pending approvals, or unpaid/pending payments.",
    ].join("\n");
  }

  function nextAction() {
    if (role === "CLIENT") {
      if (stats.awaitingApprovals > 0) {
        return "Your next action is to open Approvals and review the submitted phase. Approve it if the work is okay, or request changes with a clear note.";
      }

      if (stats.unpaidPayments > 0) {
        return "Your next action is to open Payments, make the required transfer, then click “I Have Paid” for the correct payment record.";
      }

      return "No urgent action is required right now. You can check Projects or Support if you want to follow up on delivery.";
    }

    if (role === "SUPER_ADMIN") {
      const pendingRequests = state.requests.filter(
        (request) => request.status === "PENDING_REVIEW",
      ).length;

      if (pendingRequests > 0) {
        return `Your next action is to review ${pendingRequests} pending project request(s) and either approve or reject them.`;
      }

      if (stats.pendingPayments > 0) {
        return `Your next action is to confirm or reject ${stats.pendingPayments} pending payment confirmation(s).`;
      }

      if (stats.awaitingApprovals > 0) {
        return `Your next action is to monitor ${stats.awaitingApprovals} phase(s) awaiting approval and follow up with clients.`;
      }

      return "No urgent admin action is visible. Review projects, team workload, and templates for operational improvement.";
    }

    if (stats.changeRequests > 0) {
      return `Your next action is to resolve ${stats.changeRequests} change request(s) and resubmit affected phases for approval.`;
    }

    if (stats.readyDeliverables > 0) {
      return `Your next action is to check ${stats.readyDeliverables} ready deliverable(s) and move the relevant phases toward approval.`;
    }

    return "Your next action is to open assigned phases and update deliverables or messages where work is active.";
  }

  function getContextualReply(prompt: string) {
    const intent = detectIntent(prompt);

    if (intent === "summary") return workspaceSummary();
    if (intent === "approvals") return approvalSummary();
    if (intent === "payments") return paymentSummary();
    if (intent === "deliverables") return deliverableSummary();
    if (intent === "team") return teamSummary();
    if (intent === "risk") return riskSummary();
    if (intent === "next") return nextAction();

    return [
      "I can help with:",
      "• Workspace or project summary",
      "• Pending approvals",
      "• Payment status",
      "• Deliverables and links",
      "• Staff assignment and workload",
      "• Project risks and next actions",
      "",
      "Try asking: “What needs attention?” or “Summarize my project.”",
    ].join("\n");
  }

  function send(text?: string) {
    const prompt = (text ?? input).trim();

    if (!prompt) return;

    setMessages((previous) => [
      ...previous.slice(-7),
      { from: "me", text: prompt },
      { from: "ai", text: getContextualReply(prompt) },
    ]);

    setInput("");
    setOpen(true);
  }

  return (
    <>
      {open && (
        <div className={expanded ? "ai-panel expanded" : "ai-panel"}>
          <div className="ai-header">
            <div>
              <span>
                <Bot size={17} /> Octalve AI
              </span>
              <strong>Workspace assistant</strong>
            </div>

            <div className="ai-header-actions">
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-label={expanded ? "Collapse assistant" : "Expand assistant"}
              >
                {expanded ? <ChevronDown size={17} /> : <Maximize2 size={17} />}
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="ai-context-grid">
            <div>
              <Gauge size={15} />
              <strong>{stats.projects}</strong>
              <span>Projects</span>
            </div>
            <div>
              <Layers3 size={15} />
              <strong>{stats.awaitingApprovals}</strong>
              <span>Approvals</span>
            </div>
            <div>
              <CreditCard size={15} />
              <strong>{stats.pendingPayments + stats.unpaidPayments}</strong>
              <span>Payments</span>
            </div>
            <div>
              <FileCheck2 size={15} />
              <strong>{stats.deliverables}</strong>
              <span>Deliverables</span>
            </div>
          </div>

          <div className="ai-body">
            <div className="ai-suggestions">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => send(item)}
                  className="badge badge-blue"
                >
                  <Sparkles size={13} />
                  {item}
                </button>
              ))}
            </div>

            <div className="ai-thread">
              {messages.map((message, index) => (
                <div
                  key={`${message.from}-${index}`}
                  className={`ai-message ${message.from === "me" ? "mine" : ""}`}
                >
                  <div>
                    {message.text.split("\n").map((line, lineIndex) =>
                      line ? (
                        <p key={lineIndex}>{line}</p>
                      ) : (
                        <br key={lineIndex} />
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            className="ai-input"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about projects, payments, approvals..."
            />
            <Button type="submit" disabled={!input.trim()}>
              <Send size={16} />
            </Button>
          </form>
        </div>
      )}

      <div className="ai-fab">
        <Button onClick={() => setOpen((value) => !value)}>
          <MessageSquareText size={17} /> AI Assistant
        </Button>
      </div>
    </>
  );
}
