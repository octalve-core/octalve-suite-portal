import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/phases/[id]/assign — Assign a staff member to a phase.
 * Role: SUPER_ADMIN, PROJECT_MANAGER.
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN", "PROJECT_MANAGER");
  if (forbidden) return forbidden;

  const body = await request.json();
  const { staffId } = body;

  if (!staffId) return errorResponse("staffId is required", 400);

  const phase = await prisma.projectPhase.findUnique({ where: { id } });
  if (!phase) return errorResponse("Phase not found", 404);

  // Verify staffId belongs to a staff/PM user
  const staff = await prisma.user.findUnique({ where: { id: staffId } });
  if (!staff || (staff.role !== "STAFF" && staff.role !== "PROJECT_MANAGER" && staff.role !== "SUPER_ADMIN")) {
    return errorResponse("Invalid staff member", 400);
  }

  const updated = await prisma.projectPhase.update({
    where: { id },
    data: { assignedStaffId: staffId },
  });

  return NextResponse.json(updated);
}
