"use client";

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
import { ProjectTeamNotes } from "./ProjectTeamNotes";
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
  const active = state.projects.filter((p) =>
    ["ACTIVE", "AWAITING_BALANCE"].includes(p.status),
  ).length;
  const awaiting = state.requests.filter(
    (r) => r.status === "PENDING_REVIEW",
  ).length;
  const overdue = state.projects
    .flatMap((p) => p.phases)
    .filter((p) => p.status === "CHANGES_REQUESTED").length;
  const completed = state.projects.filter(
    (p) => p.status === "COMPLETED",
  ).length;
  const packageCounts = (
    ["Launch", "Impact", "Growth", "Partner"] as PackageType[]
  ).map((pkg) => ({
    pkg,
    count: state.projects.filter((p) => p.packageType === pkg).length,
  }));
  return (
    <div className="content">
      <PageHeader
        title="Overview"
        subtitle="Monitor your projects and team"
        action={
          <Link href="/admin/projects/new">
            <Button>
              <Plus size={18} /> Create Project
            </Button>
          </Link>
        }
      />

      <div className="metric-grid">
        <MetricCard
          label="Active Projects"
          value={active}
          icon={Icons.projects}
          tone="blue"
        />
        <MetricCard
          label="Awaiting Approval"
          value={awaiting}
          icon={Icons.clock}
          tone="orange"
        />
        <MetricCard
          label="Overdue Phases"
          value={overdue}
          icon="!"
          tone="red"
        />
        <MetricCard
          label="Completed"
          value={completed}
          icon={Icons.check}
          tone="green"
        />
      </div>

      <div className="grid-2">
        <RecentProjects />

        <div className="stack">
          <Card>
            <div className="card-title">
              <h2>{Icons.clock} Pending Requests</h2>
            </div>
            <div className="card-body stack">
              {state.requests
                .filter((r) => r.status === "PENDING_REVIEW")
                .slice(0, 3)
                .map((request) => (
                  <Link
                    key={request.id}
                    href="/admin/project-requests"
                    className="payment-card"
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: 12,
                    }}
                  >
                    <div>
                      <strong>{request.projectName}</strong>
                      <p style={{ margin: 4, color: "var(--muted)" }}>
                        {request.businessName}
                      </p>
                    </div>
                    <Badge className="badge-orange">new</Badge>
                  </Link>
                ))}
              {!state.requests.filter((r) => r.status === "PENDING_REVIEW")
                .length && (
                <p style={{ color: "var(--muted)" }}>No pending requests.</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="card-title">
              <h2>By Package</h2>
            </div>
            <div className="card-body stack" style={{ gap: 20 }}>
              {packageCounts.map((item) => (
                <div key={item.pkg}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Badge className={packageClass(item.pkg)} style={{ fontWeight: 700 }}>{item.pkg}</Badge>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: 16 }}>{item.count}</strong>
                      <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>projects</span>
                    </div>
                  </div>
                  <ProgressBar
                    value={Math.max(5, (item.count / Math.max(1, state.projects.length)) * 100)}
                    style={{ height: 6, background: '#f1f5f9' }}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card style={{ marginTop: 24 }}>
        <div className="card-title">
          <h2>Team Workload</h2>
          <Link href="/admin/team" className="btn btn-ghost">
            Manage Team {Icons.arrow}
          </Link>
        </div>
        <div className="card-body workload-grid">
          {state.users
            .filter((u) => u.role !== "CLIENT" && u.role !== "SUPER_ADMIN")
            .map((user) => {
              const phases = state.projects
                .flatMap((project) => project.phases)
                .filter((phase) => phase.assignedStaffId === user.id).length;
              const loadPercent = Math.min(100, (phases / 10) * 100);
              const loadTone = phases > 7 ? "red" : phases > 4 ? "orange" : "blue";

              return (
                <div key={user.id} className="workload-card" role="link" tabIndex={0} title="Open team directory" onClick={() => { window.location.href = "/admin/team"; }} onKeyDown={(event) => { if (event.key === "Enter") window.location.href = "/admin/team"; }}>
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
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <strong>{user.name}</strong>
                      <Badge className={`badge-${loadTone}`} style={{ fontSize: 10 }}>
                        {phases > 7 ? "High" : "Optimal"}
                      </Badge>
                    </div>
                    <p>{user.specialty ?? user.role}</p>
                    <div className="workload-stat">
                      <span style={{ color: `var(--${loadTone})` }}>
                        {phases} active phases
                      </span>
                      <span>{Math.round(loadPercent)}%</span>
                    </div>
                    <ProgressBar
                      value={loadPercent}
                      style={{
                        height: 6,
                        background: "#e2e8f0",
                        "--progress-fill": `var(--${loadTone})`,
                      } as any}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </Card>
    </div>
  );
}

export function AdminProjects() {
  const { state, deleteProject } = useApp();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [status, setStatus] = useState("All Status");
  const [pkg, setPkg] = useState("All Packages");

  const activeCount = state.projects.filter((p) =>
    ["ACTIVE", "AWAITING_BALANCE"].includes(p.status),
  ).length;
  const awaitingDeposit = state.projects.filter(
    (p) => p.status === "APPROVED_AWAITING_DEPOSIT",
  ).length;
  const completedCount = state.projects.filter(
    (p) => p.status === "COMPLETED",
  ).length;

  const filteredProjects = state.projects.filter((p) => {
    const matchesStatus = status === "All Status" || p.status === status;
    const matchesPkg = pkg === "All Packages" || p.packageType === pkg;
    return matchesStatus && matchesPkg;
  });

  return (
    <div className="content">
      <PageHeader
        title="Projects"
        subtitle={`${state.projects.length} total projects`}
        action={
          <Link href="/admin/projects/new">
            <Button>
              <Plus size={18} /> Create Project
            </Button>
          </Link>
        }
      />

      <div className="metric-grid">
        <MetricCard
          label="Active Projects"
          value={activeCount}
          icon={Icons.projects}
          tone="blue"
        />
        <MetricCard
          label="Awaiting Deposit"
          value={awaitingDeposit}
          icon={Icons.clock}
          tone="orange"
        />
        <MetricCard
          label="Completed"
          value={completedCount}
          icon={Icons.check}
          tone="green"
        />
      </div>

      <div className="grid-1" style={{ marginTop: 24 }}>
        <DataList
          title={<h2>Project Portfolio</h2>}
          defaultView="grid"
          allowedViews={["grid", "grid2", "grid3", "list"]}
          data={filteredProjects}
          actions={
            <div
              className="datalist-filters"
              style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
            >
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ minWidth: 130, height: 36, fontSize: 13, flex: 1 }}
              >
                <option>All Status</option>
                <option>ACTIVE</option>
                <option>APPROVED_AWAITING_DEPOSIT</option>
                <option>PENDING_REVIEW</option>
                <option>COMPLETED</option>
              </Select>
              <Select
                value={pkg}
                onChange={(e) => setPkg(e.target.value)}
                style={{ minWidth: 130, height: 36, fontSize: 13, flex: 1 }}
              >
                <option>All Packages</option>
                <option>Launch</option>
                <option>Impact</option>
                <option>Growth</option>
                <option>Partner</option>
                <option>Custom</option>
              </Select>
            </div>
          }
          filterFn={(project, query) => {
            const text =
              `${project.title} ${project.businessName} ${project.status} ${project.packageType} ${project.projectCode}`.toLowerCase();
            return text.includes(query.toLowerCase());
          }}
          itemsPerPage={9}
          emptyState={
            <EmptyState
              title="No projects found"
              body="No projects match your search criteria."
            />
          }
          renderItem={(project, view) => {
            if (view.startsWith("grid")) {
              return (
                <Card
                  key={project.id}
                  className="project-card"
                  style={{ position: "relative" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Badge className={packageClass(project.packageType)}>
                      {project.packageType}
                    </Badge>
                    <ActionMenu>
                      <Link href={`/admin/projects/${project.id}`}>
                        <Edit3 size={15} /> Open details
                      </Link>
                      <Button
                        variant="ghost"
                        className="danger"
                        style={{
                          color: "var(--danger)",
                          width: "100%",
                          justifyContent: "flex-start",
                          height: 32,
                          padding: "0 8px",
                        }}
                        loading={pendingAction === `delete-${project.id}`}
                        onClick={async () => {
                          if (
                            confirm(
                              `Are you sure you want to delete ${project.title}?`,
                            )
                          ) {
                            setPendingAction(`delete-${project.id}`);
                            try {
                              await deleteProject(project.id);
                            } finally {
                              setPendingAction(null);
                            }
                          }
                        }}
                      >
                        <Trash2 size={15} /> Delete project
                      </Button>
                    </ActionMenu>
                  </div>
                  <Link href={`/admin/projects/${project.id}`}>
                    <div>
                      <h3>{project.title}</h3>
                      <p>{project.businessName}</p>
                    </div>
                    <Badge className={statusClass(project.status)}>
                      {statusLabel(project.status)}
                    </Badge>
                    <div className="project-card-footer">
                      <div className="timeline-row">
                        <span style={{ color: "var(--muted)" }}>Progress</span>
                        <strong>
                          {
                            project.phases.filter(
                              (p) => p.status === "APPROVED",
                            ).length
                          }
                          /{project.phases.length} phases
                        </strong>
                      </div>
                      <ProgressBar value={projectProgress(project)} />
                    </div>
                  </Link>
                </Card>
              );
            }

            return (
              <div
                key={project.id}
                className="deliverable-row"
                style={{
                  padding: "16px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div className="deliverable-main" style={{ gap: 16 }}>
                  <div
                    className={`metric-icon tone-${project.status === "COMPLETED" ? "green" : ["ACTIVE", "AWAITING_BALANCE"].includes(project.status) ? "blue" : "orange"}`}
                    style={{ width: 40, height: 40, fontSize: 16 }}
                  >
                    {Icons.projects}
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>
                      {project.title}
                    </h3>
                    <p style={{ color: "var(--muted)", margin: 0 }}>
                      {project.businessName} â€¢ {project.packageType}
                    </p>
                    <div style={{ marginTop: 8 }}>
                      <Badge className={statusClass(project.status)}>
                        {statusLabel(project.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                  <div style={{ width: 160 }}>
                    <div
                      className="timeline-row"
                      style={{ marginBottom: 8, fontSize: 13 }}
                    >
                      <span style={{ color: "var(--muted)" }}>Progress</span>
                      <strong>{projectProgress(project)}%</strong>
                    </div>
                    <ProgressBar value={projectProgress(project)} />
                  </div>
                  <ActionMenu>
                    <Link href={`/admin/projects/${project.id}`}>
                      View Details
                    </Link>
                    <Button
                      variant="ghost"
                      className="danger"
                      style={{
                        color: "var(--danger)",
                        width: "100%",
                        justifyContent: "flex-start",
                        height: 32,
                        padding: "0 8px",
                      }}
                      onClick={async () => {
                        if (
                          confirm(
                            `Are you sure you want to delete ${project.title}?`,
                          )
                        ) {
                          await deleteProject(project.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </ActionMenu>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

export function AdminProjectDetail({ projectId }: { projectId: string }) {
  const { state, assignPhase, addDeliverable, requestPhaseApproval } = useApp();
  const [assigning, setAssigning] = useState<ProjectPhase | null>(null);
  const [adding, setAdding] = useState<ProjectPhase | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const project = state.projects.find((p) => p.id === projectId);
  if (!project)
    return (
      <div className="content">
        <EmptyState
          title="Project not found"
          body="The selected project could not be found."
        />
      </div>
    );
  const pm = state.users.find((user) => user.id === project.projectManagerId);
  return (
    <div className="content narrow">
      <BackLink href="/admin/projects" label="Back to Projects" />
      <Card className="project-hero">
        <div className="project-hero-top">
          <div>
            <div style={{ display: "flex", gap: 10 }}>
              <Badge className={packageClass(project.packageType)}>
                {project.packageType}
              </Badge>
              <Badge className={statusClass(project.status)}>
                {statusLabel(project.status)}
              </Badge>
            </div>
            <h1>{project.title}</h1>
            <p>
              {project.businessName} â€¢ {project.clientEmail}
            </p>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 120 }}>
              <ProgressBar value={projectProgress(project)} />
            </div>
            <Button variant="secondary">Contact Client</Button>
          </div>
        </div>
        <div className="project-hero-bottom">
          <div className="kv">
            <span>Phases</span>
            <strong>
              {project.phases.filter((p) => p.status === "APPROVED").length} /{" "}
              {project.phases.length} complete
            </strong>
          </div>
          <div className="kv">
            <span>Target Date</span>
            <strong>{project.targetDate ?? "Not set"}</strong>
          </div>
          <div className="kv">
            <span>Project Code</span>
            <strong>{project.projectCode}</strong>
          </div>
          <div className="kv">
            <span>PM</span>
            <strong>{pm?.name ?? "Unassigned"}</strong>
          </div>
        </div>
      </Card>
      <nav className="tabs project-tabs" aria-label="Project sections">
        <a className="active" href="#project-phases">Phases</a>
        <a href="#project-team">Team</a>
        <a href="#project-notes">Notes</a>
      </nav>
      <div id="project-phases" className="stack">
        {project.phases.map((phase) => (
          <Card
            key={phase.id}
            className={`phase-card ${toneForPhase(phase.status)}`}
          >
            <div className="phase-head">
              <div className="phase-title">
                <div className="phase-number">
                  {phase.status === "APPROVED"
                    ? Icons.check
                    : phase.phaseNumber}
                </div>
                <div>
                  <h2 style={{ margin: 0 }}>{phase.title}</h2>
                  <Badge className={statusClass(phase.status)}>
                    {statusLabel(phase.status)}
                  </Badge>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button variant="ghost" onClick={() => setAssigning(phase)}>
                  <UserPlus size={16} /> Assign
                </Button>
                <Button variant="ghost" onClick={() => setAdding(phase)}>
                  <Plus size={16} /> Add Deliverable
                </Button>
                <Button
                  variant="primary"
                  loading={pendingAction === `approve-${phase.id}`}
                  onClick={async () => {
                    setPendingAction(`approve-${phase.id}`);
                    try {
                      await requestPhaseApproval(phase.id);
                    } finally {
                      setPendingAction(null);
                    }
                  }}
                  disabled={
                    phase.status === "APPROVED" || phase.status === "LOCKED"
                  }
                >
                  Request Approval
                </Button>
                <Link
                  href={`/admin/projects/${project.id}/phases/${phase.id}`}
                  className="btn btn-ghost"
                >
                  View Details
                </Link>
              </div>
            </div>
            <DeliverableManager phase={phase} />
          </Card>
        ))}
      </div>
      <ProjectTeamNotes project={project} users={state.users} />

      {assigning && (
        <AssignModal
          phase={assigning}
          onClose={() => setAssigning(null)}
          onAssign={(staffId) => {
            assignPhase(assigning.id, staffId);
            setAssigning(null);
          }}
        />
      )}
      {adding && (
        <AddDeliverableModal
          phase={adding}
          onClose={() => setAdding(null)}
          onSubmit={(payload) => {
            addDeliverable(adding.id, payload);
            setAdding(null);
          }}
        />
      )}
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
                {u.name} â€” {u.specialty ?? u.role}
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
                      âœ“
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
                  value={form.targetDate}
                  onChange={(e) =>
                    setForm({ ...form, targetDate: e.target.value })
                  }
                  placeholder="May 9, 2026"
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
            Create Project âœ“
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
                  {req.businessName} â€¢ {req.projectGoal}
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
      title={`Review ${request.projectName}`}
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
                âœ¨
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
              value={form.targetDate}
              disabled={!isPending}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              placeholder="May 9, 2026"
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
              Approve & Request Deposit âœ“
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function AdminClients() {
  const { state } = useApp();

  const totalClients = state.users.filter((u) => u.role === "CLIENT").length;
  const highValue = state.users.filter(
    (u) =>
      u.role === "CLIENT" &&
      state.projects.filter((p) => p.clientId === u.id).length >= 2,
  ).length;
  const activeProjects = state.projects.filter(
    (p) => p.status === "ACTIVE",
  ).length;

  return (
    <div className="content">
      <PageHeader
        title="Clients"
        subtitle={`${totalClients} registered clients`}
      />

      <div className="metric-grid">
        <MetricCard
          label="Total Clients"
          value={totalClients}
          icon={Icons.clients}
          tone="blue"
        />
        <MetricCard
          label="High Value"
          value={highValue}
          icon="â˜…"
          tone="orange"
        />
        <MetricCard
          label="Active Projects"
          value={activeProjects}
          icon={Icons.projects}
          tone="purple"
        />
      </div>

      <div className="grid-1" style={{ marginTop: 24 }}>
        <DataList
          title={<h2>Client Directory</h2>}
          data={state.users.filter((u) => u.role === "CLIENT")}
          defaultView="grid2"
          allowedViews={["grid2", "list"]}
          filterFn={(u, q) =>
            `${u.name} ${u.email} ${u.company}`
              .toLowerCase()
              .includes(q.toLowerCase())
          }
          renderItem={(client, view) => {
            const projects = state.projects.filter(
              (p) => p.clientId === client.id,
            );

            if (view === "list") {
              return (
                <div
                  key={client.id}
                  className="deliverable-row"
                  style={{
                    padding: "16px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <div className="deliverable-main">
                    <div className="avatar">{client.name[0]}</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16 }}>
                        {client.company ?? client.name}
                      </h3>
                      <p style={{ color: "var(--muted)", margin: 0 }}>
                        {client.email}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: 32, alignItems: "center" }}
                  >
                    <div style={{ textAlign: "right" }}>
                      <strong>{projects.length}</strong>
                      <p
                        style={{
                          color: "var(--muted)",
                          margin: 0,
                          fontSize: 12,
                        }}
                      >
                        Projects
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[...new Set(projects.map((p) => p.packageType))].map(
                        (p) => (
                          <Badge key={p} className={packageClass(p)}>
                            {p[0]}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Card key={client.id} className="card-body">
                <div className="deliverable-main" style={{ marginBottom: 20 }}>
                  <div className="avatar" style={{ width: 48, height: 48 }}>
                    {client.name[0]}
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {client.company ?? client.name}
                    </h3>
                    <p style={{ color: "var(--muted)", margin: 4 }}>
                      {client.email}
                    </p>
                  </div>
                </div>
                <div className="grid-3" style={{ margin: "22px 0" }}>
                  <div>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      Active
                    </span>
                    <strong style={{ display: "block", fontSize: 18 }}>
                      {projects.filter((p) => p.status === "ACTIVE").length}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      Done
                    </span>
                    <strong style={{ display: "block", fontSize: 18 }}>
                      {projects.filter((p) => p.status === "COMPLETED").length}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      Total
                    </span>
                    <strong style={{ display: "block", fontSize: 18 }}>
                      {projects.length}
                    </strong>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[...new Set(projects.map((p) => p.packageType))].map((p) => (
                    <Badge key={p} className={packageClass(p)}>
                      {p}
                    </Badge>
                  ))}
                </div>
              </Card>
            );
          }}
        />
      </div>
    </div>
  );
}

export function AdminTemplates() {
  const { state, createTemplate, updateTemplate, deleteTemplate } = useApp();
  const [modal, setModal] = useState<ProjectTemplate | "new" | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const avgPhases = Math.round(
    state.templates.reduce((acc, t) => acc + t.phases.length, 0) /
      state.templates.length || 0,
  );

  return (
    <div className="content">
      <PageHeader
        title="Templates"
        subtitle="Manage standardized project structures"
        action={
          <Button onClick={() => setModal("new")}>
            <Plus size={18} /> Create Template
          </Button>
        }
      />

      <div className="metric-grid">
        <MetricCard
          label="Total Templates"
          value={state.templates.length}
          icon={Icons.templates}
          tone="purple"
        />
        <MetricCard
          label="Avg. Phases"
          value={avgPhases}
          icon={Icons.phases}
          tone="blue"
        />
        <MetricCard
          label="Ready Packages"
          value={new Set(state.templates.map((t) => t.packageType)).size}
          icon={Icons.check}
          tone="green"
        />
      </div>

      <div className="grid-1" style={{ marginTop: 24 }}>
        <DataList
          title={<h2>Standard Packages</h2>}
          data={state.templates}
          defaultView="grid"
          allowedViews={["grid", "list"]}
          filterFn={(t, q) =>
            `${t.name} ${t.packageType} ${t.description}`
              .toLowerCase()
              .includes(q.toLowerCase())
          }
          renderItem={(template, view) => {
            if (view === "list") {
              const isOpen = open[template.id];

              return (
                <div key={template.id} className="template-list-item">
                  <div
                    className="deliverable-row"
                    style={{ padding: "16px 0" }}
                  >
                    <div className="deliverable-main">
                      <div
                        className="package-icon"
                        style={{
                          width: 44,
                          height: 44,
                          fontSize: 18,
                          borderRadius: 14,
                        }}
                      >
                        {template.packageType[0]}
                      </div>

                      <div>
                        <h3
                          style={{ margin: 0, fontSize: 16, fontWeight: 800 }}
                        >
                          {template.name}
                        </h3>
                        <p
                          style={{
                            color: "var(--muted)",
                            margin: "2px 0 0",
                            fontSize: 13,
                          }}
                        >
                          {template.phases.length} Phases â€¢{" "}
                          <span style={{ color: "var(--primary)" }}>
                            {template.packageType}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                      <Button
                        variant="secondary"
                        onClick={() => setModal(template)}
                        style={{ height: 32, padding: "0 14px", fontSize: 13 }}
                      >
                        Edit
                      </Button>
                      <button
                        className="icon-btn"
                        style={{
                          background: isOpen ? "var(--primary-soft)" : "",
                          color: isOpen ? "var(--primary)" : "",
                        }}
                        onClick={() =>
                          setOpen((prev) => ({
                            ...prev,
                            [template.id]: !prev[template.id],
                          }))
                        }
                      >
                        {isOpen ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="phase-list-nested">
                      {template.phases.map((p, i) => (
                        <div key={p.id} className="phase-row-compact">
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              alignItems: "center",
                            }}
                          >
                            <span className="badge badge-slate">{i + 1}</span>
                            <strong style={{ fontWeight: 600 }}>
                              {p.title}
                            </strong>
                          </div>
                          <span
                            style={{
                              color: "var(--muted)",
                              fontSize: 12,
                              background: "#f1f5f9",
                              padding: "2px 8px",
                              borderRadius: 6,
                            }}
                          >
                            {p.deliverables.length} deliverables
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Card key={template.id} className="card-body">
                <div className="deliverable-main">
                  <div className="package-icon">{template.packageType[0]}</div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: 18 }}>{template.name}</h2>
                    <Badge className={packageClass(template.packageType)}>
                      {template.packageType}
                    </Badge>
                  </div>

                  <ActionMenu>
                    <button onClick={() => setModal(template)}>
                      <Edit3 size={15} /> Edit template
                    </button>

                    <Button
                      variant="ghost"
                      className="danger"
                      style={{
                        color: "var(--danger)",
                        width: "100%",
                        justifyContent: "flex-start",
                        height: 32,
                        padding: "0 8px",
                      }}
                      loading={pendingAction === `delete-${template.id}`}
                      onClick={async () => {
                        if (
                          confirm(
                            `Are you sure you want to delete ${template.packageType} template?`,
                          )
                        ) {
                          setPendingAction(`delete-${template.id}`);
                          try {
                            await deleteTemplate(template.id);
                          } finally {
                            setPendingAction(null);
                          }
                        }
                      }}
                    >
                      <Trash2 size={15} /> Delete template
                    </Button>
                  </ActionMenu>
                </div>

                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: 14,
                    margin: "12px 0 20px",
                    lineHeight: 1.5,
                  }}
                >
                  {template.description}
                </p>

                <div className="template-phase-header">
                  <strong>{template.phases.length} Phases</strong>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setOpen((prev) => ({
                        ...prev,
                        [template.id]: !prev[template.id],
                      }))
                    }
                    style={{ fontSize: 13 }}
                  >
                    {open[template.id] ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}{" "}
                    {open[template.id] ? "Collapse" : "Expand"}
                  </Button>
                </div>

                {open[template.id] && (
                  <div className="stack" style={{ marginTop: 18 }}>
                    {template.phases.map((p, i) => (
                      <div className="template-phase-row" key={p.id}>
                        <div className="deliverable-main">
                          <span
                            className="badge badge-slate"
                            style={{ minWidth: 24, justifyContent: "center" }}
                          >
                            {i + 1}
                          </span>
                          <strong style={{ fontSize: 14 }}>{p.title}</strong>
                        </div>
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>
                          {p.deliverables.length} deliverables
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          }}
        />
      </div>

      {modal && (
        <TemplateModal
          template={modal === "new" ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={async (payload) => {
            modal === "new"
              ? await createTemplate(payload)
              : await updateTemplate((modal as ProjectTemplate).id, payload);
            setModal(null);
          }}
        />
      )}
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
  const { state, createTeamMember, updateTeamMember, deleteTeamMember } =
    useApp();
  const [modal, setModal] = useState<User | "new" | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const team = state.users.filter((u) => u.role !== "CLIENT");

  // Pre-calculate assignments for metrics and sorting
  const teamWithStats = team.map((member) => {
    const assigned = state.projects
      .flatMap((p) => p.phases)
      .filter((phase) => phase.assignedStaffId === member.id).length;
    return { ...member, assigned };
  });

  const totalPhases = teamWithStats.reduce((sum, m) => sum + m.assigned, 0);
  const highLoad = teamWithStats.filter((m) => m.assigned > 5).length;

  return (
    <div className="content">
      <PageHeader
        title="Team"
        subtitle="Manage your agency staff and workload"
        action={
          <Button onClick={() => setModal("new")}>
            <Plus size={18} /> Add Team Member
          </Button>
        }
      />

      <div className="metric-grid">
        <MetricCard
          label="Total Members"
          value={team.length}
          icon={Icons.team}
          tone="blue"
        />
        <MetricCard
          label="Active Phases"
          value={totalPhases}
          icon={Icons.phases}
          tone="purple"
        />
        <MetricCard
          label="High Load Staff"
          value={highLoad}
          icon="!"
          tone="red"
        />
      </div>

      <div className="grid-1" style={{ marginTop: 24 }}>
        <DataList
          title={<h2>Team Directory</h2>}
          defaultView="grid"
          allowedViews={["list", "grid", "grid2"]}
          data={teamWithStats}
          filterFn={(member, query) => {
            const text =
              `${member.name} ${member.email} ${member.specialty} ${member.role}`.toLowerCase();
            return text.includes(query.toLowerCase());
          }}
          itemsPerPage={8}
          emptyState={
            <EmptyState
              title="No team members"
              body="No staff match your criteria."
            />
          }
          renderItem={(member, view) => {
            if (view.startsWith("grid")) {
              return (
                <Card key={member.id} className="card-body">
                  <div className="deliverable-main">
                    <div className="avatar">{member.name[0]}</div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0 }}>{member.name}</h3>
                      <p
                        style={{
                          margin: "4px 0",
                          color: "var(--muted)",
                          fontSize: 13,
                        }}
                      >
                        âœ‰ {member.email}
                      </p>
                    </div>
                    <ActionMenu>
                      <button onClick={() => setModal(member)}>
                        <Edit3 size={15} /> Edit member
                      </button>

                      <Button
                        variant="ghost"
                        className="danger"
                        style={{
                          color: "var(--danger)",
                          width: "100%",
                          justifyContent: "flex-start",
                          height: 32,
                          padding: "0 8px",
                        }}
                        loading={pendingAction === `delete-${member.id}`}
                        onClick={async () => {
                          if (
                            confirm(
                              `Are you sure you want to delete ${member.name}?`,
                            )
                          ) {
                            setPendingAction(`delete-${member.id}`);
                            try {
                              await deleteTeamMember(member.id);
                            } finally {
                              setPendingAction(null);
                            }
                          }
                        }}
                      >
                        <Trash2 size={15} /> Delete member
                      </Button>
                    </ActionMenu>
                  </div>

                  <div
                    className="timeline-row"
                    style={{ marginTop: 20, marginBottom: 12 }}
                  >
                    <span style={{ fontSize: 14 }}>
                      â–£ {member.assigned} active phases
                    </span>
                    {member.assigned > 5 && (
                      <Badge className="badge-red">High load</Badge>
                    )}
                  </div>

                  <Badge className="badge-purple">
                    {member.specialty ?? statusLabel(member.role)}
                  </Badge>
                </Card>
              );
            }

            return (
              <div
                key={member.id}
                className="deliverable-row"
                style={{
                  padding: "16px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div className="deliverable-main" style={{ gap: 16 }}>
                  <div className="avatar" style={{ width: 40, height: 40 }}>
                    {member.name[0]}
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>
                      {member.name}
                    </h3>
                    <p
                      style={{ color: "var(--muted)", margin: 0, fontSize: 14 }}
                    >
                      {member.email}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ textAlign: "right" }}>
                    <Badge className="badge-purple">
                      {member.specialty ?? statusLabel(member.role)}
                    </Badge>
                  </div>
                  <div style={{ width: 140, textAlign: "right" }}>
                    <strong>{member.assigned} phases</strong>
                    {member.assigned > 5 && (
                      <p
                        style={{
                          color: "var(--danger)",
                          fontSize: 12,
                          margin: 0,
                        }}
                      >
                        High Load
                      </p>
                    )}
                  </div>
                  <ActionMenu>
                    <button onClick={() => setModal(member)}>
                      <Edit3 size={14} /> Edit
                    </button>
                    <Button
                      variant="ghost"
                      className="danger"
                      style={{
                        color: "var(--danger)",
                        width: "100%",
                        justifyContent: "flex-start",
                        height: 32,
                        padding: "0 8px",
                      }}
                      loading={pendingAction === `delete-${member.id}`}
                      onClick={async () => {
                        if (
                          confirm(
                            `Are you sure you want to delete ${member.name}?`,
                          )
                        ) {
                          setPendingAction(`delete-${member.id}`);
                          try {
                            await deleteTeamMember(member.id);
                          } finally {
                            setPendingAction(null);
                          }
                        }
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </ActionMenu>
                </div>
              </div>
            );
          }}
        />
      </div>

      {modal && (
        <TeamModal
          member={modal === "new" ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={async (payload) => {
            modal === "new"
              ? await createTeamMember(payload)
              : await updateTeamMember((modal as User).id, payload);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function TeamModal({
  member,
  onClose,
  onSave,
}: {
  member?: User;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    email: string;
    specialty: string;
    role: Role;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: member?.name ?? "",
    email: member?.email ?? "",
    specialty: member?.specialty ?? "Designer",
    role: member?.role ?? ("STAFF" as Role),
  });

  return (
    <Modal
      title={member ? "Edit Team Member" : "Add Team Member"}
      onClose={onClose}
    >
      <div className="stack">
        <Field label="Name *">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
          />
        </Field>

        <Field label="Email *">
          <Input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@company.com"
          />
        </Field>

        <Field label="Specialty *">
          <Select
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          >
            <option>Designer</option>
            <option>Developer</option>
            <option>Strategist</option>
            <option>Copywriter</option>
            <option>Project Manager</option>
          </Select>
        </Field>

        <Field label="Access Role">
          <Select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            <option value="STAFF">Staff</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </Select>
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () =>
              form.name.trim() && form.email.trim() && (await onSave(form))
            }
          >
            {member ? "Save Changes" : "Add Member"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function AdminPayments() {
  const { state, confirmPayment, rejectPayment } = useApp();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const rows = state.projects.flatMap((project) =>
    project.payments.map((payment) => ({ project, payment })),
  );

  const pending = rows.filter(
    (r) => r.payment.status === "PENDING_CONFIRMATION",
  );
  const unpaid = rows.filter((r) => r.payment.status === "UNPAID");
  const confirmed = rows.filter((r) => r.payment.status === "CONFIRMED");

  const pendingAmount = pending.reduce((sum, r) => sum + r.payment.amount, 0);
  const unpaidAmount = unpaid.reduce((sum, r) => sum + r.payment.amount, 0);
  const confirmedAmount = confirmed.reduce(
    (sum, r) => sum + r.payment.amount,
    0,
  );

  // Sort: Pending first, then Unpaid, then Confirmed
  const sortedRows = [...pending, ...unpaid, ...confirmed];

  return (
    <div className="content">
      <PageHeader
        title="Payments"
        subtitle="Confirm manual deposits and balance payments"
      />

      <div className="metric-grid">
        <MetricCard
          label="Requires Confirmation"
          value={formatNaira(pendingAmount)}
          icon={Icons.clock}
          tone="orange"
        />
        <MetricCard
          label="Confirmed Revenue"
          value={formatNaira(confirmedAmount)}
          icon={Icons.payments}
          tone="green"
        />
        <MetricCard
          label="Awaiting Payment"
          value={formatNaira(unpaidAmount)}
          icon={Icons.phases}
          tone="blue"
        />
      </div>

      <div className="grid-1" style={{ marginTop: 24 }}>
        <DataList
          title={<h2>Transaction History</h2>}
          defaultView="grid"
          allowedViews={["list", "grid", "grid2", "grid3"]}
          data={sortedRows}
          filterFn={(row, query) => {
            const text =
              `${row.project.title} ${row.project.businessName} ${row.payment.reference} ${row.payment.type} ${row.payment.status}`.toLowerCase();
            return text.includes(query.toLowerCase());
          }}
          itemsPerPage={10}
          emptyState={
            <EmptyState
              title="No transactions"
              body="No payments match your criteria."
            />
          }
          renderItem={({ project, payment }, view) => {
            const statusTone =
              payment.status === "CONFIRMED"
                ? "success"
                : payment.status === "PENDING_CONFIRMATION"
                  ? "warning"
                  : payment.status === "UNPAID"
                    ? "blue"
                    : "danger";

            if (view.startsWith("grid")) {
              return (
                <div
                  key={payment.id}
                  style={{
                    background: `var(--${statusTone}-soft)`,
                    border: `1px solid transparent`,
                    borderRadius: 16,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = `var(--${statusTone})`;
                    e.currentTarget.style.boxShadow =
                      "0 8px 24px rgba(0,0,0,0.05)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <Badge className={statusClass(payment.status)}>
                        {statusLabel(payment.status)}
                      </Badge>
                      <h3 style={{ margin: "12px 0 4px", fontSize: 16 }}>
                        {project.title}
                      </h3>
                      <p
                        style={{
                          color: "var(--muted)",
                          margin: 0,
                          fontSize: 13,
                        }}
                      >
                        {payment.type} â€¢ {project.businessName}
                      </p>
                    </div>
                    <div
                      className={`metric-icon tone-${statusTone === "success" ? "green" : statusTone === "warning" ? "orange" : "blue"}`}
                      style={{ width: 40, height: 40, fontSize: 18 }}
                    >
                      {payment.type === "DEPOSIT" ? Icons.arrow : Icons.check}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Amount
                      </span>
                      <strong style={{ fontSize: 20, display: "block" }}>
                        {formatNaira(payment.amount)}
                      </strong>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {payment.status === "PENDING_CONFIRMATION" && (
                        <Button
                          variant="success"
                          style={{ height: 32, fontSize: 13, padding: "0 12px" }}
                          loading={pendingAction === `confirm-${payment.id}`}
                          onClick={async () => {
                            setPendingAction(`confirm-${payment.id}`);
                            try {
                              await confirmPayment(payment.id);
                            } finally {
                              setPendingAction(null);
                            }
                          }}
                        >
                          Confirm âœ“
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={payment.id}
                className="deliverable-row"
                style={{
                  padding: "16px",
                  borderRadius: 16,
                  background: `var(--${statusTone}-soft)`,
                  marginBottom: 12,
                  alignItems: "center",
                }}
              >
                <div className="deliverable-main" style={{ gap: 16, flex: 1 }}>
                  <div
                    className={`metric-icon tone-${statusTone === "success" ? "green" : statusTone === "warning" ? "orange" : "blue"}`}
                    style={{ width: 44, height: 44, fontSize: 18 }}
                  >
                    {payment.type === "DEPOSIT" ? Icons.arrow : Icons.check}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 2px", fontSize: 16 }}>
                      {project.title} â€” {payment.type}
                    </h3>
                    <p style={{ color: "var(--muted)", margin: 0, fontSize: 13 }}>
                      {project.businessName} â€¢ Ref: {payment.reference}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", marginRight: 24 }}>
                    <strong style={{ display: "block", fontSize: 18 }}>
                      {formatNaira(payment.amount)}
                    </strong>
                    <Badge className={statusClass(payment.status)} style={{ fontSize: 11 }}>
                      {statusLabel(payment.status)}
                    </Badge>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {payment.status === "PENDING_CONFIRMATION" && (
                    <>
                      <Button
                        variant="secondary"
                        style={{ height: 36, fontSize: 13 }}
                        onClick={async () => {
                          if (confirm("Reject this payment?")) {
                            setPendingAction(`reject-${payment.id}`);
                            try {
                              await rejectPayment(payment.id);
                            } finally {
                              setPendingAction(null);
                            }
                          }
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="success"
                        style={{ height: 36, fontSize: 13 }}
                        loading={pendingAction === `confirm-${payment.id}`}
                        onClick={async () => {
                          setPendingAction(`confirm-${payment.id}`);
                          try {
                            await confirmPayment(payment.id);
                          } finally {
                            setPendingAction(null);
                          }
                        }}
                      >
                        Confirm âœ“
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

export function AdminAnalytics() {
  const { state, dataLoading } = useApp();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const projectsLoaded = state.projects?.length > 0;
  const total = state.projects?.length;
  const active = state.projects?.filter((p) => p.status === "ACTIVE").length;
  const overdue =
    state?.projects
      ?.flatMap((p) => p.phases)
      ?.filter((p) => p.status === "CHANGES_REQUESTED")?.length || 0;
  const packageData = (
    ["Launch", "Impact", "Growth", "Partner"] as PackageType[]
  ).map((name) => ({
    name,
    value: state?.projects?.filter((p) => p.packageType === name).length,
  }));
  const phaseStatus = [
    "NOT_STARTED",
    "IN_PROGRESS",
    "AWAITING_APPROVAL",
    "APPROVED",
  ].map((s) => ({
    status: statusLabel(s as any),
    count:
      state?.projects?.flatMap((p) => p.phases)?.filter((p) => p.status === s)
        ?.length || 0,
  }));
  const COLORS = ["#0064E0", "#f59e0b", "#10b981", "#0064E0"];
  return (
    <div className="content">
      <PageHeader
        title="Analytics"
        subtitle="Track your team's performance and project metrics"
      />
      <div className="metric-grid">
        {(!projectsLoaded && dataLoading) || !isMounted ? (
          <>
            <Skeleton height={120} />
            <Skeleton height={120} />
            <Skeleton height={120} />
            <Skeleton height={120} />
          </>
        ) : (
          <>
            <MetricCard
              label="Total Projects"
              value={total}
              icon={Icons.analytics}
            />
            <MetricCard
              label="Active Projects"
              value={active}
              icon="â—Ž"
              tone="blue"
            />
            <MetricCard
              label="On-Time Rate"
              value="100%"
              icon={Icons.clock}
              tone="green"
            />
            <MetricCard
              label="Overdue Phases"
              value={overdue}
              icon="!"
              tone="red"
            />
          </>
        )}
      </div>
      <div className="grid-2">
        <Card className="chart-card">
          <div className="card-title">
            <h2>Projects by Package</h2>
          </div>
          <div className="card-body" style={{ height: 310, minWidth: 0 }}>
            {(!projectsLoaded && dataLoading) || !isMounted ? (
              <Skeleton height="100%" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={packageData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={64}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {packageData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card className="chart-card">
          <div className="card-title">
            <h2>Phases by Status</h2>
          </div>
          <div className="card-body" style={{ height: 310, minWidth: 0 }}>
            {(!projectsLoaded && dataLoading) || !isMounted ? (
              <Skeleton height="100%" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={phaseStatus}
                  layout="vertical"
                  margin={{ left: 30 }}
                >
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="status" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0064E0" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
      <Card style={{ marginTop: 24 }}>
        <div className="card-title">
          <h2>AI Delivery Health</h2>
        </div>
        <div className="card-body stack">
          {state.projects.slice(0, 3).map((p) => (
            <p key={p.id}>{generateProjectSummary(p)}</p>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AdminReviews() {
  const { state } = useApp();
  return (
    <div className="content narrow">
      <PageHeader
        title="Reviews"
        subtitle="Client reviews after completed projects"
      />
      {state.reviews.length ? (
        <div className="stack">
          {state.reviews.map((r) => (
            <Card key={r.id} className="card-body">
              <strong>{"â˜…".repeat(r.rating)}</strong>
              <p>{r.comment}</p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No reviews yet"
          body="Client reviews will appear after completed projects."
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






