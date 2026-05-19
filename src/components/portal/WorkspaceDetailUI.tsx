"use client";


import { getPackageTitle } from "./packageCatalog";
import Link from "next/link";
import type React from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Layers3,
  MessageSquareText,
  UserRound,
} from "lucide-react";
import type { Project, ProjectPhase, User } from "@/lib/types";
import { ProjectDateCountdown } from "./ProjectDateCountdown";

const OCTALVE_PHASE_COLORS = ["#0064E0", "#E61525", "#FC7E24", "#29BE3E", "#5300D9"];
import {
  Badge,
  Button,
  Card,
  ProgressBar,
  packageClass,
  projectProgress,
  statusClass,
  statusLabel,
} from "./UI";

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

function progressColor(value: number) {
  if (value >= 80) return "#10b981";
  if (value >= 45) return "#0064E0";
  if (value > 0) return "#f59e0b";
  return "#cbd5e1";
}

export function WorkspaceBackLink({
  href,
  label = "Back",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link href={href} className="workspace-back-link">
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}

export function ProjectDetailHero({
  project,
  backHref,
  backLabel = "Back to projects",
  action,
}: {
  project: Project;
  backHref: string;
  backLabel?: string;
  action?: React.ReactNode;
}) {
  const progress = projectProgress(project);
  const approved = project.phases.filter((phase) => phase.status === "APPROVED").length;

  return (
    <section className="workspace-detail-hero">
      <div className="workspace-detail-hero-main">
        <WorkspaceBackLink href={backHref} label={backLabel} />

        <div className="workspace-detail-title-row">
          <span className="workspace-detail-icon">
            <Layers3 size={22} />
          </span>

          <div>
            <div className="workspace-detail-badges">
              <Badge className={packageClass(project.packageType)}>
                {getPackageTitle(project.packageType)}
              </Badge>
              <Badge className={statusClass(project.status)}>
                {statusLabel(project.status)}
              </Badge>
            </div>

            <h1>{project.title}</h1>
            <p>{project.businessName}</p>
          </div>
        </div>

        <div className="workspace-detail-meta">
          <div>
            <span>Project Code</span>
            <strong>{project.projectCode}</strong>
          </div>

          <div>
            <span>Progress</span>
            <strong>{progress}%</strong>
          </div>

          <div>
            <span>Approved Phases</span>
            <strong>
              {approved}/{project.phases.length}
            </strong>
          </div>

          <div>
            <span>Target Date</span>
            <ProjectDateCountdown targetDate={project.targetDate} compact />
          </div>
        </div>

        <ProgressBar
          value={progress}
          style={{ "--progress-fill": progressColor(progress) } as React.CSSProperties}
        />
      </div>

      {action && <div className="workspace-detail-action">{action}</div>}
    </section>
  );
}

export function PhaseDetailHero({
  phase,
  project,
  backHref,
  backLabel = "Back to project",
  assignee,
  action,
}: {
  phase: ProjectPhase;
  project?: Project;
  backHref: string;
  backLabel?: string;
  assignee?: User;
  action?: React.ReactNode;
}) {
  const progress = phaseProgress(phase);
  const phaseIndex = project?.phases.findIndex((item) => item.id === phase.id) ?? 0;
  const phaseColor = OCTALVE_PHASE_COLORS[
    Math.max(phaseIndex, 0) % OCTALVE_PHASE_COLORS.length
  ];

  return (
    <section
      className="workspace-detail-hero workspace-phase-detail-hero"
      style={{ "--phase-color": phaseColor } as React.CSSProperties}
    >
      <div className="workspace-detail-hero-main">
        <WorkspaceBackLink href={backHref} label={backLabel} />

        <div className="workspace-detail-title-row">
          <span className="workspace-detail-icon">
            <FileCheck2 size={22} />
          </span>

          <div>
            <div className="workspace-detail-badges">
              <Badge className={statusClass(phase.status)}>
                {statusLabel(phase.status)}
              </Badge>
              {project && (
                <Badge className={packageClass(project.packageType)}>
                  {getPackageTitle(project.packageType)}
                </Badge>
              )}
            </div>

            <h1>{phase.title}</h1>
            <p>
              {phase.description ||
                "This phase contains the approved scope, deliverables, messages, and review activity for this stage of the project."}
            </p>
          </div>
        </div>

        <div className="workspace-detail-meta">
          <div>
            <span>Phase Progress</span>
            <strong>{progress}%</strong>
          </div>

          <div>
            <span>Deliverables</span>
            <strong>{phase.deliverables.length}</strong>
          </div>

          <div>
            <span>Messages</span>
            <strong>{phase.messages.length}</strong>
          </div>

          <div>
            <span>Assigned To</span>
            <strong>{assignee?.name ?? "Unassigned"}</strong>
          </div>
        </div>

        <ProgressBar
          value={progress}
          style={{ "--progress-fill": phaseColor } as React.CSSProperties}
        />
      </div>

      {action && <div className="workspace-detail-action">{action}</div>}
    </section>
  );
}


export function DetailPanel({
  title,
  subtitle,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`workspace-detail-panel ${className ?? ""}`}>
      <div className="workspace-detail-panel-head">
        <div className="workspace-detail-panel-title">
          <span>{icon ?? <Layers3 size={18} />}</span>
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>

        {action && <div className="workspace-detail-panel-action">{action}</div>}
      </div>

      <div className="workspace-detail-panel-body">{children}</div>
    </Card>
  );
}

