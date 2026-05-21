"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Star, Wallet } from "lucide-react";

import type { PackageType, Project, ProjectRequest, ProjectTemplate, User } from "@/lib/types";

import { useApp } from "./AppContext";
import {
  PhaseWorkspaceDetail,
  ProjectWorkspaceDetail,
  ProjectWorkspaceList,
} from "./ProjectWorkspace";
import { AdminUsersDirectory } from "./AdminUsersWorkspace";
import { AdminPaymentsManager } from "./AdminPaymentsManager";
import { AdminSystemSettings } from "./AdminSystemSettings";
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
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  PageLoading,
  ProgressBar,
  Select,
  Textarea,
  packageClass,
  projectProgress,
  statusClass,
  statusLabel,
} from "./UI";
import { getPackageCatalogItem, getPackageTitle } from "./packageCatalog";
import { calculateProjectPaymentSplit, DEFAULT_PROJECT_DEPOSIT_PERCENTAGE } from "@/lib/payment-policy";

type WorkspaceRole = "CLIENT" | "STAFF" | "PROJECT_MANAGER" | "SUPER_ADMIN";

function normalizeRole(userOrRole?: Pick<User, "role"> | string | null): WorkspaceRole {
  const raw =
    typeof userOrRole === "object" && userOrRole !== null
      ? userOrRole.role
      : userOrRole;

  const value = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (value === "SUPER_ADMIN" || value === "SUPERADMIN" || value === "ADMIN") return "SUPER_ADMIN";
  if (value === "PROJECT_MANAGER" || value === "PROJECTMANAGER" || value === "PROJECT_LEAD" || value === "PM") return "PROJECT_MANAGER";
  if (value === "STAFF" || value === "TEAM" || value === "TEAM_MEMBER" || value === "DEVELOPER" || value === "DESIGNER" || value === "STRATEGIST" || value === "COPYWRITER") return "STAFF";

  return "CLIENT";
}

function roleLabel(userOrRole?: Pick<User, "role"> | string | null) {
  const role = normalizeRole(userOrRole);

  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "PROJECT_MANAGER") return "Project Manager";
  if (role === "STAFF") return "Staff";

  return "Client";
}

function isClientProfile(user: User, projects: Project[]) {
  const specialty = String(user.specialty ?? "").trim().toLowerCase();
  const company = String(user.company ?? "").trim().toLowerCase();

  return (
    normalizeRole(user) === "CLIENT" ||
    specialty === "client" ||
    specialty === "customer" ||
    specialty === "client user" ||
    company === "client" ||
    projects.some((project) => project.clientId === user.id)
  );
}

function getDeliveryUsers(users: User[], projects: Project[]) {
  return users.filter((user) => {
    const role = normalizeRole(user);
    const specialty = String(user.specialty ?? "").trim().toLowerCase();

    return (
      (role === "STAFF" || role === "PROJECT_MANAGER") &&
      specialty !== "client" &&
      !projects.some((project) => project.clientId === user.id)
    );
  });
}

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

function readableStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getCreatedTime(item: { createdAt?: string }) {
  const parsed = new Date(item.createdAt ?? "").getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
}

