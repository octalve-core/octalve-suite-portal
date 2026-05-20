"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Layers3,
  Mail,
  MessageSquareText,
  MoreVertical,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";

import type { Deliverable, Project, ProjectPhase, Role, User } from "@/lib/types";
import { getPackageCatalogItem, getPackageTitle } from "./packageCatalog";
import { useApp } from "./AppContext";
import { PhaseMessageThread } from "./PhaseMessageThread";
import { ProjectDeadlineEditor } from "./ProjectDeadlineEditor";
import { Button, Input, Select, Textarea } from "./UI";

type WorkspaceRole = "admin" | "staff" | "client";
type DeliverableLinkType = NonNullable<Deliverable["linkType"]>;
type DeliverablePayload = Pick<Deliverable, "name" | "description" | "link" | "linkType">;

const DELIVERABLE_LINK_TYPES: DeliverableLinkType[] = [
  "Figma",
  "Google Drive",
  "Web Preview",
  "Document",
  "Other",
];
type ProjectTab = "phases" | "team" | "notes";

const COLORS = {
  blue: "#0064E0",
  red: "#E61525",
  green: "#29BE3E",
  orange: "#FC7E24",
  purple: "#5300D9",
  navy: "#000A16",
  slate: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  soft: "#F8FAFC",
};

const roleConfig: Record<
  WorkspaceRole,
  {
    accent: string;
    createHref?: string;
    backHref: string;
    backLabel: string;
    title: string;
    subtitle: string;
    createLabel?: string;
  }
> = {
  admin: {
    accent: COLORS.red,
    createHref: "/admin/projects/new",
    backHref: "/admin/projects",
    backLabel: "Back to Projects",
    title: "Projects",
    subtitle: "All active, assigned and completed projects across the Octalve workspace.",
    createLabel: "Create Project",
  },
  staff: {
    accent: COLORS.green,
    backHref: "/staff/projects",
    backLabel: "Back to Projects",
    title: "Assigned Projects",
    subtitle: "Projects you manage or phases assigned to you by the admin team.",
  },
  client: {
    accent: COLORS.blue,
    createHref: "/client/projects/new",
    backHref: "/client/projects",
    backLabel: "Back to Projects",
    title: "Projects",
    subtitle: "Your approved and active Octalve projects, delivery phases and project progress.",
    createLabel: "Create Project",
  },
};

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function formatDate(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function projectProgress(project: Project) {
  if (!project.phases.length) return 0;

  const approved = project.phases.filter((phase) => phase.status === "APPROVED").length;
  return Math.round((approved / project.phases.length) * 100);
}

function approvedPhaseCount(project: Project) {
  return project.phases.filter((phase) => phase.status === "APPROVED").length;
}

function getCurrentPhase(project: Project) {
  return (
    project.phases.find((phase) =>
      ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED"].includes(phase.status),
    ) ??
    project.phases.find((phase) => phase.status !== "APPROVED") ??
    project.phases[0]
  );
}

function canStaffSeeProject(project: Project, user?: User | null) {
  if (!user) return false;

  return (
    project.projectManagerId === user.id ||
    project.phases.some((phase) => phase.assignedStaffId === user.id)
  );
}

function visibleProjectsForRole(projects: Project[], role: WorkspaceRole, user?: User | null) {
  if (role === "admin") return projects;

  if (role === "client") {
    if (!user) return [];
    return projects.filter((project) => project.clientId === user.id);
  }

  return projects.filter((project) => canStaffSeeProject(project, user));
}

function statusTone(status: string) {
  if (status === "COMPLETED" || status === "APPROVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "AWAITING_APPROVAL" || status === "PENDING_CONFIRMATION") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "CHANGES_REQUESTED" || status === "REJECTED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "LOCKED" || status === "NOT_STARTED") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-blue-200 bg-blue-50 text-[#0064E0]";
}

function phaseNumberLabel(phase: ProjectPhase, index: number) {
  return phase.phaseNumber || index + 1;
}

function userInitial(value?: string) {
  return (value || "O").trim().slice(0, 1).toUpperCase();
}

function uniqueUsers(users: Array<User | undefined | null>) {
  const map = new Map<string, User>();

  users.forEach((user) => {
    if (user?.id) map.set(user.id, user);
  });

  return Array.from(map.values());
}

function ProjectBadge({ project }: { project: Project }) {
  const catalog = getPackageCatalogItem(project.packageType);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold"
      style={{
        color: catalog.color,
        borderColor: `${catalog.color}38`,
        backgroundColor: `${catalog.color}10`,
      }}
    >
      <BriefcaseBusiness size={13} />
      {getPackageTitle(project.packageType)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-bold", statusTone(status))}>
      {formatStatus(status)}
    </span>
  );
}

function ProjectProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-[#0064E0] transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function EmptyPanel({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-400">
        {icon ?? <BriefcaseBusiness size={22} />}
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.035em] text-slate-950">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {body}
      </p>
    </div>
  );
}

