import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/phases/[id]/request-approval — PM/Admin requests client approval for a phase.
 * Sets phase to AWAITING_APPROVAL, makes deliverables visible, creates system message.
 * Role: PROJECT_MANAGER, SUPER_ADMIN.
 */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "PROJECT_MANAGER", "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const phase = await prisma.projectPhase.findUnique({
    where: { id },
    include: {
      deliverables: true,
      project: { select: { clientId: true, title: true } },
    },
  });

  if (!phase) return errorResponse("Phase not found", 404);
  if (phase.status === "APPROVED") return errorResponse("Phase is already approved", 400);
  if (phase.status === "LOCKED") return errorResponse("Phase is locked", 400);

  await prisma.$transaction(async (tx) => {
    // Update phase status
    await tx.projectPhase.update({
      where: { id },
      data: {
        status: "AWAITING_APPROVAL",
        approvalRequestedAt: new Date(),
      },
    });

    // Mark non-approved deliverables as READY_FOR_REVIEW and visible
    await tx.deliverable.updateMany({
      where: {
        phaseId: id,
        status: { not: "APPROVED" },
      },
      data: {
        status: "READY_FOR_REVIEW",
        visibleToClient: true,
      },
    });

    // System message
    await tx.phaseMessage.create({
      data: {
        phaseId: id,
        senderId: result.user.id,
        senderName: "System",
        senderRole: "SYSTEM",
        message: "Approval requested for this phase",
        type: "SYSTEM",
      },
    });

    // Notify client
    await tx.notification.create({
      data: {
        userId: phase.project.clientId,
        title: "Phase approval requested",
        body: `"${phase.title}" is ready for your review.`,
        href: "/client/approvals",
      },
    });
  });

  return NextResponse.json({ success: true });
}
