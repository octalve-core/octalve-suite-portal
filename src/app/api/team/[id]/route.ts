import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

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

  const body = await request.json();
  const { name, email, specialty, role } = body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return errorResponse("Team member not found", 404);
  if (existing.role === "CLIENT") return errorResponse("Cannot edit client via team endpoint", 400);

  const validRoles = ["CLIENT", "STAFF", "PROJECT_MANAGER", "SUPER_ADMIN"];
  if (role !== undefined && !validRoles.includes(role)) {
    return errorResponse("Invalid role", 400);
  }

  if (id === result.user.id && role !== undefined && role !== existing.role) {
    return errorResponse("You cannot change your own role", 400);
  }

  // If changing email, check uniqueness
  if (email && email.toLowerCase() !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (emailTaken) return errorResponse("Email already taken", 400);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email: email.toLowerCase().trim() }),
      ...(specialty !== undefined && { specialty }),
      ...(role !== undefined && { role }),
      ...(specialty !== undefined && { specialty: specialty || null }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      specialty: true,
    },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/team/[id] — Delete a team member.
 * Unassigns from phases, unsets as PM on projects, then deletes user.
 * Role: SUPER_ADMIN only.
 */
/**
 * DELETE /api/team/[id]   Deactivate a team member.
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

  return NextResponse.json({ success: true, user: updated });
}