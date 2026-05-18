"use client";

import Link from "next/link";
import type React from "react";
import {
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Layers3,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import type { Project, ProjectPayment, ProjectPhase, User } from "@/lib/types";
import { ProjectDateCountdown } from "./ProjectDateCountdown";
import {
  Badge,
  Button,
  Card,
  formatNaira,
  packageClass,
  ProgressBar,
  projectProgress,
  statusClass,
  statusLabel,
} from "./UI";

type Tone = "blue" | "green" | "orange" | "red" | "purple" | "slate";

function phaseProgress(phase: ProjectPhase) {
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

function progressTone(value: number): Tone {
  if (value >= 80) return "green";
  if (value >= 45) return "blue";
  if (value > 0) return "orange";
  return "slate";
}

function phaseTone(status: ProjectPhase["status"]): Tone {
  if (status === "APPROVED") return "green";
  if (status === "AWAITING_APPROVAL") return "orange";
  if (status === "CHANGES_REQUESTED") return "red";
  if (status === "LOCKED") return "slate";
  return "blue";
}

function paymentTone(status: ProjectPayment["status"]): Tone {
  if (status === "CONFIRMED") return "green";
  if (status === "PENDING_CONFIRMATION") return "orange";
  if (status === "REJECTED") return "red";
  return "blue";
}

function iconForPhase(status: ProjectPhase["status"]) {
  if (status === "APPROVED") return <CheckCircle2 size={18} />;
  if (status === "LOCKED") return <LockKeyhole size={18} />;
  if (status === "AWAITING_APPROVAL") return <Clock3 size={18} />;
  return <Layers3 size={18} />;
}

export function ProjectSummaryCard({
  project,
  href,
  footer,
}: {
  project: Project;
  href: string;
  footer?: React.ReactNode;
}) {
  const progress = projectProgress(project);
  const approved = project.phases.filter((phase) => phase.status === "APPROVED").length;

  return (
    <Link href={href} className="workspace-card-link">
      <Card className="workspace-card workspace-project-card">
        <div className="workspace-card-top">
          <span className={`workspace-card-icon tone-${progressTone(progress)}`}>
            <BriefcaseBusiness size={19} />
          </span>

          <div className="workspace-card-badges">
            <Badge className={packageClass(project.packageType)}>
              {project.packageType}
            </Badge>
            <Badge className={statusClass(project.status)}>
              {statusLabel(project.status)}
            </Badge>
          </div>
        </div>

        <div className="workspace-card-main">
          <h3>{project.title}</h3>
          <p>{project.businessName}</p>
        </div>

        <div className="workspace-card-meta">
          <div>
            <span>Progress</span>
            <strong>{progress}%</strong>
          </div>
          <div>
            <span>Phases</span>
            <strong>
              {approved}/{project.phases.length}
            </strong>
          </div>
        </div>

        <ProgressBar
          value={progress}
          style={{
            "--progress-fill":
              progress >= 80 ? "#10b981" : progress >= 45 ? "#0064E0" : "#f59e0b",
          } as React.CSSProperties}
        />

        <div className="workspace-card-footer">
          <ProjectDateCountdown targetDate={project.targetDate} compact />
          <ArrowRight size={17} />
        </div>

        {footer}
      </Card>
    </Link>
  );
}

export function PhaseSummaryCard({
  phase,
  href,
  projectTitle,
  businessName,
  action,
}: {
  phase: ProjectPhase;
  href: string;
  projectTitle?: string;
  businessName?: string;
  action?: React.ReactNode;
}) {
  const progress = phaseProgress(phase);
  const tone = phaseTone(phase.status);

  return (
    <Link href={href} className="workspace-card-link">
      <Card className={`workspace-card workspace-phase-card workspace-tone-${tone}`}>
        <div className="workspace-card-top">
          <span className={`workspace-card-icon tone-${tone}`}>
            {iconForPhase(phase.status)}
          </span>

          <Badge className={statusClass(phase.status)}>
            {statusLabel(phase.status)}
          </Badge>
        </div>

        <div className="workspace-card-main">
          <h3>{phase.title}</h3>
          <p>
            {phase.status === "LOCKED"
              ? "Complete previous phase first to unlock"
              : phase.description || projectTitle || "Project phase"}
          </p>
        </div>

        {(projectTitle || businessName) && (
          <div className="workspace-card-context">
            <strong>{projectTitle}</strong>
            {businessName && <span>{businessName}</span>}
          </div>
        )}

        <div className="workspace-card-meta">
          <div>
            <span>Progress</span>
            <strong>{progress}%</strong>
          </div>
          <div>
            <span>Deliverables</span>
            <strong>{phase.deliverables.length}</strong>
          </div>
        </div>

        <ProgressBar
          value={progress}
          style={{
            "--progress-fill":
              tone === "green"
                ? "#10b981"
                : tone === "red"
                  ? "#ef4444"
                  : tone === "orange"
                    ? "#f59e0b"
                    : "#0064E0",
          } as React.CSSProperties}
        />

        <div className="workspace-card-footer">
          <span>
            {phase.deliverables.filter((deliverable) => deliverable.status === "APPROVED").length} approved
          </span>
          {action ?? <ArrowRight size={17} />}
        </div>
      </Card>
    </Link>
  );
}

export function PaymentSummaryCard({
  payment,
  projectTitle,
  onAction,
  actionLabel = "Make Payment",
  loading = false,
}: {
  payment: ProjectPayment;
  projectTitle?: string;
  onAction?: () => void;
  actionLabel?: string;
  loading?: boolean;
}) {
  const tone = paymentTone(payment.status);

  return (
    <Card className={`workspace-card workspace-payment-card workspace-tone-${tone}`}>
      <div className="workspace-card-top">
        <span className={`workspace-card-icon tone-${tone}`}>
          <Banknote size={19} />
        </span>

        <Badge className={statusClass(payment.status)}>
          {statusLabel(payment.status)}
        </Badge>
      </div>

      <div className="workspace-card-main">
        <h3>{payment.type === "DEPOSIT" ? "First Deposit" : "Balance Payment"}</h3>
        {projectTitle && <p>{projectTitle}</p>}
      </div>

      <div className="workspace-payment-amount">
        {formatNaira(payment.amount)}
      </div>

      <div className="workspace-card-context">
        <strong>{payment.reference}</strong>
        <span>{payment.bankName || "Bank transfer"}</span>
      </div>

      <div className="workspace-card-footer">
        <span>
          {payment.status === "CONFIRMED"
            ? "Payment confirmed"
            : payment.status === "PENDING_CONFIRMATION"
              ? "Awaiting confirmation"
              : payment.status === "REJECTED"
                ? "Payment rejected"
                : "Payment required"}
        </span>

        {payment.status === "UNPAID" && onAction ? (
          <Button loading={loading} onClick={onAction}>
            {actionLabel}
          </Button>
        ) : (
          <ArrowRight size={17} />
        )}
      </div>
    </Card>
  );
}

export function TeamMemberSummaryCard({
  member,
  assignedCount,
  href,
}: {
  member: User;
  assignedCount: number;
  href?: string;
}) {
  const tone: Tone = assignedCount > 7 ? "red" : assignedCount > 4 ? "orange" : "blue";
  const loadPercent = Math.min(100, assignedCount * 12);

  const card = (
    <Card className="workspace-card workspace-team-card">
      <div className="workspace-card-top">
        <span className={`workspace-card-icon tone-${tone}`}>
          <UserRound size={19} />
        </span>

        <Badge className={`badge-${tone}`}>
          {assignedCount > 7 ? "High" : assignedCount > 4 ? "Busy" : "Optimal"}
        </Badge>
      </div>

      <div className="workspace-card-main">
        <h3>{member.name}</h3>
        <p>{member.specialty ?? statusLabel(member.role)}</p>
      </div>

      <div className="workspace-card-meta">
        <div>
          <span>Assignments</span>
          <strong>{assignedCount}</strong>
        </div>
        <div>
          <span>Capacity</span>
          <strong>{loadPercent}%</strong>
        </div>
      </div>

      <ProgressBar
        value={loadPercent}
        style={{
          "--progress-fill":
            tone === "red" ? "#ef4444" : tone === "orange" ? "#f59e0b" : "#0064E0",
        } as React.CSSProperties}
      />
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className="workspace-card-link">
      {card}
    </Link>
  );
}

export function WorkspaceEmptyCard({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="workspace-empty-card">
      <div className="workspace-card-icon tone-slate">
        {icon ?? <FileCheck2 size={20} />}
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
    </Card>
  );
}

export const WorkspaceCardIcons = {
  project: <BriefcaseBusiness size={19} />,
  phase: <Layers3 size={19} />,
  payment: <Banknote size={19} />,
  date: <CalendarClock size={19} />,
};
