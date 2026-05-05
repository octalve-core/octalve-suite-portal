import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/phases/[id]/request-changes — Client requests changes on a phase.
 * Role: CLIENT only.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "CLIENT");
  if (forbidden) return forbidden;

  const body = await request.json();
  const { message } = body;
  if (!message?.trim()) return errorResponse("Change request message is required", 400);

  const phase = await prisma.projectPhase.findUnique({
    where: { id },
    include: { project: { select: { clientId: true, projectManagerId: true, title: true } } },
  });

  if (!phase) return errorResponse("Phase not found", 404);
  if (phase.project.clientId !== result.user.id) return errorResponse("Forbidden", 403);
  if (phase.status !== "AWAITING_APPROVAL") {
    return errorResponse("Phase is not awaiting approval", 400);
  }

  await prisma.$transaction(async (tx) => {
    // Update phase
    await tx.projectPhase.update({
      where: { id },
      data: {
        status: "CHANGES_REQUESTED",
        changeRequest: message.trim(),
      },
    });

    // Set deliverables to NEEDS_CHANGES
    await tx.deliverable.updateMany({
      where: { phaseId: id, status: { not: "APPROVED" } },
      data: { status: "NEEDS_CHANGES" },
    });

    // Add client message to thread
    await tx.phaseMessage.create({
      data: {
        phaseId: id,
        senderId: result.user.id,
        senderName: result.user.name ?? "Client",
        senderRole: "CLIENT",
        message: message.trim(),
        type: "MESSAGE",
      },
    });

    // Notify assigned staff + PM
    await tx.notification.create({
      data: {
        userId: phase.assignedStaffId ?? phase.project.projectManagerId,
        title: "Changes requested",
        body: `Client requested changes on "${phase.title}".`,
        href: `/staff/phases/${id}`,
      },
    });
  });

  return NextResponse.json({ success: true });
}
