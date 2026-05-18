"use client";

import { AdminPaymentsManager } from "./AdminPaymentsManager";

import {
  WorkspaceActionCard,
  WorkspaceEmptyPanel,
  WorkspaceListIcons,
  WorkspaceListPanel,
  WorkspaceSectionHero,
  WorkspaceStatStrip
} from "./WorkspaceLists";

import {
  AssigneeBlock,
  DetailIcons,
  DetailMetricGrid,
  DetailPanel,
  MessagePreviewList,
  PhaseDetailHero,
  ProjectDetailHero,
  ProjectPhaseTimeline
} from "./WorkspaceDetailUI";

import {
  ProjectSummaryCard,
  TeamMemberSummaryCard,
  WorkspaceEmptyCard
} from "./WorkspaceCards";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  ExternalLink,
  MoreVertical,
  Plus,
  Send,
  Trash2,
  UserPlus,
} from "lucide-react";
import { generatePhasesFromRequest, generateProjectSummary } from "@/lib/ai";
import {
  PackageType,
  Project,
  ProjectPhase,
  ProjectRequest,
  ProjectTemplate,
  Role,
  TemplatePhase,
  User,
} from "@/lib/types";
import { useApp } from "./AppContext";
import { DeliverableManager } from "./DeliverableManager";
import { ProjectWorkspaceTabs } from "./ProjectTeamNotes";
import {
  DashboardHero,
  DashboardIcons,
  DashboardListItem,
  DashboardPanel,
  DashboardProgressCard,
  DashboardStats,
} from "./DashboardUI";
import {
  BackLink,
  Badge,
  Button,
  Card,
  DataList,
  EmptyState,
  Field,
  formatNaira,
  Icons,
  Input,
  MetricCard,
  Modal,
  packageClass,
  PageHeader,
  PageLoading,
  ProgressBar,
  projectProgress,
  Select,
  Skeleton,
  statusClass,
  statusLabel,
  Textarea,
} from "./UI";

function toneForPhase(status: ProjectPhase["status"]) {
  if (status === "APPROVED") return "phase-approved";
  if (status === "AWAITING_APPROVAL") return "phase-awaiting";
  if (status === "IN_PROGRESS" || status === "CHANGES_REQUESTED")
    return "phase-in-progress";
  if (status === "LOCKED") return "phase-locked";
  return "";
}

function deliverableBadge(status: string) {
  if (status === "APPROVED") return "badge-green";
  if (status === "READY_FOR_REVIEW") return "badge-purple";
  if (status === "NEEDS_CHANGES") return "badge-red";
  return "badge-slate";
}

function ActionMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="actions-wrap" ref={ref}>
      <button
        className="icon-btn"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="action-menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

