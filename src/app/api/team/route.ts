import { NextResponse } from "next/server";
import { ADMIN_AUDIT_ACTIONS, writeAdminAuditLog } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

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

/**
 * GET /api/team — List all non-client team members.
 * Role: SUPER_ADMIN, PROJECT_MANAGER.
 */
export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN", "PROJECT_MANAGER");
  if (forbidden) return forbidden;

  const team = await prisma.user.findMany({
    where: { role: { not: "CLIENT" } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      specialty: true,
      phone: true,
      image: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(team);
}

/**
 * POST /api/team — Create a new team member.
 * Role: SUPER_ADMIN only.
 *
 * Creating a SUPER_ADMIN requires exact confirmation text.
 */
export async function POST(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));
  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 254).toLowerCase();
  const specialty = cleanText(body.specialty, 160);
  const role = cleanTeamRole(body.role);

  if (!name) return errorResponse("Name is required", 400);
  if (!email) return errorResponse("Email is required", 400);
  if (!role) return errorResponse("Invalid role for team member", 400);

  if (role === "SUPER_ADMIN" && cleanConfirm(body.confirmText) !== "CREATE SUPER ADMIN") {
    return errorResponse("Super admin creation confirmation text did not match", 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return errorResponse("A user with this email already exists", 400);

  const member = await prisma.user.create({
    data: {
      name,
      email,
      role,
      specialty: specialty || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      specialty: true,
    },
  });

  await writeAdminAuditLog({
    actorId: result.user.id,
    actorRole: "SUPER_ADMIN",
    action: ADMIN_AUDIT_ACTIONS.TEAM_MEMBER_CREATE,
    targetType: "TEAM_MEMBER",
    targetId: member.id,
    targetLabel: member.email,
    riskLevel: role === "SUPER_ADMIN" ? "CRITICAL" : "HIGH",
    metadata: {
      createdRole: role,
      hasSpecialty: Boolean(member.specialty),
    },
  });

  return NextResponse.json(member, { status: 201 });
}
