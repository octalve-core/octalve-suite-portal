export type NormalizedWorkspaceRole =
  | "CLIENT"
  | "STAFF"
  | "PROJECT_MANAGER"
  | "SUPER_ADMIN";

export function normalizePortalRole(
  userOrRole?: { role?: string | null } | string | null,
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

export function isPortalDeliveryTeamUser(user: { role?: string | null }) {
  const role = normalizePortalRole(user);

  return role === "STAFF" || role === "PROJECT_MANAGER";
}

export function getPortalRoleLabel(
  userOrRole?: { role?: string | null } | string | null,
) {
  const role = normalizePortalRole(userOrRole);

  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "PROJECT_MANAGER") return "Project Manager";
  if (role === "STAFF") return "Staff";

  return "Client";
}