export function ProjectPhaseTimeline({
  project,
  baseHref,
}: {
  project: Project;
  baseHref: string;
}) {
  return (
    <div className="workspace-timeline-list">
      {project.phases.map((phase, index) => {
        const progress = phaseProgress(phase);

        return (
          <Link
            key={phase.id}
            href={`${baseHref}/${phase.id}`}
            className="workspace-timeline-item"
          >
            <div className="workspace-timeline-index">
              {phase.status === "APPROVED" ? (
                <CheckCircle2 size={18} />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            <div className="workspace-timeline-content">
              <div className="workspace-timeline-top">
                <div>
                  <strong>{phase.title}</strong>
                  <p>
                    {phase.status === "LOCKED"
                      ? "Locked until previous steps are completed"
                      : phase.description || "Project delivery phase"}
                  </p>
                </div>

                <Badge className={statusClass(phase.status)}>
                  {statusLabel(phase.status)}
                </Badge>
              </div>

              <div className="workspace-timeline-progress">
                <span>{progress}% complete</span>
                <ProgressBar
                  value={progress}
                  style={
                    { "--progress-fill": progressColor(progress) } as React.CSSProperties
                  }
                />
              </div>
            </div>

            <ArrowRight size={16} />
          </Link>
        );
      })}
    </div>
  );
}

export function DetailMetricGrid({
  items,
}: {
  items: Array<{
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
  }>;
}) {
  return (
    <div className="workspace-detail-metrics">
      {items.map((item) => (
        <div className="workspace-detail-metric" key={item.label}>
          <span className="workspace-detail-metric-icon">
            {item.icon ?? <Clock3 size={16} />}
          </span>
          <div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessagePreviewList({
  messages,
}: {
  messages: Array<{
    id: string;
    message: string;
    createdAt: string;
    author?: { name?: string } | null;
  }>;
}) {
  if (!messages.length) {
    return (
      <div className="workspace-empty-soft">
        <MessageSquareText size={22} />
        <strong>No messages yet</strong>
        <p>Project or phase conversations will appear here.</p>
      </div>
    );
  }

  return (
    <div className="workspace-message-preview-list">
      {messages.slice(-5).reverse().map((message) => (
        <div className="workspace-message-preview" key={message.id}>
          <span className="workspace-message-avatar">
            {(message.author?.name ?? "O")[0]?.toUpperCase()}
          </span>

          <div>
            <strong>{message.author?.name ?? "Workspace User"}</strong>
            <p>{message.message}</p>
            <em>{new Date(message.createdAt).toLocaleString("en-NG")}</em>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AssigneeBlock({
  user,
}: {
  user?: User;
}) {
  return (
    <div className="workspace-assignee-block">
      <span className="workspace-assignee-avatar">
        {user?.name?.[0]?.toUpperCase() ?? <UserRound size={18} />}
      </span>

      <div>
        <strong>{user?.name ?? "Not assigned"}</strong>
        <p>{user?.specialty ?? user?.role ?? "No assignee selected yet"}</p>
      </div>
    </div>
  );
}

export const DetailIcons = {
  calendar: <CalendarClock size={18} />,
  files: <FileCheck2 size={18} />,
  messages: <MessageSquareText size={18} />,
  layers: <Layers3 size={18} />,
  user: <UserRound size={18} />,
};
