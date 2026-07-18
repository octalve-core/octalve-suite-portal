"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  UsersRound,
} from "lucide-react";

import type { Project, ProjectPhase, Role, User } from "@/lib/types";
import { getPackageTitle } from "./packageCatalog";
import { useApp } from "./AppContext";
import { Badge, Button, Card, Input, Select } from "./UI";

type DirectoryMode = "clients" | "team";

type UserWithMeta = User & {
  banned?: boolean;
  banReason?: string | null;
  banExpires?: string | null;
  createdAt?: string;
  image?: string | null;
  _count?: {
    clientProjects?: number;
  };
  clientProjects?: Array<{
    id: string;
    status: string;
    packageType: string;
  }>;
};

type RoleFilter = "ALL" | Role;

const ROLE_LABELS: Record<Role, string> = {
  CLIENT: "Client",
  STAFF: "Staff",
  PROJECT_MANAGER: "Project Manager",
  SUPER_ADMIN: "Admin",
};

const ROLE_CHIP_CLASSES: Record<Role, string> = {
  CLIENT: "border-blue-200 bg-blue-50 text-[#0064E0]",
  STAFF: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PROJECT_MANAGER: "border-violet-200 bg-violet-50 text-[#5300D9]",
  SUPER_ADMIN: "border-red-200 bg-red-50 text-[#E61525]",
};

const ROLE_ICON_CLASSES: Record<Role, string> = {
  CLIENT: "bg-blue-50 text-[#0064E0] ring-blue-100",
  STAFF: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  PROJECT_MANAGER: "bg-violet-50 text-[#5300D9] ring-violet-100",
  SUPER_ADMIN: "bg-red-50 text-[#E61525] ring-red-100",
};

const ROLE_OPTIONS: Role[] = ["CLIENT", "STAFF", "PROJECT_MANAGER", "SUPER_ADMIN"];
const TEAM_ROLES: Role[] = ["STAFF", "PROJECT_MANAGER", "SUPER_ADMIN"];

function normalizeUserRole(
  userOrRole?: { role?: Role | string | null } | Role | string | null,
): Role {
  const raw =
    typeof userOrRole === "object" && userOrRole !== null && "role" in userOrRole
      ? userOrRole.role
      : userOrRole;

  const value = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (value === "SUPER_ADMIN" || value === "SUPERADMIN" || value === "ADMIN") {
    return "SUPER_ADMIN";
  }

  if (
    value === "PROJECT_MANAGER" ||
    value === "PROJECTMANAGER" ||
    value === "PROJECT_LEAD" ||
    value === "PM"
  ) {
    return "PROJECT_MANAGER";
  }

  if (value === "STAFF" || value === "TEAM" || value === "TEAM_MEMBER") {
    return "STAFF";
  }

  if (value === "CLIENT" || value === "CUSTOMER" || value === "USER" || !value) {
    return "CLIENT";
  }

  return "CLIENT";
}

function isClientUser(user: { role?: Role | string | null }) {
  return normalizeUserRole(user) === "CLIENT";
}

