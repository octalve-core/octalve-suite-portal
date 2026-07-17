import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/phases/[id] — Phase detail with deliverables and messages.
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const phase = await prisma.projectPhase.findUnique({
    where: { id },
    include: {
      deliverables: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
      project: { select: { clientId: true, projectManagerId: true } },
    },
  });

  if (!phase) return errorResponse("Phase not found", 404);

  const isAdmin = result.role === "SUPER_ADMIN";
  const isClientOwner = result.role === "CLIENT" && phase.project.clientId === result.user.id;
  const isAssignedStaff =
    result.role === "STAFF" && phase.assignedStaffId === result.user.id;
  const isAssignedProjectManager =
    result.role === "PROJECT_MANAGER" &&
    (phase.project.projectManagerId === result.user.id ||
      phase.assignedStaffId === result.user.id);

  if (!isAdmin && !isClientOwner && !isAssignedStaff && !isAssignedProjectManager) {
    return errorResponse("Forbidden", 403);
  }

  return NextResponse.json(phase);
}