function ProjectCard({
  project,
  role,
}: {
  project: Project;
  role: WorkspaceRole;
}) {
  const progress = projectProgress(project);
  const href =
    role === "admin"
      ? `/admin/projects/${project.id}`
      : role === "staff"
        ? `/staff/projects`
        : `/client/projects/${project.id}`;

  return (
    <Link
      href={href}
      className="group block rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(15,23,42,0.08)]"
    >
      <div className="flex min-h-52.5 flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ProjectBadge project={project} />
            <StatusBadge status={project.status} />
          </div>

          <h3 className="mt-7 text-xl font-semibold tracking-[-0.04em] text-slate-950">
            {project.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {project.businessName}
          </p>
        </div>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">Progress</span>
            <strong className="text-slate-950">
              {approvedPhaseCount(project)}/{project.phases.length} phases
            </strong>
          </div>
          <ProjectProgressBar value={progress} />
        </div>
      </div>
    </Link>
  );
}

export function ProjectWorkspaceList({ role }: { role: WorkspaceRole }) {
  const { state, currentUser } = useApp();
  const config = roleConfig[role];

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [packageFilter, setPackageFilter] = useState("ALL");

  const roleProjects = useMemo(
    () => visibleProjectsForRole(state.projects, role, currentUser),
    [state.projects, role, currentUser],
  );

  const packageOptions = useMemo(() => {
    return Array.from(new Set(roleProjects.map((project) => project.packageType)));
  }, [roleProjects]);

  const filteredProjects = useMemo(() => {
    return roleProjects.filter((project) => {
      const search = `${project.title} ${project.businessName} ${project.clientEmail} ${project.projectCode}`.toLowerCase();
      const matchesSearch = search.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "ALL" || project.status === statusFilter;
      const matchesPackage = packageFilter === "ALL" || project.packageType === packageFilter;

      return matchesSearch && matchesStatus && matchesPackage;
    });
  }, [roleProjects, query, statusFilter, packageFilter]);

  return (
    <div className="content">
      <section className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.055em] text-slate-950">
            {config.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {config.subtitle}
          </p>
        </div>

        {config.createHref && config.createLabel ? (
          <Link href={config.createHref}>
            <Button className="bg-[#0064E0]">
              <Plus size={17} />
              {config.createLabel}
            </Button>
          </Link>
        ) : null}
      </section>

      <section className="mb-7 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects..."
            className="h-12 rounded-2xl border-slate-200 bg-white pl-11 text-sm placeholder:text-slate-400"
          />
        </label>

        <Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-12 rounded-2xl border-slate-200 bg-white text-sm"
        >
          <option value="ALL">All Status</option>
          <option value="APPROVED_AWAITING_DEPOSIT">Awaiting Deposit</option>
          <option value="ACTIVE">Active</option>
          <option value="AWAITING_BALANCE">Awaiting Balance</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </Select>

        <Select
          value={packageFilter}
          onChange={(event) => setPackageFilter(event.target.value)}
          className="h-12 rounded-2xl border-slate-200 bg-white text-sm"
        >
          <option value="ALL">All Packages</option>
          {packageOptions.map((item) => (
            <option key={item} value={item}>
              {getPackageTitle(item)}
            </option>
          ))}
        </Select>
      </section>

      {filteredProjects.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} role={role} />
          ))}
        </div>
      ) : (
        <EmptyPanel
          title="No matching projects"
          body={
            role === "staff"
              ? "No managed or assigned projects match this view."
              : role === "client"
                ? "No client projects match this view."
                : "No projects match the selected filters."
          }
        />
      )}
    </div>
  );
}