function isTeamUser(user: { role?: Role | string | null }) {
  return TEAM_ROLES.includes(normalizeUserRole(user));
}

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function formatDate(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(value?: string) {
  return (
    (value || "O")
      .split(" ")
      .map((part) => part.trim()[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "O"
  );
}

function getRoleLabel(role: Role) {
  return ROLE_LABELS[role] ?? role;
}

function RoleChip({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
        ROLE_CHIP_CLASSES[role],
      )}
    >
      {getRoleLabel(role)}
    </span>
  );
}

function userMatchesSearch(user: UserWithMeta, query: string) {
  const value = query.trim().toLowerCase();

  if (!value) return true;

  const content = [
    user.name,
    user.email,
    user.phone,
    user.company,
    user.specialty,
    getRoleLabel(normalizeUserRole(user)),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return content.includes(value);
}

function getUserProjects(user: UserWithMeta, projects: Project[]) {
  const clientProjects = projects.filter((project) => project.clientId === user.id);
  const managedProjects = projects.filter((project) => project.projectManagerId === user.id);
  const assignedPhases = projects.flatMap((project) =>
    project.phases
      .filter((phase) => phase.assignedStaffId === user.id)
      .map((phase) => ({ phase, project })),
  );

  const assignedProjectIds = new Set(assignedPhases.map((item) => item.project.id));
  const assignedProjects = projects.filter((project) => assignedProjectIds.has(project.id));

  return {
    clientProjects,
    managedProjects,
    assignedProjects,
    assignedPhases,
  };
}

function getLoadTone(count: number) {
  if (count >= 8) return "border-red-200 bg-red-50 text-red-700";
  if (count >= 4) return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function StatCard({
  label,
  value,
  helper,
  tone,
  icon,
}: {
  label: string;
  value: number;
  helper?: string;
  tone: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-4">
        <span className={cn("grid h-12 w-12 place-items-center rounded-2xl ring-1", tone)}>
          {icon}
        </span>
        <div className="min-w-0">
          <strong className="block text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {value}
          </strong>
          <span className="block text-sm font-medium text-slate-500">{label}</span>
          {helper ? (
            <span className="mt-1 block truncate text-xs font-bold text-slate-400">
              {helper}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function DirectoryCard({
  user,
  mode,
  projects,
}: {
  user: UserWithMeta;
  mode: DirectoryMode;
  projects: Project[];
}) {
  const data = getUserProjects(user, projects);
  const href =
    mode === "clients" ? `/admin/clients/${user.id}` : `/admin/team/${user.id}`;

  const mainCount =
    mode === "clients"
      ? data.clientProjects.length
      : data.managedProjects.length + data.assignedPhases.length;

  return (
    <Link
      href={href}
      className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(0,100,224,0.10)]"
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-black ring-1",
            ROLE_ICON_CLASSES[normalizeUserRole(user)],
          )}
        >
          {getInitials(user.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-[-0.04em] text-slate-950">
                {user.name}
              </h3>
              <p className="mt-1 truncate text-sm font-medium text-slate-500">
                {user.company || user.specialty || user.email}
              </p>
            </div>

            <RoleChip role={normalizeUserRole(user)} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Email
              </span>
              <strong className="mt-1 block truncate text-sm text-slate-800">
                {user.email}
              </strong>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {mode === "clients" ? "Projects" : "Workload"}
              </span>
              <strong className="mt-1 block truncate text-sm text-slate-800">
                {mainCount}
              </strong>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Phone
              </span>
              <strong className="mt-1 block truncate text-sm text-slate-800">
                {user.phone || "Not set"}
              </strong>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-sm font-bold text-[#0064E0]">
              {mode === "clients" ? "View client" : "View team member"}
            </span>
            <ArrowRight
              size={17}
              className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#0064E0]"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function AdminUsersDirectory({ mode }: { mode: DirectoryMode }) {
  const { state } = useApp();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  useEffect(() => {
    setQuery("");
    setRoleFilter("ALL");
  }, [mode]);

  const allUsers = useMemo(
    () =>
      ((state.users ?? []) as UserWithMeta[]).map((user) => ({
        ...user,
        role: normalizeUserRole(user),
      })),
    [state.users],
  );

  const users = useMemo(() => {
    const base =
      mode === "clients"
        ? allUsers.filter(isClientUser)
        : allUsers.filter(isTeamUser);

    return base
      .filter((user) => (roleFilter === "ALL" ? true : normalizeUserRole(user) === roleFilter))
      .filter((user) => userMatchesSearch(user, query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers, mode, query, roleFilter]);

  const clients = allUsers.filter(isClientUser);
  const team = allUsers.filter(isTeamUser);
  const staff = allUsers.filter((user) => normalizeUserRole(user) === "STAFF");
  const managers = allUsers.filter((user) => normalizeUserRole(user) === "PROJECT_MANAGER");
  const admins = allUsers.filter((user) => normalizeUserRole(user) === "SUPER_ADMIN");

  const activeClients = clients.filter((client) =>
    state.projects.some((project) => project.clientId === client.id),
  );

  const assignedPhases = state.projects
    .flatMap((project) => project.phases)
    .filter((phase) => phase.assignedStaffId);

  const hero =
    mode === "clients"
      ? {
          eyebrow: "Client Directory",
          title: "Clients",
          subtitle:
            "View client accounts, connected projects, project history and role upgrade options from one clean workspace.",
        }
      : {
          eyebrow: "Team Operations",
          title: "Team",
          subtitle:
            "Manage delivery staff, project managers and admin users with clean workload visibility.",
        };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 sm:p-8">
          <div className="absolute right-[-80px] top-[-110px] h-64 w-64 rounded-full bg-[#0064E0]/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.34em] text-[#0064E0]">
                {hero.eyebrow}
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
                {hero.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-[15px]">
                {hero.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <RoleChip role="CLIENT" />
              <RoleChip role="STAFF" />
              <RoleChip role="PROJECT_MANAGER" />
            </div>
          </div>
        </div>
      </section>

      {mode === "clients" ? (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Clients"
            value={clients.length}
            helper="Client role only"
            tone="bg-blue-50 text-[#0064E0] ring-blue-100"
            icon={<UserRound size={19} />}
          />
          <StatCard
            label="With Projects"
            value={activeClients.length}
            helper="Has active record"
            tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
            icon={<CheckCircle2 size={19} />}
          />
          <StatCard
            label="No Project"
            value={clients.length - activeClients.length}
            helper="No linked project"
            tone="bg-orange-50 text-orange-600 ring-orange-100"
            icon={<Clock3 size={19} />}
          />
          <StatCard
            label="All Projects"
            value={state.projects.length}
            helper="Platform-wide"
            tone="bg-violet-50 text-[#5300D9] ring-violet-100"
            icon={<BriefcaseBusiness size={19} />}
          />
        </section>
      ) : (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Team Members"
            value={team.length}
            helper="Non-client users"
            tone="bg-blue-50 text-[#0064E0] ring-blue-100"
            icon={<UsersRound size={19} />}
          />
          <StatCard
            label="Staff"
            value={staff.length}
            helper="Delivery users"
            tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
            icon={<UserCog size={19} />}
          />
          <StatCard
            label="Project Managers"
            value={managers.length}
            helper="Can manage projects"
            tone="bg-violet-50 text-[#5300D9] ring-violet-100"
            icon={<ShieldCheck size={19} />}
          />
          <StatCard
            label="Assigned Phases"
            value={assignedPhases.length}
            helper="Current workload"
            tone="bg-orange-50 text-orange-600 ring-orange-100"
            icon={<BriefcaseBusiness size={19} />}
          />
        </section>
      )}

      <section className="mt-6 rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                {mode === "clients" ? "Client List" : "Team List"}
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                {mode === "clients"
                  ? "Only users with the Client role appear here."
                  : "Only Staff, Project Manager and Admin users appear here."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[560px]">
              <label className="block">
                <span className="sr-only">Search users</span>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                    size={17}
                  />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={mode === "clients" ? "Search clients..." : "Search team..."}
                    className="h-12 rounded-2xl border-slate-200 !pl-12 text-sm placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block">
                <span className="sr-only">Filter by role</span>
                <Select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
                  className="h-12 rounded-2xl border-slate-200 px-4 text-sm"
                >
                  <option value="ALL">{mode === "clients" ? "All Clients" : "All Roles"}</option>
                  {mode === "clients" ? (
                    <option value="CLIENT">Client</option>
                  ) : (
                    <>
                      <option value="STAFF">Staff</option>
                      <option value="PROJECT_MANAGER">Project Manager</option>
                      <option value="SUPER_ADMIN">Admin</option>
                    </>
                  )}
                </Select>
              </label>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {users.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {users.map((user) => (
                <DirectoryCard
                  key={user.id}
                  user={user}
                  mode={mode}
                  projects={state.projects}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
                {mode === "clients" ? <UserRound size={24} /> : <UsersRound size={24} />}
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950">
                No matching users
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Adjust your filters or search term.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DetailBlock({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </span>
          <div className="mt-1 text-sm font-semibold leading-6 text-slate-900">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectMiniCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/admin/projects/${project.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate text-sm text-slate-950">
            {project.title}
          </strong>
          <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
            {getPackageTitle(project.packageType)} • {project.projectCode}
          </span>
        </div>

        <Badge className="border border-slate-200 bg-slate-50 text-slate-600">
          {project.status.replaceAll("_", " ")}
        </Badge>
      </div>
    </Link>
  );
}

function PhaseMiniCard({ phase, project }: { phase: ProjectPhase; project: Project }) {
  return (
    <Link
      href={`/admin/projects/${project.id}/phases/${phase.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate text-sm text-slate-950">
            {phase.title}
          </strong>
          <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
            {project.title}
          </span>
        </div>

        <Badge className={cn("border", getLoadTone(phase.deliverables.length))}>
          {phase.status.replaceAll("_", " ")}
        </Badge>
      </div>
    </Link>
  );
}

export function AdminUserDetailPage({
  userId,
  mode,
}: {
  userId: string;
  mode: DirectoryMode;
}) {
  const {
    state,
    currentUser,
    updateTeamMember,
    deleteTeamMember,
    flagClientThreat,
    clearClientThreat,
    promoteClientRole,
    deleteClient,
  } = useApp();

  const router = useRouter();
  const user = (state.users ?? []).find((item) => item.id === userId) as
    | UserWithMeta
    | undefined;

  const [form, setForm] = useState<{
    name: string;
    email: string;
    specialty: string;
    role: Role;
  }>(() => ({
    name: user?.name ?? "",
    email: user?.email ?? "",
    specialty: user?.specialty ?? "",
    role: normalizeUserRole(user),
  }));

  const [loadingAction, setLoadingAction] = useState<
    "save" | "delete" | "flag" | "clearFlag" | "promoteClient" | "deleteClient" | null
  >(null);
  const [error, setError] = useState("");
  const [threatReason, setThreatReason] = useState("");
  const [clientPromotionRole, setClientPromotionRole] = useState<
    Extract<Role, "STAFF" | "PROJECT_MANAGER">
  >("STAFF");
  const [clientPromotionText, setClientPromotionText] = useState("");
  const [deleteClientEmail, setDeleteClientEmail] = useState("");
  const [deleteClientText, setDeleteClientText] = useState("");

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={mode === "clients" ? "/admin/clients" : "/admin/team"}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0064E0]"
        >
          <ArrowLeft size={17} />
          Back
        </Link>

        <Card className="mt-6 border-slate-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
            User not found
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            This user may not exist or may not be loaded yet.
          </p>
        </Card>
      </div>
    );
  }

  const activeUser = user;
  const activeRole = normalizeUserRole(activeUser);
  const data = getUserProjects(activeUser, state.projects);
  const backHref = mode === "clients" ? "/admin/clients" : "/admin/team";
  const isClientDetail = mode === "clients" && activeRole === "CLIENT";
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const canDelete = isSuperAdmin && activeRole !== "CLIENT" && currentUser?.id !== activeUser.id;
  const canManageClientDanger = isSuperAdmin && isClientDetail && currentUser?.id !== activeUser.id;
  const canPromoteClient = canManageClientDanger && !activeUser.banned;
  const canEditProfile = mode === "team" && activeRole !== "CLIENT";
  const canChangeRole = canEditProfile && currentUser?.id !== activeUser.id;

  async function saveUser() {
    if (!canEditProfile) return;

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    setError("");
    setLoadingAction("save");

    try {
      await updateTeamMember(activeUser.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        specialty: form.specialty.trim() || undefined,
        role: canChangeRole ? form.role : activeRole,
      });
    } catch (error) {
      void error;
      setError("Failed to update user. Please refresh and try again.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function removeUser() {
    if (!canDelete) return;

    const ok = window.confirm(`Delete ${activeUser.name}? This will unassign their workload first.`);
    if (!ok) return;

    setError("");
    setLoadingAction("delete");

    try {
      await deleteTeamMember(activeUser.id);
      router.replace("/admin/team");
    } catch (error) {
      void error;
      setError("Failed to delete user. Please refresh and try again.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function flagThreat() {
    if (!canManageClientDanger) return;

    if (threatReason.trim().length < 10) {
      setError("Add a clear threat reason before flagging this client.");
      return;
    }

    setError("");
    setLoadingAction("flag");

    try {
      await flagClientThreat(activeUser.id, threatReason.trim());
      setThreatReason("");
    } catch (error) {
      void error;
      setError("Failed to flag client. Please refresh and try again.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function clearThreat() {
    if (!canManageClientDanger) return;

    setError("");
    setLoadingAction("clearFlag");

    try {
      await clearClientThreat(activeUser.id);
    } catch (error) {
      void error;
      setError("Failed to clear client threat flag. Please refresh and try again.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function promoteClientToTeamRole() {
    if (!canPromoteClient) return;

    if (clientPromotionText.trim() !== "PROMOTE CLIENT") {
      setError("Type PROMOTE CLIENT to confirm this role upgrade.");
      return;
    }

    setError("");
    setLoadingAction("promoteClient");

    try {
      await promoteClientRole(activeUser.id, clientPromotionRole, clientPromotionText.trim());
      router.replace(`/admin/team/${activeUser.id}`);
    } catch (error) {
      void error;
      setError("Failed to upgrade client role. Please refresh and try again.");
    } finally {
      setLoadingAction(null);
    }
  }
  async function removeClient() {
    if (!canManageClientDanger) return;

    if (deleteClientEmail.trim().toLowerCase() !== activeUser.email.toLowerCase()) {
      setError("Client email confirmation does not match.");
      return;
    }

    if (deleteClientText.trim() !== "DELETE CLIENT") {
      setError("Type DELETE CLIENT to confirm this server deletion.");
      return;
    }

    setError("");
    setLoadingAction("deleteClient");

    try {
      await deleteClient(activeUser.id, deleteClientEmail.trim(), deleteClientText.trim());
      router.replace("/admin/clients");
    } catch (error) {
      void error;
      setError("Failed to delete client. Please refresh and try again.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0064E0]"
      >
        <ArrowLeft size={17} />
        Back to {mode === "clients" ? "Clients" : "Team"}
      </Link>

      <section className="mt-5 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <RoleChip role={activeRole} />
                {activeUser.company ? (
                  <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                    {activeUser.company}
                  </span>
                ) : null}
                {activeUser.banned ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-300/40 bg-red-500/20 px-3 py-1 text-xs font-bold text-red-50">
                    <ShieldAlert size={13} />
                    Threat flagged
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-5xl">
                {activeUser.name}
              </h1>

              <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-white/70 sm:text-[15px]">
                {activeUser.email} • {activeUser.specialty || activeUser.company || "Octalve workspace user"}
              </p>
            </div>

            <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-white/10 text-xl font-black text-white ring-1 ring-white/15">
              {getInitials(activeUser.name)}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Client Projects"
          value={data.clientProjects.length}
          tone="bg-blue-50 text-[#0064E0] ring-blue-100"
          icon={<BriefcaseBusiness size={19} />}
        />
        <StatCard
          label="Managed Projects"
          value={data.managedProjects.length}
          tone="bg-violet-50 text-[#5300D9] ring-violet-100"
          icon={<ShieldCheck size={19} />}
        />
        <StatCard
          label="Assigned Phases"
          value={data.assignedPhases.length}
          tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
          icon={<UserCog size={19} />}
        />
        <StatCard
          label="Role"
          value={ROLE_OPTIONS.indexOf(activeRole) + 1}
          helper={getRoleLabel(activeRole)}
          tone={ROLE_ICON_CLASSES[activeRole]}
          icon={<UserRound size={19} />}
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
        <main className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailBlock label="Email" value={activeUser.email} icon={<Mail size={17} />} />
            <DetailBlock label="Phone" value={activeUser.phone || "Not set"} icon={<Phone size={17} />} />
            <DetailBlock label="Company" value={activeUser.company || "Not set"} icon={<BriefcaseBusiness size={17} />} />
            <DetailBlock label="Joined" value={formatDate(activeUser.createdAt)} icon={<Clock3 size={17} />} />
          </div>

          <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-6">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
              Client-owned Projects
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Projects where this user is the registered client.
            </p>

            <div className="mt-5 grid gap-3">
              {data.clientProjects.length ? (
                data.clientProjects.map((project) => (
                  <ProjectMiniCard key={project.id} project={project} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                  No client-owned projects.
                </div>
              )}
            </div>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-6">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
              Managed / Assigned Work
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Projects managed and phases assigned to this user.
            </p>

            <div className="mt-5 grid gap-3">
              {data.managedProjects.map((project) => (
                <ProjectMiniCard key={`managed-${project.id}`} project={project} />
              ))}

              {data.assignedPhases.map(({ phase, project }) => (
                <PhaseMiniCard key={`phase-${phase.id}`} phase={phase} project={project} />
              ))}

              {!data.managedProjects.length && !data.assignedPhases.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                  No managed or assigned work.
                </div>
              ) : null}
            </div>
          </Card>
        </main>

        <aside>
          <Card className="sticky top-24 border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
                <UserCog size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
                  Profile & Role
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {canEditProfile
                    ? "Update identity and promote or downgrade role."
                    : "Client profile editing is locked here. Use security actions below."}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-800">Name</span>
                <Input
                  value={form.name}
                  disabled={!canEditProfile}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="mt-2 h-12 rounded-2xl border-slate-200 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Email</span>
                <Input
                  type="email"
                  value={form.email}
                  disabled={!canEditProfile}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="mt-2 h-12 rounded-2xl border-slate-200 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Specialty</span>
                <Input
                  value={form.specialty}
                  disabled={!canEditProfile}
                  onChange={(event) => setForm({ ...form, specialty: event.target.value })}
                  placeholder="e.g. UI Designer, Developer, PM"
                  className="mt-2 h-12 rounded-2xl border-slate-200 text-sm placeholder:text-slate-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Role</span>
                <Select
                  value={form.role}
                  disabled={!canChangeRole}
                  onChange={(event) =>
                    setForm({ ...form, role: event.target.value as Role })
                  }
                  className="mt-2 h-12 rounded-2xl border-slate-200 text-sm"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </Select>
                {!canChangeRole && canEditProfile ? (
                  <span className="mt-2 block text-xs font-semibold text-orange-600">
                    You cannot change your own role from this screen.
                  </span>
                ) : null}
              </label>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            {canEditProfile ? (
              <Button
                className="mt-5 w-full"
                onClick={saveUser}
                loading={loadingAction === "save"}
                disabled={Boolean(loadingAction)}
              >
                Save Changes
              </Button>
            ) : null}

            {canManageClientDanger ? (
              <div className="mt-5 rounded-3xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-[#0064E0] ring-1 ring-blue-200">
                    <UserCog size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[#0064E0]">
                      Client Role Upgrade
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-blue-900/70">
                      Promote this client into your internal delivery team without using the team edit endpoint.
                    </p>
                    {activeUser.banned ? (
                      <p className="mt-2 rounded-2xl border border-red-200 bg-white p-3 text-xs font-bold text-red-700">
                        Clear the threat flag before upgrading this client.
                      </p>
                    ) : null}
                  </div>
                </div>

                <label className="mt-4 block">
                  <span className="text-sm font-bold text-blue-950">New internal role</span>
                  <Select
                    value={clientPromotionRole}
                    onChange={(event) =>
                      setClientPromotionRole(
                        event.target.value as Extract<Role, "STAFF" | "PROJECT_MANAGER">,
                      )
                    }
                    disabled={!canPromoteClient || Boolean(loadingAction)}
                    className="mt-2 h-12 rounded-2xl border-blue-200 bg-white text-sm"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                  </Select>
                </label>

                <label className="mt-3 block">
                  <span className="text-sm font-bold text-blue-950">Type PROMOTE CLIENT</span>
                  <Input
                    value={clientPromotionText}
                    onChange={(event) => setClientPromotionText(event.target.value)}
                    placeholder="PROMOTE CLIENT"
                    disabled={!canPromoteClient || Boolean(loadingAction)}
                    className="mt-2 h-12 rounded-2xl border-blue-200 bg-white text-sm"
                  />
                </label>

                <Button
                  className="mt-3 w-full"
                  onClick={promoteClientToTeamRole}
                  loading={loadingAction === "promoteClient"}
                  disabled={!canPromoteClient || Boolean(loadingAction)}
                >
                  <UserCog size={16} />
                  Promote Client
                </Button>
              </div>
            ) : null}
            {canManageClientDanger ? (
              <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-red-600 ring-1 ring-red-200">
                    <ShieldAlert size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-red-700">
                      Client Danger Zone
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-red-700/80">
                      Current status: {activeUser.banned ? "Threat flagged" : "Not flagged"}.
                    </p>
                    {activeUser.banReason ? (
                      <p className="mt-1 text-xs font-semibold text-red-700/80">
                        {activeUser.banReason}
                      </p>
                    ) : null}
                  </div>
                </div>

                <label className="mt-4 block">
                  <span className="text-sm font-bold text-red-900">Threat reason</span>
                  <Input
                    value={threatReason}
                    onChange={(event) => setThreatReason(event.target.value)}
                    placeholder="Reason for flagging this client"
                    className="mt-2 h-12 rounded-2xl border-red-200 bg-white text-sm"
                  />
                </label>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="danger"
                    onClick={flagThreat}
                    loading={loadingAction === "flag"}
                    disabled={Boolean(loadingAction)}
                  >
                    <ShieldAlert size={16} />
                    Flag Threat
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={clearThreat}
                    loading={loadingAction === "clearFlag"}
                    disabled={Boolean(loadingAction)}
                  >
                    Clear Flag
                  </Button>
                </div>

                <div className="mt-5 border-t border-red-200 pt-4">
                  <label className="block">
                    <span className="text-sm font-bold text-red-900">Confirm client email</span>
                    <Input
                      value={deleteClientEmail}
                      onChange={(event) => setDeleteClientEmail(event.target.value)}
                      placeholder={activeUser.email}
                      className="mt-2 h-12 rounded-2xl border-red-200 bg-white text-sm"
                    />
                  </label>

                  <label className="mt-3 block">
                    <span className="text-sm font-bold text-red-900">Type DELETE CLIENT</span>
                    <Input
                      value={deleteClientText}
                      onChange={(event) => setDeleteClientText(event.target.value)}
                      placeholder="DELETE CLIENT"
                      className="mt-2 h-12 rounded-2xl border-red-200 bg-white text-sm"
                    />
                  </label>

                  <Button
                    variant="danger"
                    className="mt-3 w-full"
                    onClick={removeClient}
                    loading={loadingAction === "deleteClient"}
                    disabled={Boolean(loadingAction)}
                  >
                    <Trash2 size={16} />
                    Delete Client From Server
                  </Button>
                </div>
              </div>
            ) : null}

            {canDelete ? (
              <Button
                variant="danger"
                className="mt-3 w-full"
                onClick={removeUser}
                loading={loadingAction === "delete"}
                disabled={Boolean(loadingAction)}
              >
                <Trash2 size={16} />
                Delete Team Member
              </Button>
            ) : null}
          </Card>
        </aside>
      </div>
    </div>
  );
}