import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/phases/[id]/deliverables — Add a deliverable to a phase.
 * Role: STAFF, PROJECT_MANAGER, SUPER_ADMIN.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "STAFF", "PROJECT_MANAGER", "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json();
  const { name, link, linkType, description } = body;

  if (!name?.trim()) return errorResponse("Deliverable name is required", 400);

  const phase = await prisma.projectPhase.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          projectManagerId: true,
        },
      },
    },
  });
  if (!phase) return errorResponse("Phase not found", 404);

  const isAdmin = result.role === "SUPER_ADMIN";
  const isAssignedStaff =
    result.role === "STAFF" && phase.assignedStaffId === result.user.id;
  const isAssignedProjectManager =
    result.role === "PROJECT_MANAGER" &&
    (phase.project.projectManagerId === result.user.id ||
      phase.assignedStaffId === result.user.id);

  if (!isAdmin && !isAssignedStaff && !isAssignedProjectManager) {
    return errorResponse("Forbidden", 403);
  }

  const deliverable = await prisma.deliverable.create({
    data: {
      phaseId: id,
      name: name.trim(),
      description: description ?? null,
      link: link ?? null,
      linkType: linkType ?? null,
      status: "DRAFT",
      visibleToClient: false,
      submittedById: result.user.id,
    },
  });

  return NextResponse.json(deliverable, { status: 201 });
}