function ProjectHero({
  project,
  role,
  client,
  manager,
}: {
  project: Project;
  role: WorkspaceRole;
  client?: User;
  manager?: User;
}) {
  const progress = projectProgress(project);

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="bg-[#000A16] px-6 py-7 text-white sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <ProjectBadge project={project} />
              <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#0064E0]">
                {formatStatus(project.status)}
              </span>
            </div>

            <h1 className="mt-4 text-[30px] font-semibold tracking-[-0.055em] sm:text-[42px]">
              {project.title}
            </h1>
            <p className="mt-2 text-sm font-medium text-white/70 sm:text-base">
              {project.businessName} • {project.clientEmail}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="grid h-24 w-24 place-items-center rounded-full border-[7px] border-white/85 text-center">
              <div>
                <strong className="block text-2xl">{progress}%</strong>
                <span className="block text-xs text-white/70">Complete</span>
              </div>
            </div>

            {role !== "client" ? (
              <a
                href={`mailto:${project.clientEmail}`}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-bold text-slate-900"
              >
                <Mail size={17} />
                Contact Client
              </a>
            ) : null}

            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-900"
              aria-label="Project actions"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div>
          <span className="text-sm font-semibold text-slate-500">Phases</span>
          <strong className="mt-1 block text-slate-950">
            {approvedPhaseCount(project)} / {project.phases.length} complete
          </strong>
        </div>

        <ProjectDeadlineEditor project={project} role={role} />

        <div>
          <span className="text-sm font-semibold text-slate-500">Project Code</span>
          <strong className="mt-1 block text-slate-950">{project.projectCode}</strong>
        </div>

        <div>
          <span className="text-sm font-semibold text-slate-500">Client</span>
          <strong className="mt-1 block text-slate-950">{client?.name ?? project.businessName}</strong>
        </div>

        <div>
          <span className="text-sm font-semibold text-slate-500">Manager</span>
          <strong className="mt-1 block text-slate-950">{manager?.name ?? "Not assigned"}</strong>
        </div>
      </div>
    </section>
  );
}

function PhaseCard({
  project,
  phase,
  index,
  role,
  onAssign,
  onRequestApproval,
}: {
  project: Project;
  phase: ProjectPhase;
  index: number;
  role: WorkspaceRole;
  onAssign?: (phase: ProjectPhase) => void;
  onRequestApproval?: (phase: ProjectPhase) => void;
}) {
  const phaseHref =
    role === "admin"
      ? `/admin/projects/${project.id}/phases/${phase.id}`
      : role === "client"
        ? `/client/phases/${phase.id}`
        : `/staff/phases/${phase.id}`;

  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-black",
              phase.status === "APPROVED"
                ? "bg-emerald-100 text-emerald-700"
                : phase.status === "IN_PROGRESS"
                  ? "bg-blue-100 text-[#0064E0]"
                  : "bg-slate-100 text-slate-500",
            )}
          >
            {phase.status === "APPROVED" ? <CheckCircle2 size={20} /> : phaseNumberLabel(phase, index)}
          </div>

          <div>
            <h3 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
              {phase.title}
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              {phase.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={phase.status} />
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {phase.deliverables.length} deliverables
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {role === "admin" && onAssign ? (
            <Button variant="secondary" onClick={() => onAssign(phase)}>
              <UserPlus size={16} />
              Assign
            </Button>
          ) : null}

          {role === "admin" &&
          onRequestApproval &&
          ["IN_PROGRESS", "CHANGES_REQUESTED"].includes(phase.status) ? (
            <Button onClick={() => onRequestApproval(phase)}>
              <Send size={16} />
              Request Approval
            </Button>
          ) : null}

          <Link href={phaseHref} className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-bold text-slate-950 hover:bg-slate-50">
            View Details
          </Link>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {phase.deliverables.map((deliverable) => (
          <div
            key={deliverable.id}
            className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
                <FileText size={17} />
              </span>
              <span className="truncate text-sm font-semibold text-slate-950">
                {deliverable.name}
              </span>
            </div>

            <StatusBadge status={deliverable.status} />
          </div>
        ))}
      </div>
    </article>
  );
}