function RecentProjects() {
  const { state } = useApp();
  const projects = state.projects.slice(0, 6);

  return (
    <Card>
      <div className="card-title">
        <h2>Recent Projects</h2>
        <Link href="/admin/projects" className="btn btn-ghost" style={{ fontSize: 13 }}>
          View all {Icons.arrow}
        </Link>
      </div>
      <div className="card-body stack" style={{ gap: 10 }}>
        {projects.map((project) => (
          <Link
            href={`/admin/projects/${project.id}`}
            className="timeline-row"
            key={project.id}
            style={{ 
              padding: '12px 14px', 
              borderRadius: 12, 
              background: '#f8fafc',
              border: '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: 'block', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {project.title}
              </strong>
              <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: 12 }}>
                {project.businessName}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Badge className={packageClass(project.packageType)} style={{ minWidth: 70, textAlign: 'center' }}>
                {project.packageType}
              </Badge>
              <div style={{ textAlign: 'right', minWidth: 40 }}>
                <strong style={{ fontSize: 13 }}>
                  {project.phases.filter((p) => p.status === "APPROVED").length}/
                  {project.phases.length}
                </strong>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Phases</p>
              </div>
              <div style={{ width: 100 }}>
                <ProgressBar value={projectProgress(project)} style={{ height: 6 }} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function AdminOverview() {
  const { state } = useApp();

  const active = state.projects.filter((project) =>
    ["ACTIVE", "AWAITING_BALANCE"].includes(project.status),
  ).length;

  const awaiting = state.requests.filter(
    (request) => request.status === "PENDING_REVIEW",
  ).length;

  const overdue = state.projects
    .flatMap((project) => project.phases)
    .filter((phase) => phase.status === "CHANGES_REQUESTED").length;

  const completed = state.projects.filter(
    (project) => project.status === "COMPLETED",
  ).length;

  const pendingPayments = state.projects
    .flatMap((project) => project.payments)
    .filter((payment) => payment.status === "PENDING_CONFIRMATION").length;

  const totalPhases = state.projects.flatMap((project) => project.phases).length;
  const approvedPhases = state.projects
    .flatMap((project) => project.phases)
    .filter((phase) => phase.status === "APPROVED").length;

  const deliveryHealth =
    totalPhases > 0 ? Math.round((approvedPhases / totalPhases) * 100) : 0;

  const recentProjects = state.projects.slice(0, 6);
  const pendingRequests = state.requests
    .filter((request) => request.status === "PENDING_REVIEW")
    .slice(0, 4);

  const team = state.users.filter(
    (user) => user.role !== "CLIENT" && user.role !== "SUPER_ADMIN",
  );

  return (
    <div className="content">
      <DashboardHero
        eyebrow="Admin Command Center"
        title="Overview"
        subtitle="Monitor project movement, pending requests, payments, and team workload from one clean workspace."
        action={
          <Link href="/admin/projects/new">
            <Button>
              <Plus size={18} /> Create Project
            </Button>
          </Link>
        }
        meta={
          <>
            <Badge className="badge-blue">{state.projects.length} Projects</Badge>
            <Badge className="badge-orange">{awaiting} Requests</Badge>
            <Badge className="badge-green">{completed} Completed</Badge>
          </>
        }
      />

      <DashboardStats
        items={[
          {
            label: "Active Projects",
            value: active,
            tone: "blue",
            icon: DashboardIcons.project,
            helper: "Projects currently moving",
          },
          {
            label: "Pending Requests",
            value: awaiting,
            tone: "orange",
            icon: DashboardIcons.clock,
            helper: "Awaiting admin review",
          },
          {
            label: "Payment Checks",
            value: pendingPayments,
            tone: "purple",
            icon: Icons.payments,
            helper: "Transfers to confirm",
          },
          {
            label: "Completed",
            value: completed,
            tone: "green",
            icon: DashboardIcons.check,
            helper: "Closed project work",
          },
        ]}
      />

      <div className="grid-2">
        <DashboardPanel
          title="Recent Projects"
          action={
            <Link href="/admin/projects" className="btn btn-ghost">
              View all {Icons.arrow}
            </Link>
          }
        >
          <div className="stack" style={{ gap: 8 }}>
            {recentProjects.length ? (
              recentProjects.map((project) => (
                <DashboardListItem
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  title={project.title}
                  subtitle={`${project.businessName} â€¢ ${project.packageType} Suite`}
                  icon={DashboardIcons.project}
                  badge={
                    <Badge className={statusClass(project.status)}>
                      {statusLabel(project.status)}
                    </Badge>
                  }
                  meta={<strong>{projectProgress(project)}%</strong>}
                />
              ))
            ) : (
              <EmptyState
                title="No projects yet"
                body="Created projects will appear here."
              />
            )}
          </div>
        </DashboardPanel>

        <div className="stack">
          <DashboardProgressCard
            label="Delivery Health"
            title={`${approvedPhases}/${totalPhases || 0} phases approved`}
            value={deliveryHealth}
            tone={deliveryHealth >= 70 ? "green" : deliveryHealth >= 35 ? "orange" : "blue"}
            helper="Based on approved phases across all active projects."
          />

          <DashboardPanel
            title="Pending Requests"
            action={
              <Link href="/admin/project-requests" className="btn btn-ghost">
                Review {Icons.arrow}
              </Link>
            }
          >
            <div className="stack" style={{ gap: 8 }}>
              {pendingRequests.length ? (
                pendingRequests.map((request) => (
                  <DashboardListItem
                    key={request.id}
                    href="/admin/project-requests"
                    title={(request as any).projectName}
                    subtitle={`${request.businessName} â€¢ ${request.packageType} Suite`}
                    icon={DashboardIcons.clock}
                    badge={<Badge className="badge-orange">New</Badge>}
                  />
                ))
              ) : (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  No pending project requests.
                </p>
              )}
            </div>
          </DashboardPanel>
        </div>
      </div>

      <DashboardPanel
        title="Team Workload"
        action={
          <Link href="/admin/team" className="btn btn-ghost">
            Manage Team {Icons.arrow}
          </Link>
        }
        className="mt-24"
      >
        <div className="workload-grid">
          {team.map((user) => {
            const phases = state.projects
              .flatMap((project) => project.phases)
              .filter((phase) => phase.assignedStaffId === user.id).length;

            const loadPercent = Math.min(100, (phases / 10) * 100);
            const loadTone = phases > 7 ? "red" : phases > 4 ? "orange" : "blue";

            return (
              <Link href="/admin/team" key={user.id} className="workload-card">
                <div
                  className="avatar"
                  style={{
                    width: 52,
                    height: 52,
                    fontSize: 18,
                    background: `var(--${loadTone}-soft)`,
                    color: `var(--${loadTone})`,
                  }}
                >
                  {user.name[0]}
                </div>

                <div className="workload-info">
                  <div className="timeline-row" style={{ alignItems: "flex-start" }}>
                    <div>
                      <strong>{user.name}</strong>
                      <p>{user.specialty ?? statusLabel(user.role)}</p>
                    </div>
                    <Badge className={`badge-${loadTone}`}>
                      {phases > 7 ? "High" : phases > 4 ? "Busy" : "Optimal"}
                    </Badge>
                  </div>

                  <div className="workload-stat">
                    <span>{phases} active phases</span>
                    <span>{Math.round(loadPercent)}%</span>
                  </div>

                  <ProgressBar
                    value={loadPercent}
                    style={{
                      "--progress-fill":
                        loadTone === "red"
                          ? "#ef4444"
                          : loadTone === "orange"
                            ? "#f59e0b"
                            : "#0064E0",
                    } as React.CSSProperties}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </DashboardPanel>
    </div>
  );
}
export function AdminProjects() {
  const { state } = useApp();

  const projects = state.projects;
  const active = projects.filter((project) =>
    ["ACTIVE", "AWAITING_BALANCE"].includes(project.status),
  ).length;

  const completed = projects.filter(
    (project) => project.status === "COMPLETED",
  ).length;

  const pendingPayment = projects.filter(
    (project) => project.status === "AWAITING_BALANCE",
  ).length;

  const averageProgress = projects.length
    ? Math.round(
        projects.reduce((total, project) => total + projectProgress(project), 0) /
          projects.length,
      )
    : 0;

  return (
    <div className="content">
      <DashboardHero
        eyebrow="Project Operations"
        title="Projects"
        subtitle="Track every client project, delivery phase, payment status, and project movement from one clean admin view."
        action={
          <Link href="/admin/projects/new">
            <Button>{Icons.plus} New Project</Button>
          </Link>
        }
        meta={
          <>
            <Badge className="badge-blue">{projects.length} Total</Badge>
            <Badge className="badge-green">{completed} Completed</Badge>
            <Badge className="badge-orange">{pendingPayment} Awaiting Balance</Badge>
          </>
        }
      />

      <DashboardStats
        items={[
          {
            label: "Total Projects",
            value: projects.length,
            tone: "blue",
            icon: DashboardIcons.project,
            helper: "All project records",
          },
          {
            label: "Active Delivery",
            value: active,
            tone: "green",
            icon: DashboardIcons.phase,
            helper: "Currently moving",
          },
          {
            label: "Payment Watch",
            value: pendingPayment,
            tone: pendingPayment > 0 ? "orange" : "slate",
            icon: Icons.payments,
            helper: "Balance/payment attention",
          },
          {
            label: "Avg Progress",
            value: `${averageProgress}%`,
            tone: averageProgress >= 70 ? "green" : averageProgress >= 35 ? "blue" : "orange",
            icon: DashboardIcons.check,
            helper: "Across all projects",
          },
        ]}
      />

      {projects.length ? (
        <div className="grid-3">
          {projects.map((project) => (
            <ProjectSummaryCard
              key={project.id}
              project={project}
              href={`/admin/projects/${project.id}`}
            />
          ))}
        </div>
      ) : (
        <WorkspaceEmptyCard
          title="No projects yet"
          body="Created or approved client projects will appear here."
          icon={DashboardIcons.project}
        />
      )}
    </div>
  );
}
export function AdminProjectDetail({ projectId }: { projectId: string }) {
  const { state } = useApp();

  const project = state.projects.find((item) => item.id === projectId);

  if (!project) {
    return (
      <div className="content narrow">
        <WorkspaceEmptyCard
          title="Project not found"
          body="This project may have been deleted or you may not have access to it."
          icon={DashboardIcons.project}
        />
      </div>
    );
  }

  const projectManager = state.users.find(
    (user) => user.id === project.projectManagerId,
  );

  const client = state.users.find((user) => user.id === project.clientId);

  const allMessages = project.phases.flatMap((phase) =>
    phase.messages.map((message) => ({
      ...message,
      author: state.users.find((user) => user.id === message.senderId) ?? null,
    })),
  );

  const approvedPhases = project.phases.filter(
    (phase) => phase.status === "APPROVED",
  ).length;

  const visibleDeliverables = project.phases.flatMap((phase) =>
    phase.deliverables.filter((deliverable) => deliverable.visibleToClient),
  ).length;

  const confirmedPayments = project.payments.filter(
    (payment) => payment.status === "CONFIRMED",
  );

  const pendingPayments = project.payments.filter(
    (payment) =>
      payment.status === "UNPAID" ||
      payment.status === "PENDING_CONFIRMATION",
  );

  const firstPhase = project.phases[0];

  return (
    <div className="content">
      <ProjectDetailHero
        project={project}
        backHref="/admin/projects"
        backLabel="Back to projects"
        action={
          firstPhase ? (
            <Link href={`/admin/projects/${project.id}/phases/${firstPhase.id}`}>
              <Button>Open First Phase</Button>
            </Link>
          ) : null
        }
      />

      <DetailMetricGrid
        items={[
          {
            label: "Client",
            value: client?.name ?? project.businessName,
            icon: DetailIcons.user,
          },
          {
            label: "Project Manager",
            value: projectManager?.name ?? "Not assigned",
            icon: DetailIcons.user,
          },
          {
            label: "Approved Phases",
            value: `${approvedPhases}/${project.phases.length}`,
            icon: DetailIcons.layers,
          },
          {
            label: "Visible Deliverables",
            value: visibleDeliverables,
            icon: DetailIcons.files,
          },
        ]}
      />

      <div className="grid-2" style={{ marginTop: 24 }}>
        <DetailPanel
          title="Phase Timeline"
          subtitle="Track every delivery stage and open phase details."
          icon={DetailIcons.layers}
        >
          <ProjectPhaseTimeline
            project={project}
            baseHref={`/admin/projects/${project.id}/phases`}
          />
        </DetailPanel>

        <div className="stack">
          <DetailPanel
            title="Project Team"
            subtitle="Client, project manager, and assigned delivery staff."
            icon={DetailIcons.user}
          >
            <div className="stack">
              <div className="workspace-assignee-block">
                <span className="workspace-assignee-avatar">
                  {client?.name?.[0]?.toUpperCase() ?? "C"}
                </span>
                <div>
                  <strong>{client?.name ?? project.businessName}</strong>
                  <p>Client</p>
                </div>
              </div>

              <div className="workspace-assignee-block">
                <span className="workspace-assignee-avatar">
                  {projectManager?.name?.[0]?.toUpperCase() ?? "P"}
                </span>
                <div>
                  <strong>{projectManager?.name ?? "Not assigned"}</strong>
                  <p>Project Manager</p>
                </div>
              </div>

              {project.phases
                .filter((phase) => phase.assignedStaffId)
                .map((phase) => {
                  const staff = state.users.find(
                    (user) => user.id === phase.assignedStaffId,
                  );

                  return (
                    <div className="workspace-assignee-block" key={phase.id}>
                      <span className="workspace-assignee-avatar">
                        {staff?.name?.[0]?.toUpperCase() ?? "S"}
                      </span>
                      <div>
                        <strong>{staff?.name ?? "Assigned Staff"}</strong>
                        <p>{phase.title}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </DetailPanel>

          <DetailPanel
            title="Payment Status"
            subtitle="Deposit and balance movement for this project."
            icon={Icons.payments}
          >
            <div className="stack">
              <div className="workspace-detail-metric">
                <span className="workspace-detail-metric-icon">
                  {Icons.payments}
                </span>
                <div>
                  <span>Confirmed</span>
                  <strong>{confirmedPayments.length}</strong>
                </div>
              </div>

              <div className="workspace-detail-metric">
                <span className="workspace-detail-metric-icon">
                  {Icons.clock}
                </span>
                <div>
                  <span>Pending / Unpaid</span>
                  <strong>{pendingPayments.length}</strong>
                </div>
              </div>

              <Link
                href="/admin/payments"
                className="btn btn-secondary"
                style={{ width: "100%" }}
              >
                Open Payments
              </Link>
            </div>
          </DetailPanel>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 24 }}>
        <DetailPanel
          title="Recent Messages"
          subtitle="Latest communication across project phases."
          icon={DetailIcons.messages}
        >
          <MessagePreviewList messages={allMessages} />
        </DetailPanel>

        <DetailPanel
          title="Project Brief"
          subtitle="Internal delivery context and client notes."
          icon={DetailIcons.files}
        >
          <div className="workspace-card-context">
            <strong>Brief</strong>
            <span>
              {project.internalNotes ||
                project.clientBrief ||
                "No project brief has been added yet."}
            </span>
          </div>
        </DetailPanel>
      </div>
    </div>
  );
}

function AssignModal({
  phase,
  onClose,
  onAssign,
}: {
  phase: ProjectPhase;
  onClose: () => void;
  onAssign: (staffId: string) => void;
}) {
  const { state } = useApp();
  const [loading, setLoading] = useState(false);
  const team = state.users.filter(
    (u) => u.role !== "CLIENT" && u.role !== "SUPER_ADMIN",
  );
  const [staffId, setStaffId] = useState(
    phase.assignedStaffId ?? team[0]?.id ?? "",
  );
  return (
    <Modal title={`Assign ${phase.title}`} onClose={onClose}>
      <div className="stack">
        <Field label="Team Member">
          <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            {team.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} Ã¢â‚¬â€ {u.specialty ?? u.role}
              </option>
            ))}
          </Select>
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await onAssign(staffId);
              } finally {
                setLoading(false);
              }
            }}
          >
            Assign Phase
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AddDeliverableModal({
  phase,
  onClose,
  onSubmit,
}: {
  phase: ProjectPhase;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    link?: string;
    linkType?: any;
    description?: string;
  }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    link: "",
    linkType: "Other",
    description: "",
  });
  return (
    <Modal title={`Add Deliverable to ${phase.title}`} onClose={onClose}>
      <div className="stack">
        <Field label="Name *">
          <Input
            placeholder="e.g., Logo Concepts V1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={loading}
          />
        </Field>
        <Field label="Link">
          <Input
            placeholder="https://..."
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            disabled={loading}
          />
        </Field>
        <Field label="Link Type">
          <Select
            value={form.linkType}
            onChange={(e) => setForm({ ...form, linkType: e.target.value })}
            disabled={loading}
          >
            <option>Figma</option>
            <option>Google Drive</option>
            <option>Web Preview</option>
            <option>Document</option>
            <option>Other</option>
          </Select>
        </Field>
        <Field label="Description">
          <Textarea
            placeholder="Optional description..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={loading}
          />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={async () => {
              if (form.name.trim()) {
                setLoading(true);
                try {
                  await onSubmit(form);
                } finally {
                  setLoading(false);
                }
              }
            }}
          >
            Add Deliverable
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function AdminPhaseDetail({
  projectId,
  phaseId,
}: {
  projectId: string;
  phaseId: string;
}) {
  const { state, sendPhaseMessage, requestPhaseApproval, addDeliverable } =
    useApp();
  const project = state.projects.find((p) => p.id === projectId);
  const phase = project?.phases.find((p) => p.id === phaseId);
  const [msg, setMsg] = useState("");
  const [adding, setAdding] = useState(false);
  if (!project || !phase)
    return (
      <div className="content">
        <EmptyState
          title="Phase not found"
          body="The selected phase could not be found."
        />
      </div>
    );
  return (
    <div className="content narrow">
      <BackLink href={`/admin/projects/${project.id}`} />
      <div className="page-header">
        <div>
          <h1>{phase.title}</h1>
          <p>{phase.description}</p>
          <Badge className={statusClass(phase.status)}>
            {statusLabel(phase.status)}
          </Badge>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="secondary" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add Deliverable
          </Button>
          <Button
            onClick={() => requestPhaseApproval(phase.id)}
            disabled={phase.status === "APPROVED" || phase.status === "LOCKED"}
          >
            Request Approval
          </Button>
        </div>
      </div>
      <div className="grid-2">
        <div className="stack">
          <Card>
            <div className="card-title">
              <h2>Deliverables</h2>
            </div>
            <div className="card-body stack">
              <DeliverableManager phase={phase} />
            </div>
          </Card>
          <Card>
            <div className="card-title">
              <h2>Approval History</h2>
            </div>
            <div className="card-body">
              <p style={{ color: "var(--muted)" }}>
                {phase.approvalRequestedAt
                  ? `Requested ${new Date(phase.approvalRequestedAt).toLocaleString()}`
                  : "No approval requested yet."}
              </p>
              {phase.approvedAt && (
                <p>Approved {new Date(phase.approvedAt).toLocaleString()}</p>
              )}
            </div>
          </Card>
        </div>
        <Card className="thread">
          <div className="thread-header">Phase Thread</div>
          <div className="thread-body">
            {phase.messages.length ? (
              phase.messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.senderRole === "SYSTEM" ? "system" : message.senderId === state.users.find((u) => u.role === "SUPER_ADMIN")?.id ? "mine" : ""}`}
                >
                  <small>{message.senderName}</small>
                  {message.message}
                </div>
              ))
            ) : (
              <EmptyState
                title="No messages yet"
                body="Client, staff, and project manager messages will appear here."
              />
            )}
          </div>
          <div className="thread-input">
            <Input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type a message..."
            />
            <Button
              onClick={() => {
                sendPhaseMessage(phase.id, msg);
                setMsg("");
              }}
            >
              <Send size={16} />
            </Button>
          </div>
        </Card>
      </div>
      {adding && (
        <AddDeliverableModal
          phase={phase}
          onClose={() => setAdding(false)}
          onSubmit={(payload) => {
            addDeliverable(phase.id, payload);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

export function AdminCreateProject() {
  const { state, createAdminProject, dataLoading } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [packageType, setPackageType] = useState<PackageType>("Launch");
  const [createError, setCreateError] = useState("");

  if (state.templates.length === 0) {
    if (dataLoading) return <PageLoading />;

    return (
      <div className="content">
        <BackLink href="/admin/projects" />
        <EmptyState
          title="No Templates Found"
          body="You need to create at least one project template before you can create a new project."
        />
      </div>
    );
  }

  const template =
    state.templates.find((t) => t.packageType === packageType) ??
    state.templates[0];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [form, setForm] = useState({
    templateId: template?.id ?? "",
    title: "",
    clientName: "",
    clientEmail: "",
    targetDate: "",
    totalAmount: 750000,
    depositAmount: 350000,
    balanceAmount: 400000,
    projectManagerId:
      state.users.find((u) => u.role === "PROJECT_MANAGER")?.id ?? "",
    internalNotes: "",
  });
  const selectedTemplate =
    state.templates.find((t) => t.id === form.templateId) ?? template;
  return (
    <div className="content wizard">
      <BackLink href="/admin/projects" label={step === 1 ? "Cancel" : "Back"} />
      <h1>Create New Project</h1>
      <p style={{ color: "var(--muted)" }}>Step {step} of 4</p>
      <div className="wizard-progress">
        <span className={step >= 1 ? "active" : ""} />
        <span className={step >= 2 ? "active" : ""} />
        <span className={step >= 3 ? "active" : ""} />
        <span className={step >= 4 ? "active" : ""} />
      </div>
      {step === 1 && (
        <>
          <h2>Select Package Type</h2>
          <div className="grid-2-even">
            {(["Launch", "Impact", "Growth", "Partner"] as PackageType[]).map(
              (pkg) => (
                <Card
                  key={pkg}
                  onClick={() => {
                    setPackageType(pkg);
                    const tpl = state.templates.find(
                      (t) => t.packageType === pkg,
                    );
                    if (tpl)
                      setForm((prev) => ({ ...prev, templateId: tpl.id }));
                  }}
                  className={`package-card ${packageType === pkg ? "selected" : ""}`}
                >
                  <div className="package-icon">{pkg[0]}</div>
                  <div>
                    <h3>{pkg}</h3>
                    <p>
                      {
                        state.templates.find((t) => t.packageType === pkg)
                          ?.description
                      }
                    </p>
                  </div>
                  {packageType === pkg && (
                    <span
                      style={{ marginLeft: "auto", color: "var(--primary)" }}
                    >
                      Ã¢Å“â€œ
                    </span>
                  )}
                </Card>
              ),
            )}
          </div>
          <Card className="template-preview">
            <h3>Template Preview</h3>
            <ol>
              {selectedTemplate?.phases?.map((p) => (
                <li key={p.id}>{p.title}</li>
              ))}
            </ol>
          </Card>
        </>
      )}
      {step === 2 && (
        <>
          <h2>Project Details</h2>
          <Card className="card-body">
            <div className="form-grid">
              <Field label="Project Name *">
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Brand Redesign Q1"
                />
              </Field>
              <Field label="Client Name *">
                <Input
                  value={form.clientName}
                  onChange={(e) =>
                    setForm({ ...form, clientName: e.target.value })
                  }
                  placeholder="Company name"
                />
              </Field>
              <Field label="Client Email *">
                <Input
                  value={form.clientEmail}
                  onChange={(e) =>
                    setForm({ ...form, clientEmail: e.target.value })
                  }
                  placeholder="client@company.com"
                />
              </Field>
              <Field label="Target Completion Date">
                <Input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) =>
                    setForm({ ...form, targetDate: e.target.value })
                  }
                  placeholder="Select date"
                />
              </Field>
            </div>
          </Card>
        </>
      )}
      {step === 3 && (
        <>
          <h2>Payment & Team</h2>
          <Card className="card-body">
            <div className="form-grid">
              <Field label="Total Amount">
                <Input
                  type="number"
                  value={form.totalAmount}
                  onChange={(e) =>
                    setForm({ ...form, totalAmount: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Deposit Amount">
                <Input
                  type="number"
                  value={form.depositAmount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      depositAmount: Number(e.target.value),
                      balanceAmount: form.totalAmount - Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Balance Amount">
                <Input
                  type="number"
                  value={form.balanceAmount}
                  onChange={(e) =>
                    setForm({ ...form, balanceAmount: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Project Manager">
                <Select
                  value={form.projectManagerId}
                  onChange={(e) =>
                    setForm({ ...form, projectManagerId: e.target.value })
                  }
                >
                  {state.users
                    .filter((u) => u.role === "PROJECT_MANAGER")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Internal Notes">
                <Textarea
                  value={form.internalNotes}
                  onChange={(e) =>
                    setForm({ ...form, internalNotes: e.target.value })
                  }
                />
              </Field>
            </div>
          </Card>
        </>
      )}
      {step === 4 && (
        <>
          <h2>Summary</h2>
          <Card className="card-body stack">
            <div className="timeline-row">
              <span>Package</span>
              <strong>{packageType}</strong>
            </div>
            <div className="timeline-row">
              <span>Project</span>
              <strong>{form.title}</strong>
            </div>
            <div className="timeline-row">
              <span>Client</span>
              <strong>{form.clientName}</strong>
            </div>
            <div className="timeline-row">
              <span>Phases</span>
              <strong>{selectedTemplate?.phases?.length ?? 0}</strong>
            </div>
            <div className="timeline-row">
              <span>Deposit</span>
              <strong>{formatNaira(form.depositAmount)}</strong>
            </div>
          </Card>
        </>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 32,
        }}
      >
        <Button
          variant="secondary"
          onClick={() =>
            step === 1 ? router.push("/admin/projects") : setStep(step - 1)
          }
        >
          {step === 1 ? "Cancel" : "Back"}
        </Button>
        {step < 4 ? (
          <Button
            disabled={
              (step === 2 &&
                (!form.title.trim() ||
                  !form.clientName.trim() ||
                  !form.clientEmail.trim())) ||
              (step === 3 && (form.totalAmount <= 0 || form.depositAmount <= 0))
            }
            onClick={() => setStep(step + 1)}
          >
            Continue {Icons.arrow}
          </Button>
        ) : (
          <Button
            loading={loading}
            disabled={!form.title.trim() || loading}
            onClick={async () => {
              try {
                setLoading(true);
                const id = await createAdminProject({
                  ...form,
                  packageType,
                  templateId: selectedTemplate?.id ?? "",
                });
                router.push(`/admin/projects/${id}`);
              } catch (err: any) {
                alert(err.message || "Failed to create project");
                setLoading(false);
              }
            }}
          >
            Create Project Ã¢Å“â€œ
          </Button>
        )}
      </div>
    </div>
  );
}

export function AdminRequests() {
  const { state, approveProjectRequest } = useApp();
  const [active, setActive] = useState<string | null>(null);
  const request = state.requests.find((r) => r.id === active);
  return (
    <div className="content">
      <PageHeader
        title="Project Requests"
        subtitle="Review client-submitted project requests"
      />
      {state.requests.length ? (
        <div className="stack">
          {state.requests.map((req) => (
            <Card key={req.id} className="payment-card">
              <div>
                <Badge className={packageClass(req.packageType)}>
                  {req.packageType}
                </Badge>
                <h2>{req.projectName}</h2>
                <p style={{ color: "var(--muted)" }}>
                  {req.businessName} Ã¢â‚¬Â¢ {req.projectGoal}
                </p>
                <Badge className={statusClass(req.status as any)}>
                  {statusLabel(req.status as any)}
                </Badge>
              </div>
              <Button onClick={() => setActive(req.id)}>
                {req.status === "PENDING_REVIEW" ? "Review" : "View"}
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No requests yet"
          body="Client-created project requests will appear here."
        />
      )}
      {request && (
        <RequestReviewModal
          request={request}
          onClose={() => setActive(null)}
          onApprove={async (payload) => {
            await approveProjectRequest(request.id, payload);
            setActive(null);
          }}
        />
      )}
    </div>
  );
}

function RequestReviewModal({
  request,
  onClose,
  onApprove,
}: {
  request: ProjectRequest;
  onClose: () => void;
  onApprove: (payload: any) => Promise<void>;
}) {
  const { state } = useApp();
  const phases = generatePhasesFromRequest(request, state.templates);
  const [loading, setLoading] = useState(false);
  const isPending = request.status === "PENDING_REVIEW";
  const [form, setForm] = useState({
    totalAmount: 750000,
    depositAmount: 350000,
    balanceAmount: 400000,
    projectManagerId:
      state.users.find((u) => u.role === "PROJECT_MANAGER")?.id ?? "",
    targetDate: "",
    internalNotes: "",
  });
  return (
    <Modal
      title={`Review ${(request as any).projectName}`}
      onClose={onClose}
      width="820px"
    >
      <div className="stack" style={{ gap: 32 }}>
        <div className="grid-2" style={{ gap: 24, alignItems: "stretch" }}>
          <Card
            className="card-body"
            style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {Icons.doc}
              </div>
              <h3 style={{ margin: 0, fontSize: 16 }}>Client Brief</h3>
            </div>
            <div style={{ fontSize: 14 }}>
              <p style={{ marginTop: 0, marginBottom: 8 }}>
                <strong>Goal:</strong> {request.projectGoal}
              </p>
              <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                {request.projectDescription}
              </p>
            </div>
          </Card>

          <Card
            className="card-body"
            style={{ background: "#F6FAFF", borderColor: "#BFD9FF" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                Ã¢Å“Â¨
              </div>
              <h3 style={{ margin: 0, fontSize: 16 }}>AI Suggested Phases</h3>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {phases.map((p: any, index: number) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#fff",
                    padding: "8px 8px",
                    borderRadius: 8,
                    border: "1px solid #BFD9FF",
                  }}
                >
                  <span
                    className="badge badge-purple"
                    style={{
                      margin: 0,
                      minWidth: 24,
                      textAlign: "center",
                      justifyContent: "center",
                    }}
                  >
                    {index + 1}
                  </span>
                  <strong style={{ fontSize: 14 }}>{p.title}</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="form-grid">
          <Field label="Total Amount">
            <Input
              type="number"
              value={form.totalAmount}
              disabled={!isPending}
              onChange={(e) =>
                setForm({ ...form, totalAmount: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Deposit Amount">
            <Input
              type="number"
              value={form.depositAmount}
              disabled={!isPending}
              onChange={(e) =>
                setForm({ ...form, depositAmount: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Balance Amount">
            <Input
              type="number"
              value={form.balanceAmount}
              disabled={!isPending}
              onChange={(e) =>
                setForm({ ...form, balanceAmount: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Project Manager">
            <Select
              value={form.projectManagerId}
              disabled={!isPending}
              onChange={(e) =>
                setForm({ ...form, projectManagerId: e.target.value })
              }
            >
              {state.users
                .filter((u) => u.role === "PROJECT_MANAGER")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Target Date">
            <Input
              type="date"
              value={form.targetDate}
              disabled={!isPending}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              placeholder="Select date"
            />
          </Field>
          <Field label="Internal Notes">
            <Textarea
              value={form.internalNotes}
              disabled={!isPending}
              onChange={(e) =>
                setForm({ ...form, internalNotes: e.target.value })
              }
            />
          </Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {isPending ? "Cancel" : "Close"}
          </Button>
          {isPending && (
            <Button
              loading={loading}
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await onApprove(form);
                } catch (e) {
                  // errors handled in useApp
                } finally {
                  setLoading(false);
                }
              }}
            >
              Approve & Request Deposit Ã¢Å“â€œ
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function AdminClients() {
  const { state } = useApp();

  const clients = state.users.filter((user) => user.role === "CLIENT");

  const activeClients = clients.filter((client) =>
    state.projects.some((project) => project.clientId === client.id),
  );

  const clientsWithoutProject = clients.filter(
    (client) => !state.projects.some((project) => project.clientId === client.id),
  );

  return (
    <div className="content">
      <WorkspaceSectionHero
        eyebrow="Client Accounts"
        title="Clients"
        subtitle="View client accounts, connected projects, company details, and workspace records."
        meta={
          <>
            <Badge className="badge-blue">{clients.length} Clients</Badge>
            <Badge className="badge-green">{activeClients.length} Active</Badge>
            <Badge className="badge-slate">{clientsWithoutProject.length} No Project</Badge>
          </>
        }
      />

      <WorkspaceStatStrip
        items={[
          {
            label: "Total Clients",
            value: clients.length,
            tone: "blue",
            icon: WorkspaceListIcons.client,
          },
          {
            label: "With Projects",
            value: activeClients.length,
            tone: "green",
            icon: WorkspaceListIcons.check,
          },
          {
            label: "Without Projects",
            value: clientsWithoutProject.length,
            tone: clientsWithoutProject.length ? "orange" : "slate",
            icon: WorkspaceListIcons.clock,
          },
          {
            label: "Projects",
            value: state.projects.length,
            tone: "purple",
            icon: WorkspaceListIcons.document,
          },
        ]}
      />

      <WorkspaceListPanel
        title="Client Directory"
        subtitle="Client profiles and connected project records."
      >
        {clients.length ? (
          clients.map((client) => {
            const projects = state.projects.filter(
              (project) => project.clientId === client.id,
            );

            return (
              <WorkspaceActionCard
                key={client.id}
                title={client.name}
                subtitle={client.company || client.email}
                icon={WorkspaceListIcons.client}
                tone={projects.length ? "blue" : "slate"}
                badge={
                  <Badge className={projects.length ? "badge-green" : "badge-slate"}>
                    {projects.length ? `${projects.length} Project${projects.length > 1 ? "s" : ""}` : "No Project"}
                  </Badge>
                }
                meta={
                  <>
                    <span>{client.email}</span>
                    {client.phone && <span>{client.phone}</span>}
                    {client.company && <span>{client.company}</span>}
                  </>
                }
                href={projects[0] ? `/admin/projects/${projects[0].id}` : undefined}
              />
            );
          })
        ) : (
          <WorkspaceEmptyPanel
            title="No clients yet"
            body="Client accounts will appear here after signup or project creation."
            icon={WorkspaceListIcons.client}
          />
        )}
      </WorkspaceListPanel>
    </div>
  );
}


export function AdminTemplates() {
  const { state } = useApp();

  const templates = ((state.templates ?? []) as any[]);

  const activeTemplates = templates.filter(
    (template) => (template as any).isActive !== false && template.status !== "INACTIVE",
  );

  const inactiveTemplates = templates.filter(
    (template) => (template as any).isActive === false || template.status === "INACTIVE",
  );

  const totalPhases = templates.reduce(
    (total, template) => total + ((template.phases ?? (template as any).phaseTemplates ?? []).length || 0),
    0,
  );

  return (
    <div className="content">
      <WorkspaceSectionHero
        eyebrow="Delivery Systems"
        title="Templates"
        subtitle="Manage project templates, phase structures, and reusable delivery frameworks."
        meta={
          <>
            <Badge className="badge-blue">{templates.length} Total</Badge>
            <Badge className="badge-green">{activeTemplates.length} Active</Badge>
            <Badge className="badge-slate">{inactiveTemplates.length} Inactive</Badge>
          </>
        }
      />

      <WorkspaceStatStrip
        items={[
          {
            label: "Templates",
            value: templates.length,
            tone: "blue",
            icon: WorkspaceListIcons.template,
          },
          {
            label: "Active",
            value: activeTemplates.length,
            tone: "green",
            icon: WorkspaceListIcons.check,
          },
          {
            label: "Inactive",
            value: inactiveTemplates.length,
            tone: "slate",
            icon: WorkspaceListIcons.document,
          },
          {
            label: "Reusable Phases",
            value: totalPhases,
            tone: "purple",
            icon: WorkspaceListIcons.template,
          },
        ]}
      />

      <WorkspaceListPanel
        title="Template Library"
        subtitle="Reusable structures for Suite delivery projects."
      >
        {templates.length ? (
          templates.map((template) => {
            const phaseCount = (template.phases ?? (template as any).phaseTemplates ?? []).length || 0;
            const isInactive = (template as any).isActive === false || template.status === "INACTIVE";

            return (
              <WorkspaceActionCard
                key={template.id}
                title={template.name ?? template.title ?? "Project Template"}
                subtitle={template.description || "Reusable Octalve delivery template"}
                icon={WorkspaceListIcons.template}
                tone={isInactive ? "slate" : "blue"}
                badge={
                  <Badge className={isInactive ? "badge-slate" : "badge-green"}>
                    {isInactive ? "Inactive" : "Active"}
                  </Badge>
                }
                meta={
                  <>
                    <span>{phaseCount} phases</span>
                    <span>{template.packageType ?? template.type ?? "General"} Suite</span>
                  </>
                }
              />
            );
          })
        ) : (
          <WorkspaceEmptyPanel
            title="No templates yet"
            body="Template records will appear here when they are created."
            icon={WorkspaceListIcons.template}
          />
        )}
      </WorkspaceListPanel>
    </div>
  );
}



function TemplateModal({
  template,
  onClose,
  onSave,
}: {
  template?: ProjectTemplate;
  onClose: () => void;
  onSave: (payload: Omit<ProjectTemplate, "id">) => Promise<void>;
}) {
  const [form, setForm] = useState<Omit<ProjectTemplate, "id">>({
    name: template?.name ?? "",
    packageType: template?.packageType ?? "Launch",
    description: template?.description ?? "",
    phases: template?.phases ?? [
      {
        id: "",
        title: "",
        description: "",
        deliverables: ["Primary deliverable"],
      },
    ],
  });
  const setPhase = (index: number, patch: Partial<TemplatePhase>) =>
    setForm((prev) => ({
      ...prev,
      phases: prev.phases.map((phase, i) =>
        i === index ? { ...phase, ...patch } : phase,
      ),
    }));
  return (
    <Modal
      title={template ? "Edit Template" : "Create Template"}
      onClose={onClose}
      width="720px"
    >
      <div className="stack">
        <div className="form-grid">
          <Field label="Template Name *">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Standard Launch"
            />
          </Field>
          <Field label="Suite Type *">
            <Select
              value={form.packageType}
              onChange={(e) =>
                setForm({ ...form, packageType: e.target.value as PackageType })
              }
            >
              <option>Launch</option>
              <option>Impact</option>
              <option>Growth</option>
              <option>Partner</option>
              <option>Custom</option>
            </Select>
          </Field>
          <Field label="Description">
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Brief description of this template"
            />
          </Field>
        </div>
        <div className="timeline-row">
          <h3>Phases</h3>
          <Button
            variant="secondary"
            onClick={() =>
              setForm({
                ...form,
                phases: [
                  ...form.phases,
                  {
                    id: "",
                    title: "",
                    description: "",
                    deliverables: ["Primary deliverable"],
                  },
                ],
              })
            }
          >
            <Plus size={16} /> Add Phase
          </Button>
        </div>
        <div className="stack">
          {form.phases.map((phase, index) => (
            <Card
              key={index}
              className="card-body"
              style={{ boxShadow: "none", background: "var(--surface-soft)" }}
            >
              <div className="deliverable-main">
                <span className="badge badge-purple">{index + 1}</span>
                <div style={{ flex: 1 }}>
                  <Input
                    value={phase.title}
                    onChange={(e) => setPhase(index, { title: e.target.value })}
                    placeholder="Phase name"
                  />
                  <Input
                    style={{ marginTop: 10 }}
                    value={phase.description}
                    onChange={(e) =>
                      setPhase(index, { description: e.target.value })
                    }
                    placeholder="Phase description (optional)"
                  />
                </div>
                <button
                  className="icon-btn"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      phases: prev.phases.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (form.name.trim()) await onSave(form);
            }}
          >
            {template ? "Save Changes" : "Create Template"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function AdminTeam() {
  const { state } = useApp();

  const team = state.users.filter((user) => user.role !== "CLIENT");
  const staff = team.filter((user) => user.role !== "SUPER_ADMIN");
  const totalAssignedPhases = state.projects.flatMap((project) => project.phases).length;

  return (
    <div className="content">
      <DashboardHero
        eyebrow="Team Operations"
        title="Team"
        subtitle="View project managers, staff workload, active phase assignments, and delivery capacity."
        meta={
          <>
            <Badge className="badge-blue">{team.length} Team Members</Badge>
            <Badge className="badge-purple">{staff.length} Delivery Staff</Badge>
            <Badge className="badge-green">{totalAssignedPhases} Total Phases</Badge>
          </>
        }
      />

      <DashboardStats
        items={[
          {
            label: "Team Members",
            value: team.length,
            tone: "blue",
            icon: Icons.team,
            helper: "Admin, PM and staff",
          },
          {
            label: "Delivery Staff",
            value: staff.length,
            tone: "purple",
            icon: DashboardIcons.phase,
            helper: "Can receive assignments",
          },
          {
            label: "Assigned Phases",
            value: state.projects
              .flatMap((project) => project.phases)
              .filter((phase) => phase.assignedStaffId).length,
            tone: "green",
            icon: DashboardIcons.check,
            helper: "Currently assigned",
          },
          {
            label: "Unassigned Phases",
            value: state.projects
              .flatMap((project) => project.phases)
              .filter((phase) => !phase.assignedStaffId && phase.status !== "LOCKED").length,
            tone: "orange",
            icon: DashboardIcons.clock,
            helper: "Needs staff attention",
          },
        ]}
      />

      {team.length ? (
        <div className="grid-3">
          {team.map((member) => {
            const assignedPhaseCount = state.projects
              .flatMap((project) => project.phases)
              .filter((phase) => phase.assignedStaffId === member.id).length;

            const managedProjectCount = state.projects.filter(
              (project) => project.projectManagerId === member.id,
            ).length;

            return (
              <TeamMemberSummaryCard
                key={member.id}
                member={member}
                assignedCount={assignedPhaseCount + managedProjectCount}
              />
            );
          })}
        </div>
      ) : (
        <WorkspaceEmptyCard
          title="No team members yet"
          body="Team members will appear here after they are added to the workspace."
          icon={Icons.team}
        />
      )}
    </div>
  );
}
export function AdminSettings() {
  return (
    <div className="content narrow">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />
      <div className="stack">
        <Card className="card-body">
          <h2>Profile</h2>
          <div className="form-grid">
            <Field label="Name">
              <Input defaultValue="Octa Ive" />
            </Field>
            <Field label="Email">
              <Input defaultValue="octalve0@gmail.com" />
            </Field>
            <Field label="Role">
              <Input defaultValue="Administrator" />
            </Field>
          </div>
        </Card>
        <Card className="card-body">
          <h2>Notifications</h2>
          {[
            "Email notifications",
            "Approval requests",
            "Project updates",
            "Weekly digest",
          ].map((item) => (
            <div
              className="timeline-row"
              key={item}
              style={{
                padding: "18px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div>
                <strong>{item}</strong>
                <p style={{ margin: 4, color: "var(--muted)" }}>
                  Configure how you receive updates
                </p>
              </div>
              <input type="checkbox" defaultChecked />
            </div>
          ))}
        </Card>
        <Card className="card-body">
          <h2>Security</h2>
          <Button variant="secondary">Change Password</Button>
          <p style={{ color: "var(--muted)" }}>Last password change: Never</p>
        </Card>
        <Card className="card-body" style={{ borderColor: "#fecdd3" }}>
          <h2 style={{ color: "#e11d48" }}>Danger Zone</h2>
          <Button variant="danger">Delete Account</Button>
        </Card>
      </div>
    </div>
  );
}
export function AdminAnalytics() {
  const { state } = useApp();

  const projects = state.projects;
  const phases = projects.flatMap((project) => project.phases);
  const payments = projects.flatMap((project) => project.payments);

  const activeProjects = projects.filter((project) =>
    ["ACTIVE", "AWAITING_BALANCE"].includes(project.status),
  ).length;

  const completedProjects = projects.filter(
    (project) => project.status === "COMPLETED",
  ).length;

  const approvedPhases = phases.filter((phase) => phase.status === "APPROVED").length;
  const awaitingApproval = phases.filter(
    (phase) => phase.status === "AWAITING_APPROVAL",
  ).length;

  const confirmedRevenue = payments
    .filter((payment) => payment.status === "CONFIRMED")
    .reduce((total, payment) => total + payment.amount, 0);

  const pendingRevenue = payments
    .filter(
      (payment) =>
        payment.status === "UNPAID" ||
        payment.status === "PENDING_CONFIRMATION",
    )
    .reduce((total, payment) => total + payment.amount, 0);

  const deliveryRate = phases.length
    ? Math.round((approvedPhases / phases.length) * 100)
    : 0;

  const paymentRate = payments.length
    ? Math.round(
        (payments.filter((payment) => payment.status === "CONFIRMED").length /
          payments.length) *
          100,
      )
    : 0;

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);

  const packageCounts = projects.reduce<Record<string, number>>((acc, project) => {
    acc[project.packageType] = (acc[project.packageType] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="content">
      <section className="dashboard-hero">
        <div className="dashboard-hero-main">
          <span className="dashboard-eyebrow">Workspace Intelligence</span>
          <h1>Analytics</h1>
          <p>
            Review project volume, delivery health, payment movement and package
            distribution across Octalve Workspace.
          </p>

          <div className="dashboard-hero-meta">
            <span className="badge badge-blue">{projects.length} Projects</span>
            <span className="badge badge-green">{completedProjects} Completed</span>
            <span className="badge badge-orange">{awaitingApproval} Awaiting Approval</span>
          </div>
        </div>
      </section>

      <div className="dashboard-stats">
        <div className="card dashboard-stat-card">
          <div>
            <span>Confirmed Revenue</span>
            <strong>{formatMoney(confirmedRevenue)}</strong>
            <p>Payments confirmed by admin</p>
          </div>
        </div>

        <div className="card dashboard-stat-card">
          <div>
            <span>Pending Revenue</span>
            <strong>{formatMoney(pendingRevenue)}</strong>
            <p>Unpaid or awaiting confirmation</p>
          </div>
        </div>

        <div className="card dashboard-stat-card">
          <div>
            <span>Delivery Rate</span>
            <strong>{deliveryRate}%</strong>
            <p>Approved phases against total phases</p>
          </div>
        </div>

        <div className="card dashboard-stat-card">
          <div>
            <span>Payment Rate</span>
            <strong>{paymentRate}%</strong>
            <p>Confirmed payments against total payments</p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card dashboard-panel">
          <div className="dashboard-panel-head">
            <h2>Project Health</h2>
          </div>

          <div className="dashboard-panel-body stack">
            <div className="dashboard-list-item">
              <div className="dashboard-list-main">
                <div>
                  <strong>Active Projects</strong>
                  <p>Projects currently moving through delivery.</p>
                </div>
              </div>
              <div className="dashboard-list-side">
                <strong>{activeProjects}</strong>
              </div>
            </div>

            <div className="dashboard-list-item">
              <div className="dashboard-list-main">
                <div>
                  <strong>Approved Phases</strong>
                  <p>Client-approved delivery phases.</p>
                </div>
              </div>
              <div className="dashboard-list-side">
                <strong>{approvedPhases}/{phases.length}</strong>
              </div>
            </div>

            <div className="dashboard-list-item">
              <div className="dashboard-list-main">
                <div>
                  <strong>Awaiting Approval</strong>
                  <p>Phases currently waiting for client review.</p>
                </div>
              </div>
              <div className="dashboard-list-side">
                <strong>{awaitingApproval}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="card dashboard-panel">
          <div className="dashboard-panel-head">
            <h2>Package Distribution</h2>
          </div>

          <div className="dashboard-panel-body stack">
            {Object.keys(packageCounts).length ? (
              Object.entries(packageCounts).map(([name, count]) => (
                <div className="dashboard-list-item" key={name}>
                  <div className="dashboard-list-main">
                    <div>
                      <strong>{name} Suite</strong>
                      <p>{count} project{count > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="dashboard-list-side">
                    <strong>{count}</strong>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "var(--muted)", margin: 0 }}>
                No package data yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export function AdminPayments() {
  return <AdminPaymentsManager />;
}

export function AdminReviews() {
  const { state } = useApp();

  const reviews = (((state as any).reviews ?? []) as any[]).slice();

  const published = reviews.filter(
    (review) =>
      review.status === "PUBLISHED" ||
      review.isPublished === true ||
      review.published === true,
  ).length;

  const pending = reviews.filter(
    (review) =>
      review.status === "PENDING" ||
      review.status === "PENDING_REVIEW" ||
      review.isPublished === false,
  ).length;

  const ratings = reviews
    .map((review) => Number(review.rating ?? review.score ?? 0))
    .filter((rating) => rating > 0);

  const averageRating = ratings.length
    ? (ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(1)
    : "0.0";

  return (
    <div className="content">
      <DashboardHero
        eyebrow="Client Feedback"
        title="Reviews"
        subtitle="Review client feedback, testimonials, and public proof of delivery quality."
        meta={
          <>
            <Badge className="badge-blue">{reviews.length} Total Reviews</Badge>
            <Badge className="badge-green">{published} Published</Badge>
            <Badge className="badge-orange">{pending} Pending</Badge>
          </>
        }
      />

      <DashboardStats
        items={[
          {
            label: "Total Reviews",
            value: reviews.length,
            tone: "blue",
            icon: <span aria-hidden="true">★</span>,
            helper: "All submitted reviews",
          },
          {
            label: "Published",
            value: published,
            tone: "green",
            icon: DashboardIcons.check,
            helper: "Visible testimonials",
          },
          {
            label: "Pending",
            value: pending,
            tone: pending > 0 ? "orange" : "slate",
            icon: DashboardIcons.clock,
            helper: "Awaiting review",
          },
          {
            label: "Average Rating",
            value: averageRating,
            tone: "purple",
            icon: <span aria-hidden="true">★</span>,
            helper: "Across rated feedback",
          },
        ]}
      />

      {reviews.length ? (
        <div className="grid-2-even">
          {reviews.map((review) => (
            <Card key={review.id ?? review.email ?? review.name} className="workspace-card">
              <div className="workspace-card-top">
                <span className="workspace-card-icon tone-purple">
                  {<span aria-hidden="true">★</span>}
                </span>

                <Badge
                  className={
                    review.status === "PUBLISHED" ||
                    review.isPublished ||
                    review.published
                      ? "badge-green"
                      : "badge-orange"
                  }
                >
                  {review.status
                    ? statusLabel(review.status)
                    : review.isPublished || review.published
                      ? "Published"
                      : "Pending"}
                </Badge>
              </div>

              <div className="workspace-card-main">
                <h3>{review.name ?? review.clientName ?? "Client Review"}</h3>
                <p>
                  {review.projectTitle ??
                    review.businessName ??
                    review.email ??
                    "Octalve Workspace feedback"}
                </p>
              </div>

              <div className="workspace-card-context">
                <strong>
                  Rating: {review.rating ?? review.score ?? "Not rated"}
                </strong>
                <span>
                  {review.message ??
                    review.comment ??
                    review.testimonial ??
                    "No review message was provided."}
                </span>
              </div>

              <div className="workspace-card-footer">
                <span>
                  {review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString("en-NG")
                    : "No date"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <WorkspaceEmptyCard
          title="No reviews yet"
          body="Client reviews and testimonials will appear here when they are submitted."
          icon={<span aria-hidden="true">★</span>}
        />
      )}
    </div>
  );
}
export function AdminProjectPhaseDetail({
  projectId,
  phaseId,
}: {
  projectId: string;
  phaseId: string;
}) {
  const {
    state,
    assignPhase,
    addDeliverable,
    requestPhaseApproval,
  } = useApp();

  const [assigning, setAssigning] = useState<ProjectPhase | null>(null);
  const [adding, setAdding] = useState<ProjectPhase | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const project = state.projects.find((item) => item.id === projectId);
  const phase = project?.phases.find((item) => item.id === phaseId);

  if (!project || !phase) {
    return (
      <div className="content narrow">
        <WorkspaceEmptyCard
          title="Phase not found"
          body="This phase may have been deleted or you may not have access to it."
          icon={DetailIcons.layers}
        />
      </div>
    );
  }

  const assignee = state.users.find((user) => user.id === phase.assignedStaffId);

  const messages = phase.messages.map((message) => ({
    ...message,
    author: state.users.find((user) => user.id === message.senderId) ?? null,
  }));

  async function handleRequestApproval() {
    setPendingAction("request-approval");

    try {
      await requestPhaseApproval(phaseId);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="content">
      <PhaseDetailHero
        phase={phase}
        project={project}
        assignee={assignee}
        backHref={`/admin/projects/${project.id}`}
        backLabel="Back to project"
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={() => setAssigning(phase)}>
              Assign Staff
            </Button>

            {phase.status !== "APPROVED" && (
              <Button variant="secondary" onClick={() => setAdding(phase)}>
                Add Deliverable
              </Button>
            )}

            {phase.status === "IN_PROGRESS" ||
            phase.status === "CHANGES_REQUESTED" ? (
              <Button
                loading={pendingAction === "request-approval"}
                onClick={handleRequestApproval}
              >
                Request Approval
              </Button>
            ) : null}
          </div>
        }
      />

      <DetailMetricGrid
        items={[
          {
            label: "Project",
            value: project.title,
            icon: DetailIcons.layers,
          },
          {
            label: "Assigned Staff",
            value: assignee?.name ?? "Not assigned",
            icon: DetailIcons.user,
          },
          {
            label: "Deliverables",
            value: phase.deliverables.length,
            icon: DetailIcons.files,
          },
          {
            label: "Messages",
            value: phase.messages.length,
            icon: DetailIcons.messages,
          },
        ]}
      />

      <div className="grid-2" style={{ marginTop: 24 }}>
        <DetailPanel
          title="Deliverables"
          subtitle="Edit or delete unapproved deliverables before client approval."
          icon={DetailIcons.files}
          action={
            phase.status !== "APPROVED" ? (
              <Button variant="secondary" onClick={() => setAdding(phase)}>
                Add Deliverable
              </Button>
            ) : null
          }
        >
          <DeliverableManager phase={phase} />
        </DetailPanel>

        <div className="stack">
          <DetailPanel
            title="Assigned Team"
            subtitle="Staff responsible for this phase."
            icon={DetailIcons.user}
          >
            <AssigneeBlock user={assignee} />
          </DetailPanel>

          <DetailPanel
            title="Recent Messages"
            subtitle="Latest conversation for this phase."
            icon={DetailIcons.messages}
          >
            <MessagePreviewList messages={messages} />
          </DetailPanel>
        </div>
      </div>

      {assigning && (
        <AssignModal
          phase={assigning}
          onClose={() => setAssigning(null)}
          onAssign={async (staffId) => {
            await assignPhase(assigning.id, staffId);
            setAssigning(null);
          }}
        />
      )}

      {adding && (
        <AddDeliverableModal
          phase={adding}
          onClose={() => setAdding(null)}
          onSubmit={async (payload) => {
            await addDeliverable(adding.id, payload);
            setAdding(null);
          }}
        />
      )}
    </div>
  );
}
