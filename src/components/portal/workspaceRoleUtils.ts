export type NormalizedWorkspaceRole =
  | "CLIENT"
  | "STAFF"
  | "PROJECT_MANAGER"
  | "SUPER_ADMIN";

type RoleLike = {
  id?: string | null;
  role?: string | null;
  specialty?: string | null;
  company?: string | null;
};

type ProjectClientLike = {
  clientId?: string | null;
};

export function normalizePortalRole(
  userOrRole?: RoleLike | string | null,
): NormalizedWorkspaceRole {
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

  if (
    value === "STAFF" ||
    value === "TEAM" ||
    value === "TEAM_MEMBER" ||
    value === "DEVELOPER" ||
    value === "DESIGNER" ||
    value === "STRATEGIST" ||
    value === "COPYWRITER"
  ) {
    return "STAFF";
  }

  return "CLIENT";
}

export function getPortalRoleLabel(userOrRole?: RoleLike | string | null) {
  const role = normalizePortalRole(userOrRole);

  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "PROJECT_MANAGER") return "Project Manager";
  if (role === "STAFF") return "Staff";

  return "Client";
}

export function isPortalDeliveryTeamUser(user: RoleLike) {
  const role = normalizePortalRole(user);

  return role === "STAFF" || role === "PROJECT_MANAGER";
}

export function getCleanDeliveryTeam<TUser extends RoleLike>(
  users: TUser[] = [],
  projects: ProjectClientLike[] = [],
): TUser[] {
  const projectClientIds = new Set(
    projects.map((project) => project.clientId).filter(Boolean),
  );

  return users.filter((user) => {
    const specialty = String(user.specialty ?? "").trim().toLowerCase();
    const company = String(user.company ?? "").trim().toLowerCase();
    const roleLabel = getPortalRoleLabel(user).trim().toLowerCase();

    const linkedAsProjectClient = user.id ? projectClientIds.has(user.id) : false;

    const labelledAsClient =
      roleLabel === "client" ||
      specialty === "client" ||
      specialty === "customer" ||
      specialty === "client user" ||
      company === "client";

    return isPortalDeliveryTeamUser(user) && !linkedAsProjectClient && !labelledAsClient;
  });
}