export function AdminOverview() {
  const { state } = useApp();

  const projects = state.projects ?? [];
  const requests = state.requests ?? [];
  const payments = projects.flatMap((project) => project.payments ?? []);
  const phases = projects.flatMap((project) => project.phases ?? []);
  const team = getDeliveryUsers(state.users ?? [], projects);

  const active = projects.filter((project) =>
    ["ACTIVE", "AWAITING_BALANCE", "BALANCE_PENDING_CONFIRMATION", "DEPOSIT_PENDING_CONFIRMATION"].includes(project.status),
  ).length;

  const awaiting = requests.filter((request) => request.status === "PENDING_REVIEW").length;
  const pendingPayments = payments.filter((payment) => payment.status === "PENDING_CONFIRMATION").length;
  const completed = projects.filter((project) => project.status === "COMPLETED").length;

  const approvedPhases = phases.filter((phase) => phase.status === "APPROVED").length;
  const deliveryHealth = phases.length ? Math.round((approvedPhases / phases.length) * 100) : 0;

  const recentProjects = [...projects].sort((a, b) => getCreatedTime(b) - getCreatedTime(a)).slice(0, 5);
  const pendingRequests = requests.filter((request) => request.status === "PENDING_REVIEW").slice(0, 4);

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
            <Badge className="badge-blue">{projects.length} Projects</Badge>
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
            icon: <Wallet size={16} />,
            helper: "Transfers to confirm",
          },
          {
            label: "Completed",
            value: completed,
            tone: "green",
            icon: DashboardIcons.check,
            helper: `${deliveryHealth}% delivery health`,
          },
        ]}
      />

      <div className="grid-2">
        <DashboardPanel
          title="Recent Projects"
          action={
            <Link href="/admin/projects" className="btn btn-ghost">
              View all <ArrowRight size={15} />
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
                  subtitle={`${project.businessName} • ${getPackageTitle(project.packageType)}`}
                  icon={DashboardIcons.project}
                  badge={<Badge className={statusClass(project.status)}>{statusLabel(project.status)}</Badge>}
                  meta={<strong>{projectProgress(project)}%</strong>}
                />
              ))
            ) : (
              <EmptyState title="No projects yet" body="Created projects will appear here." />
            )}
          </div>
        </DashboardPanel>

        <div className="stack">
          <DashboardProgressCard
            label="Delivery Health"
            title={`${approvedPhases}/${phases.length || 0} phases approved`}
            value={deliveryHealth}
            tone={deliveryHealth >= 70 ? "green" : deliveryHealth >= 35 ? "orange" : "blue"}
            helper="Based on approved phases across all projects."
          />

          <DashboardPanel
            title="Pending Requests"
            action={
              <Link href="/admin/project-requests" className="btn btn-ghost">
                Review <ArrowRight size={15} />
              </Link>
            }
          >
            <div className="stack" style={{ gap: 8 }}>
              {pendingRequests.length ? (
                pendingRequests.map((request) => (
                  <DashboardListItem
                    key={request.id}
                    href="/admin/project-requests"
                    title={(request as any).projectName ?? request.businessName}
                    subtitle={`${request.businessName} • ${getPackageTitle(request.packageType)}`}
                    icon={DashboardIcons.clock}
                    badge={<Badge className="badge-orange">New</Badge>}
                  />
                ))
              ) : (
                <p style={{ color: "var(--muted)", margin: 0 }}>No pending project requests.</p>
              )}
            </div>
          </DashboardPanel>
        </div>
      </div>

      <DashboardPanel
        title="Team Workload"
        action={
          <Link href="/admin/team" className="btn btn-ghost">
            Manage Team <ArrowRight size={15} />
          </Link>
        }
        className="mt-24"
      >
        <div className="workload-grid">
          {team.length ? (
            team.map((user) => {
              const assignedPhaseCount = phases.filter((phase) => phase.assignedStaffId === user.id).length;
              const managedProjectCount = projects.filter((project) => project.projectManagerId === user.id).length;
              const workload = assignedPhaseCount + managedProjectCount;
              const loadPercent = Math.min(100, (workload / 10) * 100);
              const loadTone = workload > 7 ? "red" : workload > 4 ? "orange" : "blue";

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
                    {user.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>

                  <div className="workload-info">
                    <div className="timeline-row" style={{ alignItems: "flex-start" }}>
                      <div>
                        <strong>{user.name}</strong>
                        <p>{user.specialty && user.specialty.toLowerCase() !== "client" ? user.specialty : roleLabel(user)}</p>
                      </div>
                      <Badge className={`badge-${loadTone}`}>
                        {workload > 7 ? "High" : workload > 4 ? "Busy" : "Optimal"}
                      </Badge>
                    </div>

                    <div className="workload-stat">
                      <span>{assignedPhaseCount} active phases</span>
                      <span>{Math.round(loadPercent)}%</span>
                    </div>

                    <ProgressBar value={loadPercent} />
                  </div>
                </Link>
              );
            })
          ) : (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              No staff or project manager has been added yet.
            </p>
          )}
        </div>
      </DashboardPanel>
    </div>
  );
}

export function AdminDashboard() {
  return <AdminOverview />;
}

export function AdminProjects() {
  return <ProjectWorkspaceList role="admin" />;
}

