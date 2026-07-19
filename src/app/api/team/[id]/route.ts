import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { ADMIN_AUDIT_ACTIONS, writeAdminAuditLog } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };
type TeamRole = "STAFF" | "PROJECT_MANAGER" | "SUPER_ADMIN";

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanConfirm(value: unknown) {
  return String(value ?? "").trim();
}

function cleanTeamRole(value: unknown): TeamRole | null {
  const role = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (role === "STAFF") return "STAFF";
  if (role === "PROJECT_MANAGER" || role === "PROJECTMANAGER" || role === "PM" || role === "PROJECT_LEAD") {
    return "PROJECT_MANAGER";
  }
  if (role === "SUPER_ADMIN" || role === "SUPERADMIN" || role === "ADMIN") {
    return "SUPER_ADMIN";
  }

  return null;
}

function isActiveSuperAdmin(user: { role: string; banned: boolean; deactivatedAt: Date | null }) {
  return user.role === "SUPER_ADMIN" && !user.banned && !user.deactivatedAt;
}

/**
 * PATCH /api/team/[id] — Update a team member.
 * Role: SUPER_ADMIN only.
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));
  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) return errorResponse("Team member not found", 404);
  if (existing.role === "CLIENT") return errorResponse("Cannot edit client via team endpoint", 400);

  let targetRole: TeamRole | undefined;

  if (body.role !== undefined) {
    const cleanedRole = cleanTeamRole(body.role);

    if (!cleanedRole) {
      return errorResponse("Invalid role for team member", 400);
    }

    targetRole = cleanedRole;
  }

  if (id === result.user.id && targetRole !== undefined && targetRole !== existing.role) {
    return errorResponse("You cannot change your own role", 400);
  }

  const roleChanged = targetRole !== undefined && targetRole !== existing.role;
  const promotesToSuperAdmin = targetRole === "SUPER_ADMIN" && existing.role !== "SUPER_ADMIN";
  const demotesSuperAdmin = existing.role === "SUPER_ADMIN" && targetRole !== undefined && targetRole !== "SUPER_ADMIN";

  if (promotesToSuperAdmin && cleanConfirm(body.confirmText) !== "PROMOTE SUPER ADMIN") {
    return errorResponse("Super admin promotion confirmation text did not match", 400);
  }

  if (demotesSuperAdmin) {
    if (cleanConfirm(body.confirmText) !== "DEMOTE SUPER ADMIN") {
      return errorResponse("Super admin demotion confirmation text did not match", 400);
    }

    if (isActiveSuperAdmin(existing)) {
      const activeSuperAdminCount = await prisma.user.count({
        where: {
          role: "SUPER_ADMIN",
          banned: false,
          deactivatedAt: null,
        },
      });

      if (activeSuperAdminCount <= 1) {
        return errorResponse("Cannot demote the last active super admin", 400);
      }
    }
  }

  const email =
    body.email !== undefined
      ? cleanText(body.email, 254).toLowerCase()
      : undefined;

  if (email && email !== existing.email.toLowerCase()) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) return errorResponse("Email already taken", 400);
  }

  const data: Prisma.UserUpdateInput = {};

  if (body.name !== undefined) {
    const name = cleanText(body.name, 120);
    if (!name) return errorResponse("Name is required", 400);
    data.name = name;
  }

  if (email !== undefined) {
    if (!email) return errorResponse("Email is required", 400);
    data.email = email;
  }

  if (body.specialty !== undefined) {
    data.specialty = cleanText(body.specialty, 160) || null;
  }

  if (targetRole !== undefined) {
    data.role = targetRole;
  }

  if (!Object.keys(data).length) {
    return errorResponse("No valid team member updates supplied", 400);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      specialty: true,
      banned: true,
      banReason: true,
      banExpires: true,
      deactivatedAt: true,
      deactivationReason: true,
    },
  });

  await writeAdminAuditLog({
    actorId: result.user.id,
    actorRole: "SUPER_ADMIN",
    action: ADMIN_AUDIT_ACTIONS.TEAM_MEMBER_UPDATE,
    targetType: "TEAM_MEMBER",
    targetId: existing.id,
    targetLabel: existing.email,
    riskLevel: promotesToSuperAdmin || demotesSuperAdmin ? "CRITICAL" : roleChanged ? "HIGH" : "MEDIUM",
    metadata: {
      previousRole: existing.role,
      newRole: updated.role,
      roleChanged,
      emailChanged: Boolean(email && email !== existing.email.toLowerCase()),
      nameChanged: body.name !== undefined && updated.name !== existing.name,
      specialtyChanged: body.specialty !== undefined && updated.specialty !== existing.specialty,
    },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/team/[id] — Deactivate a team member.
 * Unassigns from phases, unsets as PM on projects, then disables access.
 * Role: SUPER_ADMIN only.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  if (id === result.user.id) return errorResponse("Cannot deactivate yourself", 400);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return errorResponse("User not found", 404);
  if (existing.role === "CLIENT") return errorResponse("Cannot deactivate client via team endpoint", 400);

  if (existing.role === "SUPER_ADMIN") {
    return errorResponse("Cannot deactivate a super admin account", 400);
  }

  const teamAuditCounts = await prisma.user.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          assignedPhases: true,
          managedProjects: true,
        },
      },
    },
  });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.projectPhase.updateMany({
      where: { assignedStaffId: id },
      data: { assignedStaffId: null },
    });

    await tx.project.updateMany({
      where: { projectManagerId: id },
      data: { projectManagerId: null },
    });

    return tx.user.update({
      where: { id },
      data: {
        banned: true,
        banReason: "Deactivated: Team account deactivated by admin",
        banExpires: null,
        deactivatedAt: new Date(),
        deactivationReason: "Team account deactivated by admin",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        banned: true,
        banReason: true,
        banExpires: true,
        deactivatedAt: true,
        deactivationReason: true,
      },
    });
  });

  await writeAdminAuditLog({
    actorId: result.user.id,
    actorRole: "SUPER_ADMIN",
    action: ADMIN_AUDIT_ACTIONS.TEAM_MEMBER_DEACTIVATE,
    targetType: "TEAM_MEMBER",
    targetId: existing.id,
    targetLabel: existing.email,
    riskLevel: "HIGH",
    reason: "Team account deactivated by admin",
    metadata: {
      role: existing.role,
      assignedPhaseCount: teamAuditCounts?._count.assignedPhases ?? 0,
      managedProjectCount: teamAuditCounts?._count.managedProjects ?? 0,
    },
  });

  return NextResponse.json({ success: true, user: updated });
}
