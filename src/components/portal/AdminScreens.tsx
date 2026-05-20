"use client";



import { ProjectWorkspaceList, ProjectWorkspaceDetail, PhaseWorkspaceDetail } from "./ProjectWorkspace";
import { PhaseMessageThread } from "./PhaseMessageThread";
import { AdminPaymentsManager } from "./AdminPaymentsManager";
import { AdminSystemSettings } from "./AdminSystemSettings";
import {
  getPortalRoleLabel,
  isPortalDeliveryTeamUser,
  normalizePortalRole,
} from "./workspaceRoleUtils";

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
import { useEffect, useMemo, useRef, useState } from "react";
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
import { getPackageCatalogItem, getPackageTitle, PACKAGE_CATALOG } from "./packageCatalog";
import { TemplatePackagePicker, getTemplatePackageOptions, type TemplatePickerOption } from "./TemplatePackagePicker";

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
                {getPackageTitle(project.packageType)}
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
        eyebrow=""
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
                  subtitle={`${project.businessName} â€¢ ${getPackageTitle(project.packageType)}`}
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
                    subtitle={`${request.businessName} â€¢ ${getPackageTitle(request.packageType)}`}
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
              <Link href={`/admin/team/${user.id}`} key={user.id} className="workload-card">
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
                      <p>{user.specialty ?? getPortalRoleLabel(user)}</p>
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
  return <ProjectWorkspaceList role="admin" />;
}
export function AdminProjectDetail({ projectId }: { projectId: string }) {
  return <ProjectWorkspaceDetail role="admin" projectId={projectId} />;
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

  const team = (state.users ?? []).filter(isPortalDeliveryTeamUser);
  const initialStaffId =
    phase.assignedStaffId && team.some((user) => user.id === phase.assignedStaffId)
      ? phase.assignedStaffId
      : team[0]?.id ?? "";

  const [staffId, setStaffId] = useState(initialStaffId);

  return (
    <Modal title={`Assign ${phase.title}`} onClose={onClose}>
      <div className="stack">
        <Field label="Team Member">
          <Select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            disabled={!team.length || loading}
          >
            {team.length ? (
              team.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.specialty ?? getPortalRoleLabel(user)}
                </option>
              ))
            ) : (
              <option value="">No staff or project manager available</option>
            )}
          </Select>
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button
            loading={loading}
            disabled={!staffId || !team.length}
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
        <Card className="border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold tracking-[-0.035em] text-slate-950">
              Phase Thread
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Messages are separated by sender and receiver with clear identity tracking.
            </p>
          </div>

          <PhaseMessageThread
            messages={phase.messages}
            currentUserId={state.users.find((u) => u.role === "SUPER_ADMIN")?.id}
          />

          <div className="mt-4 flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
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
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const packageOptions = useMemo(
    () => getTemplatePackageOptions(state.templates),
    [state.templates],
  );

  const selectedOption =
    packageOptions.find((option) => option.id === selectedTemplateId) ??
    packageOptions[0];

  const selectedTemplate =
    selectedOption?.template ??
    state.templates.find((template) => template.id === selectedTemplateId) ??
    null;

  const packageType = selectedOption?.type ?? selectedTemplate?.packageType ?? "Launch";

  const [form, setForm] = useState({
    title: "",
    clientName: "",
    clientEmail: "",
    targetDate: "",
    totalAmount: 750000,
    depositAmount: 375000,
    balanceAmount: 375000,
    projectManagerId: "",
    internalNotes: "",
  });

  useEffect(() => {
    if (!selectedTemplateId && packageOptions[0]) {
      setSelectedTemplateId(packageOptions[0].id);
    }
  }, [packageOptions, selectedTemplateId]);

  if (dataLoading && state.templates.length === 0) {
    return <PageLoading />;
  }

  if (state.templates.length === 0) {
    return (
      <div className="content narrow">
        <Card className="border-slate-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <Badge className="badge-orange">Templates required</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
            Create or sync templates first
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Admin project creation now uses the same delivery templates shown to clients. Go to Templates and sync the official Octalve workflows or create a custom template.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push("/admin/templates")}>
              Go to Templates
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const staffOptions = state.users.filter(isPortalDeliveryTeamUser);

  function selectTemplate(option: TemplatePickerOption) {
    setSelectedTemplateId(option.id);
    setCreateError("");
  }

  function validateStep(targetStep = step) {
    if (targetStep !== 2 && targetStep !== 3) return "";

    if (!selectedTemplate) return "Select a valid admin-managed template.";
    if (!form.title.trim()) return "Project title is required.";
    if (!form.clientName.trim()) return "Client name is required.";
    if (!form.clientEmail.trim()) return "Client email is required.";
    if (!form.totalAmount || form.totalAmount <= 0) return "Total amount must be greater than zero.";
    if (form.depositAmount < 0 || form.balanceAmount < 0) return "Payment amounts cannot be negative.";

    return "";
  }

  function goNext() {
    const error = step === 2 ? validateStep(2) : "";

    if (error) {
      setCreateError(error);
      return;
    }

    setCreateError("");
    setStep((value) => Math.min(value + 1, 3));
  }

  async function submitProject() {
    const error = validateStep(3);

    if (error) {
      setCreateError(error);
      setStep(2);
      return;
    }

    setLoading(true);
    setCreateError("");

    try {
      const id = await createAdminProject({
        ...form,
        packageType,
        templateId: selectedTemplate?.id ?? "",
      });

      router.push(`/admin/projects/${id}`);
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create project");
      setLoading(false);
    }
  }

  return (
    <div className="content narrow">
      <div className="mx-auto max-w-[1160px] pb-10">
        <BackLink href="/admin/projects" label={step === 1 ? "Cancel" : "Back"} />

        <section className="mb-7 mt-2 rounded-[30px] bg-[#E61525] px-6 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:px-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <Badge className="border-white/20 bg-white/15 text-white">
                Step {step} of 3
              </Badge>
              <h1 className="mt-4 max-w-3xl text-[34px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[46px]">
                Create Managed Project
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/82 sm:text-[15px]">
                Select the same admin-managed template structure used by the client project request flow.
              </p>
            </div>

            <div className="flex gap-2 lg:justify-end">
              {[1, 2, 3].map((item) => (
                <span
                  key={item}
                  className={[
                    "h-2.5 w-16 rounded-full",
                    step >= item ? "bg-white" : "bg-white/25",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>
        </section>

        {createError && (
          <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {createError}
          </div>
        )}

        {step === 1 && (
          <>
            <TemplatePackagePicker
              templates={state.templates}
              selectedId={selectedTemplateId}
              onSelect={selectTemplate}
              role="admin"
              layout="grid"
              showLayoutSwitch={false}
              heading="Select Admin Template"
              description="These templates come directly from Admin Templates. Updating a template updates the workflow available for admin and client project creation."
            />

            {selectedTemplate && (
              <Card className="mt-6 overflow-hidden border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                <div className="border-b border-slate-200 px-6 py-5">
                  <Badge className={packageClass(selectedTemplate.packageType)}>
                    Selected workflow
                  </Badge>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.035em] text-slate-950">
                    {selectedTemplate.name}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {selectedTemplate.description || getPackageCatalogItem(selectedTemplate.packageType).description}
                  </p>
                </div>

                <div className="grid gap-3 bg-slate-50 p-4 sm:p-5">
                  {selectedTemplate.phases.map((phase, index) => (
                    <div key={phase.id || index} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                            Phase {index + 1}
                          </span>
                          <h4 className="mt-1 text-base font-semibold text-slate-950">
                            {phase.title}
                          </h4>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {phase.description}
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {phase.deliverables?.length ?? 0} deliverables
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="mb-3 text-[22px] font-semibold tracking-[-0.035em] text-slate-950">
              Project Details
            </h2>

            <Card className="border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-7">
              <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Project Title *">
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Octalve website launch system"
                    className="h-12 rounded-2xl border-slate-200 text-sm placeholder:text-slate-400"
                  />
                </Field>

                <Field label="Client Name *">
                  <Input
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    placeholder="Client or business contact name"
                    className="h-12 rounded-2xl border-slate-200 text-sm placeholder:text-slate-400"
                  />
                </Field>

                <Field label="Client Email *">
                  <Input
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                    placeholder="client@example.com"
                    className="h-12 rounded-2xl border-slate-200 text-sm placeholder:text-slate-400"
                  />
                </Field>

                <Field label="Target Delivery Date">
                  <Input
                    type="date"
                    value={form.targetDate}
                    onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                    className="h-12 rounded-2xl border-slate-200 text-sm"
                  />
                </Field>

                <Field label="Total Amount">
                  <Input
                    type="number"
                    value={form.totalAmount}
                    onChange={(e) =>
                      setForm({ ...form, totalAmount: Number(e.target.value) })
                    }
                    className="h-12 rounded-2xl border-slate-200 text-sm"
                  />
                </Field>

                <Field label="Deposit Amount">
                  <Input
                    type="number"
                    value={form.depositAmount}
                    onChange={(e) =>
                      setForm({ ...form, depositAmount: Number(e.target.value) })
                    }
                    className="h-12 rounded-2xl border-slate-200 text-sm"
                  />
                </Field>

                <Field label="Balance Amount">
                  <Input
                    type="number"
                    value={form.balanceAmount}
                    onChange={(e) =>
                      setForm({ ...form, balanceAmount: Number(e.target.value) })
                    }
                    className="h-12 rounded-2xl border-slate-200 text-sm"
                  />
                </Field>

                <Field label="Project Manager / Staff">
                  <Select
                    value={form.projectManagerId}
                    onChange={(e) =>
                      setForm({ ...form, projectManagerId: e.target.value })
                    }
                    className="h-12 rounded-2xl border-slate-200 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {staffOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} — {getPortalRoleLabel(user)}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="lg:col-span-2">
                  <Field label="Internal Notes">
                    <Textarea
                      value={form.internalNotes}
                      onChange={(e) =>
                        setForm({ ...form, internalNotes: e.target.value })
                      }
                      placeholder="Private admin notes for delivery context."
                      className="min-h-[110px] rounded-2xl border-slate-200 text-sm placeholder:text-slate-400"
                    />
                  </Field>
                </div>
              </div>
            </Card>
          </>
        )}

        {step === 3 && selectedTemplate && (
          <>
            <h2 className="mb-3 text-[22px] font-semibold tracking-[-0.035em] text-slate-950">
              Review & Create
            </h2>

            <Card className="border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-7">
              <div className="grid gap-4">
                <div className="timeline-row">
                  <span>Template</span>
                  <strong>{selectedTemplate.name}</strong>
                </div>
                <div className="timeline-row">
                  <span>Package</span>
                  <strong>{getPackageTitle(selectedTemplate.packageType)}</strong>
                </div>
                <div className="timeline-row">
                  <span>Project</span>
                  <strong>{form.title || "Not provided"}</strong>
                </div>
                <div className="timeline-row">
                  <span>Client</span>
                  <strong>{form.clientName || "Not provided"}</strong>
                </div>
                <div className="timeline-row">
                  <span>Amount</span>
                  <strong>₦{form.totalAmount.toLocaleString()}</strong>
                </div>
                <div className="timeline-row">
                  <span>Workflow</span>
                  <strong>{selectedTemplate.phases.length} phases</strong>
                </div>
              </div>
            </Card>
          </>
        )}

        <div className="sticky bottom-0 z-10 mt-5 flex justify-between gap-3 border-t border-slate-200 bg-[rgba(248,250,252,0.88)] py-4 backdrop-blur">
          <Button
            variant="secondary"
            onClick={() => {
              setCreateError("");
              setStep((value) => Math.max(value - 1, 1));
            }}
            disabled={step === 1 || loading}
          >
            Back
          </Button>

          {step < 3 ? (
            <Button onClick={goNext}>Continue</Button>
          ) : (
            <Button loading={loading} onClick={submitProject}>
              Create Project
            </Button>
          )}
        </div>
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
                  {getPackageTitle(req.packageType)}
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
      state.users.find((u) => normalizePortalRole(u) === "PROJECT_MANAGER")?.id ?? "",
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
                    <span>{getPackageTitle(template.packageType ?? template.type ?? "Launch")}</span>
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
              {PACKAGE_CATALOG.map((item) => (
                <option key={item.type} value={item.type}>
                  {item.title}
                </option>
              ))}
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
  return <AdminSystemSettings />;
}

export function AdminAnalytics() {
  const { state } = useApp();

  const [packageFilter, setPackageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [dateWindow, setDateWindow] = useState("ALL");

  const projects = state.projects ?? [];
  const reviews = state.reviews ?? [];
  const requests = state.requests ?? [];

  function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
  }

  function formatPercent(value: number) {
    return `${Number.isFinite(value) ? Math.round(value) : 0}%`;
  }

  function formatStatus(value: string) {
    return value
      .split("_")
      .map((item) => item.charAt(0) + item.slice(1).toLowerCase())
      .join(" ");
  }

  function projectDateValue(project: any) {
    const raw = project.createdAt ?? project.updatedAt ?? "";
    const parsed = new Date(raw).getTime();

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function isInsideDateWindow(project: any) {
    if (dateWindow === "ALL") return true;

    const days = Number(dateWindow);
    if (!Number.isFinite(days)) return true;

    const value = projectDateValue(project);
    if (!value) return true;

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    return value >= cutoff;
  }

  const packageOptions = Array.from(new Set(projects.map((project) => project.packageType))).sort();
  const statusOptions = Array.from(new Set(projects.map((project) => project.status))).sort();

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const packageOk = packageFilter === "ALL" || project.packageType === packageFilter;
      const statusOk = statusFilter === "ALL" || project.status === statusFilter;
      const paymentOk =
        paymentFilter === "ALL" ||
        project.payments.some((payment) => payment.status === paymentFilter);

      return packageOk && statusOk && paymentOk && isInsideDateWindow(project);
    });
  }, [projects, packageFilter, statusFilter, paymentFilter, dateWindow]);

  const filteredProjectIds = new Set(filteredProjects.map((project) => project.id));
  const filteredPhases = filteredProjects.flatMap((project) => project.phases);
  const filteredPayments = filteredProjects.flatMap((project) => project.payments);
  const filteredReviews = reviews.filter((review) => filteredProjectIds.has((review as any).projectId));

  const confirmedPayments = filteredPayments.filter((payment) => payment.status === "CONFIRMED");
  const pendingPayments = filteredPayments.filter((payment) => payment.status === "PENDING_CONFIRMATION");
  const unpaidPayments = filteredPayments.filter((payment) => payment.status === "UNPAID");
  const rejectedPayments = filteredPayments.filter((payment) => payment.status === "REJECTED");

  const depositDue = filteredPayments
    .filter((payment) => payment.type === "DEPOSIT" && payment.status !== "CONFIRMED")
    .reduce((total, payment) => total + payment.amount, 0);

  const balanceDue = filteredPayments
    .filter((payment) => payment.type === "BALANCE" && payment.status !== "CONFIRMED")
    .reduce((total, payment) => total + payment.amount, 0);

  const confirmedRevenue = confirmedPayments.reduce((total, payment) => total + payment.amount, 0);
  const pendingRevenue = [...pendingPayments, ...unpaidPayments].reduce(
    (total, payment) => total + payment.amount,
    0,
  );

  const totalRevenue = filteredPayments.reduce((total, payment) => total + payment.amount, 0);
  const collectionRate = totalRevenue > 0 ? (confirmedRevenue / totalRevenue) * 100 : 0;

  const approvedPhases = filteredPhases.filter((phase) => phase.status === "APPROVED").length;
  const activePhases = filteredPhases.filter((phase) =>
    ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED"].includes(phase.status),
  ).length;

  const lockedPhases = filteredPhases.filter((phase) => phase.status === "LOCKED").length;
  const awaitingApproval = filteredPhases.filter((phase) => phase.status === "AWAITING_APPROVAL").length;
  const changesRequested = filteredPhases.filter((phase) => phase.status === "CHANGES_REQUESTED").length;

  const deliveryRate = filteredPhases.length > 0 ? (approvedPhases / filteredPhases.length) * 100 : 0;
  const paymentRate = filteredPayments.length > 0 ? (confirmedPayments.length / filteredPayments.length) * 100 : 0;

  const completedProjects = filteredProjects.filter((project) => project.status === "COMPLETED").length;
  const activeProjects = filteredProjects.filter((project) =>
    ["ACTIVE", "AWAITING_BALANCE", "BALANCE_PENDING_CONFIRMATION", "DEPOSIT_PENDING_CONFIRMATION"].includes(project.status),
  ).length;

  const awaitingDeposit = filteredProjects.filter(
    (project) =>
      project.status === "APPROVED_AWAITING_DEPOSIT" ||
      project.status === "DEPOSIT_PENDING_CONFIRMATION",
  ).length;

  const awaitingBalance = filteredProjects.filter(
    (project) =>
      project.status === "AWAITING_BALANCE" ||
      project.status === "BALANCE_PENDING_CONFIRMATION",
  ).length;

  const averageProgress = filteredProjects.length
    ? filteredProjects.reduce((total, project) => total + projectProgress(project), 0) / filteredProjects.length
    : 0;

  const packageCounts = filteredProjects.reduce<Record<string, number>>((acc, project) => {
    acc[project.packageType] = (acc[project.packageType] ?? 0) + 1;
    return acc;
  }, {});

  const statusCounts = filteredProjects.reduce<Record<string, number>>((acc, project) => {
    acc[project.status] = (acc[project.status] ?? 0) + 1;
    return acc;
  }, {});

  const paymentCounts = filteredPayments.reduce<Record<string, number>>((acc, payment) => {
    acc[payment.status] = (acc[payment.status] ?? 0) + 1;
    return acc;
  }, {});

  const phaseCounts = filteredPhases.reduce<Record<string, number>>((acc, phase) => {
    acc[phase.status] = (acc[phase.status] ?? 0) + 1;
    return acc;
  }, {});

  const recentRequests = requests.filter((request) => request.status === "PENDING_REVIEW").length;

  const topProjects = [...filteredProjects]
    .sort((a, b) => projectProgress(b) - projectProgress(a))
    .slice(0, 6);

  const deliveryTeam = state.users.filter(isPortalDeliveryTeamUser).map((user) => {
    const assignedPhases = filteredPhases.filter((phase) => phase.assignedStaffId === user.id);
    const approved = assignedPhases.filter((phase) => phase.status === "APPROVED").length;
    const loadPercent = Math.min(100, (assignedPhases.length / 10) * 100);

    return {
      user,
      assigned: assignedPhases.length,
      approved,
      loadPercent,
    };
  });

  return (
    <div className="content">
      <section className="rounded-[30px] border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 px-6 py-7 shadow-[0_22px_65px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.28em] text-[#0064E0]">
              Workspace Intelligence
            </span>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-[46px]">
              Data
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-[15px]">
              Track revenue, payment movement, delivery progress, project health, package performance and team workload from live workspace records.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className="badge-blue">{filteredProjects.length} Filtered Projects</Badge>
              <Badge className="badge-green">{formatPercent(collectionRate)} Collection Rate</Badge>
              <Badge className="badge-orange">{awaitingApproval} Awaiting Approval</Badge>
              <Badge className="badge-purple">{filteredReviews.length} Reviews</Badge>
            </div>
          </div>

          <Card className="border-slate-200 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Package</span>
                <Select value={packageFilter} onChange={(event) => setPackageFilter(event.target.value)} className="h-11 rounded-2xl border-slate-200 text-sm">
                  <option value="ALL">All Packages</option>
                  {packageOptions.map((item) => (
                    <option key={item} value={item}>
                      {getPackageTitle(item as any)}
                    </option>
                  ))}
                </Select>
              </label>

              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Project Status</span>
                <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-2xl border-slate-200 text-sm">
                  <option value="ALL">All Status</option>
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>
                      {formatStatus(item)}
                    </option>
                  ))}
                </Select>
              </label>

              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Payment</span>
                <Select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="h-11 rounded-2xl border-slate-200 text-sm">
                  <option value="ALL">All Payments</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="REJECTED">Rejected</option>
                </Select>
              </label>

              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Date Window</span>
                <Select value={dateWindow} onChange={(event) => setDateWindow(event.target.value)} className="h-11 rounded-2xl border-slate-200 text-sm">
                  <option value="ALL">All Time</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="365">Last 12 Months</option>
                </Select>
              </label>
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <span className="text-sm font-bold text-slate-500">Confirmed Revenue</span>
          <strong className="mt-3 block text-3xl font-semibold tracking-[-0.055em] text-slate-950">{formatMoney(confirmedRevenue)}</strong>
          <p className="mt-2 text-sm font-medium text-slate-500">{confirmedPayments.length} confirmed payments</p>
        </Card>

        <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <span className="text-sm font-bold text-slate-500">Pending Revenue</span>
          <strong className="mt-3 block text-3xl font-semibold tracking-[-0.055em] text-slate-950">{formatMoney(pendingRevenue)}</strong>
          <p className="mt-2 text-sm font-medium text-slate-500">{unpaidPayments.length + pendingPayments.length} unpaid or pending</p>
        </Card>

        <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <span className="text-sm font-bold text-slate-500">Delivery Rate</span>
          <strong className="mt-3 block text-3xl font-semibold tracking-[-0.055em] text-slate-950">{formatPercent(deliveryRate)}</strong>
          <p className="mt-2 text-sm font-medium text-slate-500">{approvedPhases}/{filteredPhases.length} phases approved</p>
        </Card>

        <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <span className="text-sm font-bold text-slate-500">Payment Rate</span>
          <strong className="mt-3 block text-3xl font-semibold tracking-[-0.055em] text-slate-950">{formatPercent(paymentRate)}</strong>
          <p className="mt-2 text-sm font-medium text-slate-500">{confirmedPayments.length}/{filteredPayments.length} payment records</p>
        </Card>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 bg-white p-5">
          <span className="text-sm font-bold text-slate-500">Active Projects</span>
          <strong className="mt-3 block text-2xl tracking-[-0.04em] text-slate-950">{activeProjects}</strong>
          <p className="mt-2 text-sm text-slate-500">Currently moving through delivery</p>
        </Card>

        <Card className="border-slate-200 bg-white p-5">
          <span className="text-sm font-bold text-slate-500">Awaiting Deposit</span>
          <strong className="mt-3 block text-2xl tracking-[-0.04em] text-slate-950">{awaitingDeposit}</strong>
          <p className="mt-2 text-sm text-slate-500">Not fully opened yet</p>
        </Card>

        <Card className="border-slate-200 bg-white p-5">
          <span className="text-sm font-bold text-slate-500">Awaiting Balance</span>
          <strong className="mt-3 block text-2xl tracking-[-0.04em] text-slate-950">{awaitingBalance}</strong>
          <p className="mt-2 text-sm text-slate-500">Final phase payment gate</p>
        </Card>

        <Card className="border-slate-200 bg-white p-5">
          <span className="text-sm font-bold text-slate-500">Average Progress</span>
          <strong className="mt-3 block text-2xl tracking-[-0.04em] text-slate-950">{formatPercent(averageProgress)}</strong>
          <p className="mt-2 text-sm text-slate-500">{completedProjects} completed projects</p>
        </Card>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Card className="border-slate-200 bg-white p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">Project Health</h2>
            <p className="mt-1 text-sm text-slate-500">Filtered operational movement across delivery, approval and payment gates.</p>
          </div>

          <div className="grid gap-0 divide-y divide-slate-100">
            {[
              ["Active Phases", activePhases, "Work currently moving through delivery."],
              ["Locked Phases", lockedPhases, "Usually waiting for deposit, balance or previous approval."],
              ["Awaiting Approval", awaitingApproval, "Client review is required before movement continues."],
              ["Changes Requested", changesRequested, "Client requested adjustment or revision."],
              ["Deposit Due", formatMoney(depositDue), "Deposit not confirmed yet."],
              ["Balance Due", formatMoney(balanceDue), "Balance not confirmed yet."],
              ["Pending Requests", recentRequests, "Project requests waiting for admin action."],
            ].map(([label, value, helper]) => (
              <div key={String(label)} className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <strong className="text-sm font-bold text-slate-900">{label}</strong>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p>
                </div>
                <strong className="text-lg font-semibold tracking-[-0.035em] text-slate-950">{value}</strong>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-5">
          <Card className="border-slate-200 bg-white p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">Payment Breakdown</h2>
            </div>

            <div className="grid gap-3 p-5">
              {["UNPAID", "PENDING_CONFIRMATION", "CONFIRMED", "REJECTED"].map((status) => {
                const count = paymentCounts[status] ?? 0;
                const width = filteredPayments.length ? Math.round((count / filteredPayments.length) * 100) : 0;

                return (
                  <div key={status} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-bold text-slate-700">{formatStatus(status)}</span>
                      <strong className="text-sm text-slate-950">{count}</strong>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-[#0064E0]" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="border-slate-200 bg-white p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">Package Distribution</h2>
            </div>

            <div className="grid gap-3 p-5">
              {Object.entries(packageCounts).length ? (
                Object.entries(packageCounts).map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <strong className="block text-sm text-slate-950">{getPackageTitle(name as any)}</strong>
                      <span className="text-sm text-slate-500">{count} project{count > 1 ? "s" : ""}</span>
                    </div>
                    <strong className="text-slate-950">{count}</strong>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No package data in this filter.</p>
              )}
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">Top Project Movement</h2>
          </div>

          <div className="grid gap-3 p-5">
            {topProjects.length ? (
              topProjects.map((project) => {
                const progress = projectProgress(project);

                return (
                  <Link key={project.id} href={`/admin/projects/${project.id}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <strong className="block text-sm text-slate-950">{project.title}</strong>
                        <span className="mt-1 block text-sm text-slate-500">{project.businessName} • {getPackageTitle(project.packageType)}</span>
                      </div>
                      <Badge className={statusClass(project.status)}>{statusLabel(project.status)}</Badge>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-[#0064E0]" style={{ width: `${progress}%` }} />
                      </div>
                      <strong className="text-sm text-slate-900">{progress}%</strong>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No project matches this filter.</p>
            )}
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">Team Delivery Load</h2>
            <p className="mt-1 text-sm text-slate-500">Clients are excluded. Only staff and project managers appear here.</p>
          </div>

          <div className="grid gap-3 p-5">
            {deliveryTeam.length ? (
              deliveryTeam.map(({ user, assigned, approved, loadPercent }) => (
                <Link key={user.id} href={`/admin/team/${user.id}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <strong className="block text-sm text-slate-950">{user.name}</strong>
                      <span className="mt-1 block text-sm text-slate-500">{user.specialty ?? getPortalRoleLabel(user)}</span>
                    </div>
                    <strong className="text-sm text-slate-900">{assigned} phase{assigned === 1 ? "" : "s"}</strong>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-[#0064E0]" style={{ width: `${loadPercent}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{approved} approved</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500">No delivery team members found in this filter.</p>
            )}
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">Phase Status Distribution</h2>
          </div>

          <div className="grid gap-3 p-5">
            {Object.entries(phaseCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="text-sm font-bold text-slate-700">{formatStatus(status)}</span>
                <strong className="text-slate-950">{count}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-0 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">Project Status Distribution</h2>
          </div>

          <div className="grid gap-3 p-5">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="text-sm font-bold text-slate-700">{formatStatus(status)}</span>
                <strong className="text-slate-950">{count}</strong>
              </div>
            ))}
          </div>
        </Card>
      </section>
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
  return <PhaseWorkspaceDetail role="admin" projectId={projectId} phaseId={phaseId} />;
}