export function AdminProjectDetail({ projectId }: { projectId: string }) {
  return <ProjectWorkspaceDetail role="admin" projectId={projectId} />;
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

export function AdminPhaseDetail({
  projectId,
  phaseId,
}: {
  projectId: string;
  phaseId: string;
}) {
  return <PhaseWorkspaceDetail role="admin" projectId={projectId} phaseId={phaseId} />;
}

export function AdminTeam() {
  return <AdminUsersDirectory mode="team" />;
}

export function AdminClients() {
  return <AdminUsersDirectory mode="clients" />;
}

export function AdminPayments() {
  return <AdminPaymentsManager />;
}

export function AdminSettings() {
  return <AdminSystemSettings />;
}

export function AdminCreateProject() {
  const { state, createAdminProject, dataLoading } = useApp();
  const router = useRouter();

  const templates = state.templates ?? [];
  const projects = state.projects ?? [];
  const staffOptions = getDeliveryUsers(state.users ?? [], projects);

  const [templateId, setTemplateId] = useState("");
  const selectedTemplate =
    templates.find((template) => template.id === templateId) ??
    templates[0] ??
    null;

  const packageType = selectedTemplate?.packageType ?? "Launch";

  const [form, setForm] = useState(() => {
    const split = calculateProjectPaymentSplit(750000);

    return {
      title: "",
      clientName: "",
      clientEmail: "",
      targetDate: "",
      totalAmount: split.totalAmount,
      depositAmount: split.depositAmount,
      balanceAmount: split.balanceAmount,
      projectManagerId: "",
      internalNotes: "",
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (dataLoading && templates.length === 0) return <PageLoading />;

  async function submitProject() {
    if (!selectedTemplate) {
      setError("Create or sync a template before creating a project.");
      return;
    }

    if (!form.title.trim() || !form.clientName.trim() || !form.clientEmail.trim()) {
      setError("Project title, client name, and client email are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const id = await createAdminProject({
        ...form,
        templateId: selectedTemplate.id,
        packageType,
        projectManagerId: form.projectManagerId || undefined,
      });

      router.push(`/admin/projects/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
      setLoading(false);
    }
  }

  return (
    <div className="content narrow">
      <BackLink href="/admin/projects" label="Back to Projects" />

      <section className="mb-7 mt-2 rounded-[30px] bg-[#E61525] px-6 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:px-8 lg:px-10">
        <Badge className="border-white/20 bg-white/15 text-white">Admin Managed</Badge>
        <h1 className="mt-4 max-w-3xl text-[34px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[46px]">
          Create Managed Project
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/85 sm:text-[15px]">
          Create a live client project from an existing delivery template.
        </p>
      </section>

      {error ? (
        <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {templates.length ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-7">
            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Template">
                <Select
                  value={selectedTemplate?.id ?? ""}
                  onChange={(event) => setTemplateId(event.target.value)}
                  className="h-12 rounded-2xl border-slate-200 text-sm"
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} — {getPackageTitle(template.packageType)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Project Manager / Staff">
                <Select
                  value={form.projectManagerId}
                  onChange={(event) => setForm({ ...form, projectManagerId: event.target.value })}
                  className="h-12 rounded-2xl border-slate-200 text-sm"
                >
                  <option value="">Unassigned</option>
                  {staffOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} — {user.specialty && user.specialty.toLowerCase() !== "client" ? user.specialty : roleLabel(user)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Project Title *">
                <Input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="e.g. Octalve website launch system"
                  className="h-12 rounded-2xl border-slate-200 text-sm"
                />
              </Field>

              <Field label="Target Delivery Date">
                <Input
                  type="date"
                  value={form.targetDate}
                  onChange={(event) => setForm({ ...form, targetDate: event.target.value })}
                  className="h-12 rounded-2xl border-slate-200 text-sm"
                />
              </Field>

              <Field label="Client Name *">
                <Input
                  value={form.clientName}
                  onChange={(event) => setForm({ ...form, clientName: event.target.value })}
                  placeholder="Client or business contact name"
                  className="h-12 rounded-2xl border-slate-200 text-sm"
                />
              </Field>

              <Field label="Client Email *">
                <Input
                  type="email"
                  value={form.clientEmail}
                  onChange={(event) => setForm({ ...form, clientEmail: event.target.value })}
                  placeholder="client@example.com"
                  className="h-12 rounded-2xl border-slate-200 text-sm"
                />
              </Field>

              <Field label="Total Amount">
                <Input
                  type="number"
                  value={form.totalAmount}
                  onChange={(event) => {
                    const split = calculateProjectPaymentSplit(Number(event.target.value));
                    setForm({
                      ...form,
                      totalAmount: split.totalAmount,
                      depositAmount: split.depositAmount,
                      balanceAmount: split.balanceAmount,
                    });
                  }}
                  className="h-12 rounded-2xl border-slate-200 text-sm"
                />
              </Field>

              <Field label={`Deposit Amount (${DEFAULT_PROJECT_DEPOSIT_PERCENTAGE}%)`}>
                <Input
                  type="number"
                  value={form.depositAmount}
                  readOnly
                  className="h-12 rounded-2xl border-slate-200 text-sm"
                />
              </Field>

              <Field label="Balance Amount (Auto)">
                <Input
                  type="number"
                  value={form.balanceAmount}
                  readOnly
                  className="h-12 rounded-2xl border-slate-200 text-sm"
                />
              </Field>

              <div className="lg:col-span-2">
                <Field label="Internal Notes">
                  <Textarea
                    value={form.internalNotes}
                    onChange={(event) => setForm({ ...form, internalNotes: event.target.value })}
                    placeholder="Private admin notes for delivery context."
                    className="min-h-27.5 rounded-2xl border-slate-200 text-sm"
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button loading={loading} onClick={submitProject}>
                Create Project
              </Button>
            </div>
          </Card>

          <Card className="border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <Badge className={packageClass(packageType)}>Selected workflow</Badge>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.035em] text-slate-950">
              {selectedTemplate?.name ?? "No template selected"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {selectedTemplate?.description ||
                (selectedTemplate ? getPackageCatalogItem(selectedTemplate.packageType).description : "Choose a delivery template.")}
            </p>

            <div className="mt-5 grid gap-3">
              {((selectedTemplate as any)?.phases ?? []).map((phase: any, index: number) => (
                <div key={phase.id ?? index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    Phase {index + 1}
                  </span>
                  <strong className="mt-1 block text-sm text-slate-950">{phase.title}</strong>
                  {phase.description ? (
                    <p className="mt-1 text-sm leading-6 text-slate-600">{phase.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <EmptyState title="No templates yet" body="Create or sync templates before creating projects." />
      )}
    </div>
  );
}

export function AdminRequests() {
  const { state, approveProjectRequest } = useApp();

  const requests = state.requests ?? [];
  const staffOptions = getDeliveryUsers(state.users ?? [], state.projects ?? []);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const activeRequest = requests.find((request) => request.id === activeRequestId);

  return (
    <div className="content">
      <PageHeader title="Project Requests" subtitle="Review client-submitted project requests." />

      {requests.length ? (
        <div className="stack">
          {requests.map((request) => (
            <Card key={request.id} className="payment-card">
              <div>
                <Badge className={packageClass(request.packageType)}>
                  {getPackageTitle(request.packageType)}
                </Badge>
                <h2>{(request as any).projectName ?? request.businessName}</h2>
                <p style={{ color: "var(--muted)" }}>
                  {request.businessName} • {request.projectGoal}
                </p>
                <Badge className={statusClass(request.status as any)}>
                  {statusLabel(request.status as any)}
                </Badge>
              </div>

              <Button onClick={() => setActiveRequestId(request.id)}>
                {request.status === "PENDING_REVIEW" ? "Review" : "View"}
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No requests yet" body="Client-created project requests will appear here." />
      )}

      {activeRequest ? (
        <RequestReviewModal
          request={activeRequest}
          staffOptions={staffOptions}
          onClose={() => setActiveRequestId(null)}
          onApprove={async (payload) => {
            await approveProjectRequest(activeRequest.id, payload);
            setActiveRequestId(null);
          }}
        />
      ) : null}
    </div>
  );
}

export function AdminProjectRequests() {
  return <AdminRequests />;
}

function RequestReviewModal({
  request,
  staffOptions,
  onClose,
  onApprove,
}: {
  request: ProjectRequest;
  staffOptions: User[];
  onClose: () => void;
  onApprove: (payload: {
    totalAmount: number;
    depositAmount: number;
    balanceAmount: number;
    projectManagerId?: string;
    targetDate?: string;
    internalNotes?: string;
  }) => Promise<void>;
}) {
  const isPending = request.status === "PENDING_REVIEW";

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() => {
    const split = calculateProjectPaymentSplit(750000);

    return {
      totalAmount: split.totalAmount,
      depositAmount: split.depositAmount,
      balanceAmount: split.balanceAmount,
      projectManagerId: staffOptions[0]?.id ?? "",
      targetDate: "",
      internalNotes: "",
    };
  });

  async function approve() {
    setLoading(true);

    try {
      await onApprove({
        ...form,
        projectManagerId: form.projectManagerId || undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={`Review ${(request as any).projectName ?? request.businessName}`} onClose={onClose} width="820px">
      <div className="stack" style={{ gap: 24 }}>
        <Card className="card-body" style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}>
          <Badge className={packageClass(request.packageType)}>
            {getPackageTitle(request.packageType)}
          </Badge>
          <h3 style={{ marginTop: 12 }}>{request.businessName}</h3>
          <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>{request.projectDescription}</p>
        </Card>

        <div className="form-grid">
          <Field label="Total Amount">
            <Input
              type="number"
              value={form.totalAmount}
              disabled={!isPending}
              onChange={(event) => {
                    const split = calculateProjectPaymentSplit(Number(event.target.value));
                    setForm({
                      ...form,
                      totalAmount: split.totalAmount,
                      depositAmount: split.depositAmount,
                      balanceAmount: split.balanceAmount,
                    });
                  }}
            />
          </Field>

          <Field label={`Deposit Amount (${DEFAULT_PROJECT_DEPOSIT_PERCENTAGE}%)`}>
            <Input
              type="number"
              value={form.depositAmount}
              disabled={!isPending}
              readOnly
            />
          </Field>

          <Field label="Balance Amount (Auto)">
            <Input
              type="number"
              value={form.balanceAmount}
              disabled={!isPending}
              readOnly
            />
          </Field>

          <Field label="Project Manager">
            <Select
              value={form.projectManagerId}
              disabled={!isPending}
              onChange={(event) => setForm({ ...form, projectManagerId: event.target.value })}
            >
              <option value="">Unassigned</option>
              {staffOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.specialty && user.specialty.toLowerCase() !== "client" ? user.specialty : roleLabel(user)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Target Date">
            <Input
              type="date"
              value={form.targetDate}
              disabled={!isPending}
              onChange={(event) => setForm({ ...form, targetDate: event.target.value })}
            />
          </Field>

          <Field label="Internal Notes">
            <Textarea
              value={form.internalNotes}
              disabled={!isPending}
              onChange={(event) => setForm({ ...form, internalNotes: event.target.value })}
            />
          </Field>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {isPending ? "Cancel" : "Close"}
          </Button>

          {isPending ? (
            <Button loading={loading} disabled={loading} onClick={approve}>
              Approve & Request Deposit
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

export function AdminTemplates() {
  const { state } = useApp();

  const templates = state.templates ?? [];
  const activeTemplates = templates.filter((template: any) => template.isActive !== false && template.status !== "INACTIVE");
  const inactiveTemplates = templates.length - activeTemplates.length;

  return (
    <div className="content">
      <DashboardHero
        eyebrow="Delivery Systems"
        title="Templates"
        subtitle="View reusable phase structures and package delivery frameworks."
        meta={
          <>
            <Badge className="badge-blue">{templates.length} Total</Badge>
            <Badge className="badge-green">{activeTemplates.length} Active</Badge>
            <Badge className="badge-slate">{inactiveTemplates} Inactive</Badge>
          </>
        }
      />

      {templates.length ? (
        <div className="grid-2-even">
          {templates.map((template) => {
            const phases = ((template as any).phases ?? []) as any[];

            return (
              <Card key={template.id} className="workspace-card">
                <div className="workspace-card-top">
                  <span className="workspace-card-icon tone-blue">T</span>
                  <Badge className={packageClass(template.packageType)}>
                    {getPackageTitle(template.packageType)}
                  </Badge>
                </div>

                <div className="workspace-card-main">
                  <h3>{template.name}</h3>
                  <p>{template.description || getPackageCatalogItem(template.packageType).description}</p>
                </div>

                <div className="workspace-card-context">
                  <strong>{phases.length} phases</strong>
                  <span>{(template as any).isActive === false ? "Inactive" : "Active"}</span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No templates yet" body="Template records will appear here when they are created." />
      )}
    </div>
  );
}

export function AdminAnalytics() {
  const { state } = useApp();

  const [packageFilter, setPackageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const projects = state.projects ?? [];
  const reviews = state.reviews ?? [];
  const requests = state.requests ?? [];

  const packageOptions = Array.from(new Set(projects.map((project) => String(project.packageType)))).sort();
  const statusOptions = Array.from(new Set(projects.map((project) => String(project.status)))).sort();

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const packageOk = packageFilter === "ALL" || project.packageType === packageFilter;
      const statusOk = statusFilter === "ALL" || project.status === statusFilter;
      const paymentOk =
        paymentFilter === "ALL" ||
        project.payments.some((payment) => payment.status === paymentFilter);

      return packageOk && statusOk && paymentOk;
    });
  }, [projects, packageFilter, statusFilter, paymentFilter]);

  const phases = filteredProjects.flatMap((project) => project.phases ?? []);
  const payments = filteredProjects.flatMap((project) => project.payments ?? []);
  const confirmedPayments = payments.filter((payment) => payment.status === "CONFIRMED");
  const pendingPayments = payments.filter((payment) => payment.status === "PENDING_CONFIRMATION" || payment.status === "UNPAID");

  const confirmedRevenue = confirmedPayments.reduce((total, payment) => total + payment.amount, 0);
  const pendingRevenue = pendingPayments.reduce((total, payment) => total + payment.amount, 0);
  const totalRevenue = payments.reduce((total, payment) => total + payment.amount, 0);

  const approvedPhases = phases.filter((phase) => phase.status === "APPROVED").length;
  const deliveryRate = phases.length ? (approvedPhases / phases.length) * 100 : 0;
  const paymentRate = payments.length ? (confirmedPayments.length / payments.length) * 100 : 0;
  const collectionRate = totalRevenue > 0 ? (confirmedRevenue / totalRevenue) * 100 : 0;

  const activeProjects = filteredProjects.filter((project) =>
    ["ACTIVE", "AWAITING_BALANCE", "BALANCE_PENDING_CONFIRMATION", "DEPOSIT_PENDING_CONFIRMATION"].includes(project.status),
  ).length;

  const completedProjects = filteredProjects.filter((project) => project.status === "COMPLETED").length;
  const awaitingApproval = phases.filter((phase) => phase.status === "AWAITING_APPROVAL").length;
  const changesRequested = phases.filter((phase) => phase.status === "CHANGES_REQUESTED").length;
  const averageProgress = filteredProjects.length
    ? filteredProjects.reduce((total, project) => total + projectProgress(project), 0) / filteredProjects.length
    : 0;

  const topProjects = [...filteredProjects]
    .sort((a, b) => projectProgress(b) - projectProgress(a))
    .slice(0, 6);

  const teamLoad = getDeliveryUsers(state.users ?? [], projects).map((user) => {
    const assigned = phases.filter((phase) => phase.assignedStaffId === user.id).length;
    const managed = filteredProjects.filter((project) => project.projectManagerId === user.id).length;

    return {
      user,
      count: assigned + managed,
      percent: Math.min(100, ((assigned + managed) / 10) * 100),
    };
  });

  return (
    <div className="content">
      <section className="rounded-[30px] border border-blue-100 bg-linear-to-br from-white via-white to-blue-50 px-6 py-7 shadow-[0_22px_65px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
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
              <Badge className="badge-purple">{reviews.length} Reviews</Badge>
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
                      {getPackageTitle(item as PackageType)}
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
                      {readableStatus(item)}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Payment</span>
                <Select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="h-11 rounded-2xl border-slate-200 text-sm">
                  <option value="ALL">All Payments</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="REJECTED">Rejected</option>
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
          <p className="mt-2 text-sm font-medium text-slate-500">{pendingPayments.length} unpaid or pending</p>
        </Card>

        <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <span className="text-sm font-bold text-slate-500">Delivery Rate</span>
          <strong className="mt-3 block text-3xl font-semibold tracking-[-0.055em] text-slate-950">{formatPercent(deliveryRate)}</strong>
          <p className="mt-2 text-sm font-medium text-slate-500">{approvedPhases}/{phases.length} phases approved</p>
        </Card>

        <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <span className="text-sm font-bold text-slate-500">Payment Rate</span>
          <strong className="mt-3 block text-3xl font-semibold tracking-[-0.055em] text-slate-950">{formatPercent(paymentRate)}</strong>
          <p className="mt-2 text-sm font-medium text-slate-500">{confirmedPayments.length}/{payments.length} payment records</p>
        </Card>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 bg-white p-5">
          <span className="text-sm font-bold text-slate-500">Active Projects</span>
          <strong className="mt-3 block text-2xl tracking-[-0.04em] text-slate-950">{activeProjects}</strong>
          <p className="mt-2 text-sm text-slate-500">Currently moving through delivery</p>
        </Card>

        <Card className="border-slate-200 bg-white p-5">
          <span className="text-sm font-bold text-slate-500">Completed Projects</span>
          <strong className="mt-3 block text-2xl tracking-[-0.04em] text-slate-950">{completedProjects}</strong>
          <p className="mt-2 text-sm text-slate-500">Closed delivery records</p>
        </Card>

        <Card className="border-slate-200 bg-white p-5">
          <span className="text-sm font-bold text-slate-500">Change Requests</span>
          <strong className="mt-3 block text-2xl tracking-[-0.04em] text-slate-950">{changesRequested}</strong>
          <p className="mt-2 text-sm text-slate-500">Revision signals</p>
        </Card>

        <Card className="border-slate-200 bg-white p-5">
          <span className="text-sm font-bold text-slate-500">Average Progress</span>
          <strong className="mt-3 block text-2xl tracking-[-0.04em] text-slate-950">{formatPercent(averageProgress)}</strong>
          <p className="mt-2 text-sm text-slate-500">{requests.length} total requests</p>
        </Card>
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
            {teamLoad.length ? (
              teamLoad.map(({ user, count, percent }) => (
                <Link key={user.id} href={`/admin/team/${user.id}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <strong className="block text-sm text-slate-950">{user.name}</strong>
                      <span className="mt-1 block text-sm text-slate-500">{user.specialty && user.specialty.toLowerCase() !== "client" ? user.specialty : roleLabel(user)}</span>
                    </div>
                    <strong className="text-sm text-slate-900">{count} item{count === 1 ? "" : "s"}</strong>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-[#0064E0]" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{Math.round(percent)}%</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500">No delivery team members found in this filter.</p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

export function AdminReviews() {
  const { state } = useApp();

  const reviews = ((state.reviews ?? []) as any[]).slice();

  const published = reviews.filter(
    (review) =>
      review.permissionToPublish === true ||
      review.status === "PUBLISHED" ||
      review.isPublished === true ||
      review.published === true,
  ).length;

  const pending = reviews.length - published;

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
            icon: <Star size={16} />,
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
            icon: <Star size={16} />,
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
                  <Star size={18} />
                </span>

                <Badge
                  className={
                    review.permissionToPublish || review.status === "PUBLISHED" || review.isPublished || review.published
                      ? "badge-green"
                      : "badge-orange"
                  }
                >
                  {review.permissionToPublish || review.status === "PUBLISHED" || review.isPublished || review.published
                    ? "Permission Granted"
                    : "Private Feedback"}
                </Badge>
              </div>

              <div className="workspace-card-main">
                <h3>{review.client?.name ?? review.name ?? review.clientName ?? "Client Review"}</h3>
                <p>{review.project?.title ?? review.projectTitle ?? review.businessName ?? review.client?.email ?? review.email ?? "Octalve Workspace feedback"}</p>
              </div>

              <div className="workspace-card-context">
                <strong>Rating: {review.rating ?? review.score ?? "Not rated"}</strong>
                <span>{review.comment ?? review.message ?? review.testimonial ?? "No review message was provided."}</span>
              </div>

              <div className="workspace-card-footer">
                <span>
                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-NG") : "No date"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No reviews yet" body="Client reviews and testimonials will appear here when they are submitted." />
      )}
    </div>
  );
}