import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

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
 * Creates a Prisma User record with the given role. No Better Auth credentials are created;
 * the team member can sign up or be invited separately.
 * Role: SUPER_ADMIN only.
 */
export async function POST(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json();
  const { name, email, specialty, role } = body;

  if (!name?.trim()) return errorResponse("Name is required", 400);
  if (!email?.trim()) return errorResponse("Email is required", 400);

  const validRoles = ["STAFF", "PROJECT_MANAGER", "SUPER_ADMIN"];
  if (!validRoles.includes(role)) return errorResponse("Invalid role for team member", 400);

  // Check for existing user
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return errorResponse("A user with this email already exists", 400);

  const member = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: role,
      specialty: specialty ?? null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      specialty: true,
    },
  });

  return NextResponse.json(member, { status: 201 });
}