function TeamPanel({
  project,
  users,
}: {
  project: Project;
  users: User[];
}) {
  const client = users.find((user) => user.id === project.clientId);
  const manager = users.find((user) => user.id === project.projectManagerId);

  const staff = uniqueUsers(
    project.phases.map((phase) =>
      users.find((user) => user.id === phase.assignedStaffId),
    ),
  );

  const members = [
    client ? { user: client, label: "Client" } : null,
    manager ? { user: manager, label: "Project Manager" } : null,
    ...staff.map((user) => ({ user, label: user.role === "PROJECT_MANAGER" ? "Project Manager" : "Delivery Staff" })),
  ].filter(Boolean) as Array<{ user: User; label: string }>;

  if (!members.length) {
    return (
      <EmptyPanel
        title="No team members assigned"
        body="Assigned team members will appear here as phases are delegated."
        icon={<UsersRound size={22} />}
      />
    );
  }

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
        Team
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Client, project manager and assigned delivery staff.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {members.map(({ user, label }) => (
          <div key={`${user.id}-${label}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-sm font-black text-slate-700 ring-1 ring-slate-200">
              {userInitial(user.name)}
            </span>
            <div className="min-w-0">
              <strong className="block truncate text-sm text-slate-950">{user.name}</strong>
              <span className="block truncate text-xs font-semibold text-slate-500">{label} • {user.email}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesPanel({
  project,
  role,
}: {
  project: Project;
  role: WorkspaceRole;
}) {
  const visibleNote =
    role === "client"
      ? project.clientBrief || "No client-facing project brief has been added yet."
      : project.internalNotes || project.clientBrief || "No internal notes have been added yet.";

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
        {role === "client" ? "Project Brief" : "Internal Notes"}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        {role === "client"
          ? "Client-visible project context and delivery direction."
          : "Private project context for admin, project managers and delivery staff."}
      </p>

      <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
        {visibleNote}
      </div>
    </div>
  );
}

function AssignPhaseModal({
  phase,
  users,
  onClose,
  onAssign,
}: {
  phase: ProjectPhase;
  users: User[];
  onClose: () => void;
  onAssign: (staffId: string) => Promise<void>;
}) {
  const team = users.filter((user) => user.role === "STAFF" || user.role === "PROJECT_MANAGER");
  const [staffId, setStaffId] = useState(phase.assignedStaffId ?? team[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
              Assign Phase
            </h3>
            <p className="mt-1 text-sm text-slate-500">{phase.title}</p>
          </div>

          <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50">
            Close
          </button>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-bold text-slate-800">
            Team Member
          </label>
          <Select
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
            className="mt-2 h-12 rounded-2xl border-slate-200 text-sm"
          >
            {team.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} — {user.specialty ?? formatStatus(user.role)}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await onAssign(staffId);
                onClose();
              } finally {
                setLoading(false);
              }
            }}
          >
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProjectWorkspaceDetail({
  role,
  projectId,
}: {
  role: WorkspaceRole;
  projectId: string;
}) {
  const { state, currentUser, assignPhase, requestPhaseApproval } = useApp();
  const config = roleConfig[role];

  const [tab, setTab] = useState<ProjectTab>("phases");
  const [assigning, setAssigning] = useState<ProjectPhase | null>(null);

  const project = state.projects.find((item) => item.id === projectId);

  if (!project) {
    return (
      <div className="content narrow">
        <EmptyPanel title="Project not found" body="This project may have been deleted or you may not have access to it." />
      </div>
    );
  }

  const allowed =
    role === "admin" ||
    (role === "client" && project.clientId === currentUser?.id) ||
    (role === "staff" && canStaffSeeProject(project, currentUser));

  if (!allowed) {
    return (
      <div className="content narrow">
        <EmptyPanel title="No access to this project" body="This project is not assigned to your workspace profile." />
      </div>
    );
  }

  const client = state.users.find((user) => user.id === project.clientId);
  const manager = state.users.find((user) => user.id === project.projectManagerId);

  return (
    <div className="content">
      <Link href={config.backHref} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
        <ArrowLeft size={17} />
        {config.backLabel}
      </Link>

      <ProjectHero project={project} role={role} client={client} manager={manager} />

      <div className="mt-7 inline-flex rounded-2xl bg-slate-100 p-1">
        {[
          ["phases", "Phases"],
          ["team", "Team"],
          ["notes", "Notes"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value as ProjectTab)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-bold transition",
              tab === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "phases" ? (
          <div className="space-y-5">
            {project.phases.map((phase, index) => (
              <PhaseCard
                key={phase.id}
                project={project}
                phase={phase}
                index={index}
                role={role}
                onAssign={role === "admin" ? setAssigning : undefined}
                onRequestApproval={
                  role === "admin"
                    ? async (item) => {
                        await requestPhaseApproval(item.id);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        ) : null}

        {tab === "team" ? <TeamPanel project={project} users={state.users} /> : null}

        {tab === "notes" ? <NotesPanel project={project} role={role} /> : null}
      </div>

      {assigning ? (
        <AssignPhaseModal
          phase={assigning}
          users={state.users}
          onClose={() => setAssigning(null)}
          onAssign={async (staffId) => {
            await assignPhase(assigning.id, staffId);
          }}
        />
      ) : null}
    </div>
  );
}

function PhaseDeliverables({
  phase,
  role,
  addDeliverable,
  updateDeliverable,
  deleteDeliverable,
}: {
  phase: ProjectPhase;
  role: WorkspaceRole;
  addDeliverable: (
    phaseId: string,
    payload: Pick<Deliverable, "name" | "description" | "link" | "linkType">,
  ) => Promise<void>;
  updateDeliverable: (
    deliverableId: string,
    payload: Partial<
      Pick<
        Deliverable,
        "name" | "description" | "link" | "linkType" | "visibleToClient" | "status"
      >
    >,
  ) => Promise<void>;
  deleteDeliverable: (deliverableId: string) => Promise<void>;
}) {
  const canManage = role !== "client" && phase.status !== "APPROVED";

  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState("");
  const [form, setForm] = useState<{
    name: string;
    description: string;
    link: string;
    linkType: DeliverableLinkType;
  }>({
    name: "",
    description: "",
    link: "",
    linkType: "Web Preview",
  });

  const items =
    role === "client"
      ? phase.deliverables.filter((deliverable) => deliverable.visibleToClient)
      : phase.deliverables;

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      link: "",
      linkType: "Web Preview",
    });
  }

  function beginAdd() {
    resetForm();
    setOpenForm(true);
  }

  function beginEdit(deliverable: ProjectPhase["deliverables"][number]) {
    setEditingId(deliverable.id);
    setForm({
      name: deliverable.name ?? "",
      description: deliverable.description ?? "",
      link: deliverable.link ?? "",
      linkType: deliverable.linkType ?? "Web Preview",
    });
    setOpenForm(true);
  }

  async function saveDeliverable() {
    const payload: DeliverablePayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      link: form.link.trim(),
      linkType: form.linkType,
    };

    if (!payload.name) return;

    setLoadingId(editingId || "new");

    try {
      if (editingId) {
        await updateDeliverable(editingId, payload);
      } else {
        await addDeliverable(phase.id, payload);
      }

      resetForm();
      setOpenForm(false);
    } finally {
      setLoadingId("");
    }
  }

  async function toggleClientVisibility(deliverable: ProjectPhase["deliverables"][number]) {
    if (deliverable.status === "APPROVED" || phase.status === "APPROVED") return;

    setLoadingId(deliverable.id);

    try {
      await updateDeliverable(deliverable.id, {
        visibleToClient: !deliverable.visibleToClient,
      });
    } finally {
      setLoadingId("");
    }
  }

  async function markReadyForReview(deliverable: ProjectPhase["deliverables"][number]) {
    if (deliverable.status === "APPROVED" || phase.status === "APPROVED") return;

    setLoadingId(deliverable.id);

    try {
      await updateDeliverable(deliverable.id, {
        status: "READY_FOR_REVIEW",
        visibleToClient: true,
      });
    } finally {
      setLoadingId("");
    }
  }

  async function removeDeliverable(deliverable: ProjectPhase["deliverables"][number]) {
    if (deliverable.status === "APPROVED" || phase.status === "APPROVED") return;

    const ok = window.confirm(`Delete "${deliverable.name}"?`);

    if (!ok) return;

    setLoadingId(deliverable.id);

    try {
      await deleteDeliverable(deliverable.id);
    } finally {
      setLoadingId("");
    }
  }

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            Deliverables
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {role === "client"
              ? "Client-visible deliverables prepared for your review."
              : "Add, update and manage phase deliverables before client approval."}
          </p>
        </div>

        {canManage ? (
          <Button onClick={beginAdd}>
            <Plus size={16} />
            Add Deliverable
          </Button>
        ) : null}
      </div>

      {openForm && canManage ? (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-800">
                Deliverable Name *
              </span>
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="e.g. Homepage design preview"
                className="mt-2 h-12 rounded-2xl border-slate-200 bg-white text-sm placeholder:text-slate-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-800">
                Link Type
              </span>
              <Select
                value={form.linkType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    linkType: event.target.value as DeliverableLinkType,
                  })
                }
                className="mt-2 h-12 rounded-2xl border-slate-200 bg-white text-sm"
              >
                {DELIVERABLE_LINK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </label>

            <label className="block lg:col-span-2">
              <span className="text-sm font-bold text-slate-800">
                Link
              </span>
              <Input
                value={form.link}
                onChange={(event) => setForm({ ...form, link: event.target.value })}
                placeholder="https://..."
                className="mt-2 h-12 rounded-2xl border-slate-200 bg-white text-sm placeholder:text-slate-400"
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="text-sm font-bold text-slate-800">
                Description
              </span>
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Briefly describe what this deliverable contains."
                className="mt-2 min-h-23.75 rounded-2xl border-slate-200 bg-white text-sm placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                resetForm();
                setOpenForm(false);
              }}
              disabled={Boolean(loadingId)}
            >
              Cancel
            </Button>

            <Button
              onClick={saveDeliverable}
              loading={loadingId === "new" || loadingId === editingId}
              disabled={!form.name.trim()}
            >
              {editingId ? "Save Changes" : "Add Deliverable"}
            </Button>
          </div>
        </div>
      ) : null}

      {items.length ? (
        <div className="mt-5 space-y-3">
          {items.map((deliverable) => {
            const locked =
              phase.status === "APPROVED" || deliverable.status === "APPROVED";
            const canEdit = canManage && !locked;

            return (
              <div
                key={deliverable.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
                      <FileText size={18} />
                    </span>

                    <div className="min-w-0">
                      <strong className="block text-sm text-slate-950">
                        {deliverable.name}
                      </strong>

                      {deliverable.description ? (
                        <span className="mt-1 block text-sm leading-6 text-slate-500">
                          {deliverable.description}
                        </span>
                      ) : null}

                      {deliverable.link ? (
                        <a
                          href={deliverable.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-sm font-bold text-[#0064E0] hover:underline"
                        >
                          Open deliverable link
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <StatusBadge status={deliverable.status} />

                    {role !== "client" ? (
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                          deliverable.visibleToClient
                            ? "border-blue-200 bg-blue-50 text-[#0064E0]"
                            : "border-slate-200 bg-white text-slate-500",
                        ].join(" ")}
                      >
                        {deliverable.visibleToClient ? "Client visible" : "Hidden"}
                      </span>
                    ) : null}

                    {canEdit ? (
                      <>
                        <Button
                          variant="secondary"
                          loading={loadingId === deliverable.id}
                          onClick={() => toggleClientVisibility(deliverable)}
                        >
                          {deliverable.visibleToClient ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                          {deliverable.visibleToClient ? "Hide" : "Show"}
                        </Button>

                        {deliverable.status === "DRAFT" ||
                        deliverable.status === "NEEDS_CHANGES" ? (
                          <Button
                            variant="secondary"
                            loading={loadingId === deliverable.id}
                            onClick={() => markReadyForReview(deliverable)}
                          >
                            Ready
                          </Button>
                        ) : null}

                        <Button
                          variant="secondary"
                          onClick={() => beginEdit(deliverable)}
                        >
                          <Edit3 size={15} />
                          Edit
                        </Button>

                        <Button
                          variant="danger"
                          loading={loadingId === deliverable.id}
                          onClick={() => removeDeliverable(deliverable)}
                        >
                          <Trash2 size={15} />
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400">
            <FileText size={22} />
          </div>
          <h3 className="mt-4 text-base font-semibold tracking-[-0.03em] text-slate-950">
            No deliverables yet
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {role === "client"
              ? "Deliverables will appear once the delivery team makes them visible."
              : "Add deliverables for this phase before requesting client approval."}
          </p>
        </div>
      )}
    </div>
  );
}

export function PhaseWorkspaceDetail({
  role,
  phaseId,
  projectId,
}: {
  role: WorkspaceRole;
  phaseId: string;
  projectId?: string;
}) {
  const {
    addDeliverable,
    approvePhase,
    currentUser,
    deleteDeliverable,
    requestChanges,
    requestPhaseApproval,
    sendPhaseMessage,
    state,
    updateDeliverable,
  } = useApp();

  const project =
    projectId
      ? state.projects.find((item) => item.id === projectId)
      : state.projects.find((item) => item.phases.some((phase) => phase.id === phaseId));

  const phase = project?.phases.find((item) => item.id === phaseId);
  const [message, setMessage] = useState("");
  const [changeMessage, setChangeMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  if (!project || !phase) {
    return (
      <div className="content narrow">
        <EmptyPanel title="Phase not found" body="This phase may have been deleted or you may not have access to it." />
      </div>
    );
  }

  const allowed =
    role === "admin" ||
    (role === "client" && project.clientId === currentUser?.id) ||
    (role === "staff" && (project.projectManagerId === currentUser?.id || phase.assignedStaffId === currentUser?.id));

  if (!allowed) {
    return (
      <div className="content narrow">
        <EmptyPanel title="No access to this phase" body="This phase is not assigned to your workspace profile." />
      </div>
    );
  }

  const backHref =
    role === "admin"
      ? `/admin/projects/${project.id}`
      : role === "staff"
        ? "/staff/phases"
        : `/client/projects/${project.id}`;

  const assignee = state.users.find((user) => user.id === phase.assignedStaffId);

  return (
    <div className="content">
      <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
        <ArrowLeft size={17} />
        Back
      </Link>

      <section className="mb-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <StatusBadge status={phase.status} />
            <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.055em] text-slate-950">
              {phase.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {phase.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {role === "admin" && ["IN_PROGRESS", "CHANGES_REQUESTED"].includes(phase.status) ? (
              <Button
                loading={loadingAction === "request"}
                onClick={async () => {
                  setLoadingAction("request");
                  try {
                    await requestPhaseApproval(phase.id);
                  } finally {
                    setLoadingAction("");
                  }
                }}
              >
                <Send size={16} />
                Request Approval
              </Button>
            ) : null}

            {role === "client" && phase.status === "AWAITING_APPROVAL" ? (
              <>
                <Button
                  loading={loadingAction === "approve"}
                  onClick={async () => {
                    setLoadingAction("approve");
                    try {
                      await approvePhase(phase.id);
                    } finally {
                      setLoadingAction("");
                    }
                  }}
                >
                  <CheckCircle2 size={16} />
                  Approve Phase
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <Layers3 className="text-[#0064E0]" size={18} />
            <span className="mt-2 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Project</span>
            <strong className="mt-1 block text-sm text-slate-950">{project.title}</strong>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <UsersRound className="text-[#29BE3E]" size={18} />
            <span className="mt-2 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Assigned Staff</span>
            <strong className="mt-1 block text-sm text-slate-950">{assignee?.name ?? "Not assigned"}</strong>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <FileText className="text-[#FC7E24]" size={18} />
            <span className="mt-2 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Deliverables</span>
            <strong className="mt-1 block text-sm text-slate-950">{phase.deliverables.length}</strong>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <MessageSquareText className="text-[#5300D9]" size={18} />
            <span className="mt-2 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Messages</span>
            <strong className="mt-1 block text-sm text-slate-950">{phase.messages.length}</strong>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="space-y-6">
          <PhaseDeliverables
            phase={phase}
            role={role}
            addDeliverable={addDeliverable}
            updateDeliverable={updateDeliverable}
            deleteDeliverable={deleteDeliverable}
          />

          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
              Approval History
            </h2>

            <div className="mt-5 space-y-3">
              {phase.approvalRequestedAt ? (
                <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                  <Clock3 size={18} className="mt-0.5 text-[#FC7E24]" />
                  <div>
                    <strong className="block text-sm text-slate-950">Approval requested</strong>
                    <span className="text-sm text-slate-500">{formatDate(phase.approvalRequestedAt)}</span>
                  </div>
                </div>
              ) : null}

              {phase.approvedAt ? (
                <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4">
                  <ShieldCheck size={18} className="mt-0.5 text-emerald-600" />
                  <div>
                    <strong className="block text-sm text-slate-950">Approved</strong>
                    <span className="text-sm text-slate-500">{formatDate(phase.approvedAt)}</span>
                  </div>
                </div>
              ) : null}

              {!phase.approvalRequestedAt && !phase.approvedAt ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No approval activity yet.
                </p>
              ) : null}
            </div>

            {role === "client" && phase.status === "AWAITING_APPROVAL" ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="block text-sm font-bold text-slate-800">
                  Request changes
                </label>
                <Textarea
                  value={changeMessage}
                  onChange={(event) => setChangeMessage(event.target.value)}
                  placeholder="Tell the delivery team what should be adjusted..."
                  className="mt-2 min-h-25 rounded-2xl border-slate-200 text-sm placeholder:text-slate-400"
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="secondary"
                    disabled={!changeMessage.trim()}
                    loading={loadingAction === "changes"}
                    onClick={async () => {
                      setLoadingAction("changes");
                      try {
                        await requestChanges(phase.id, changeMessage);
                        setChangeMessage("");
                      } finally {
                        setLoadingAction("");
                      }
                    }}
                  >
                    Request Changes
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquareText size={20} className="text-slate-500" />
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
              Phase Thread
            </h2>
          </div>

          <PhaseMessageThread messages={phase.messages} currentUserId={currentUser?.id} />

          <div className="mt-4 flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type a message..."
              className="h-12 rounded-xl border-white bg-white text-sm placeholder:text-slate-400"
            />
            <Button
              disabled={!message.trim()}
              onClick={async () => {
                const text = message.trim();
                if (!text) return;

                setMessage("");
                await sendPhaseMessage(phase.id, text);
              }}
            >
              <Send size={17} />
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}