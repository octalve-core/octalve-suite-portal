import { NextResponse } from "next/server";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";
import { notifyWorkspace } from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/phases/[id]/request-approval   PM/Admin requests client approval for a phase.
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
      project: {
        select: {
          clientId: true,
          title: true,
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!phase) return errorResponse("Phase not found", 404);
  if (phase.status === "APPROVED") return errorResponse("Phase is already approved", 400);
  if (phase.status === "LOCKED") return errorResponse("Phase is locked", 400);

  await prisma.$transaction(async (tx) => {
    await tx.projectPhase.update({
      where: { id },
      data: {
        status: "AWAITING_APPROVAL",
        approvalRequestedAt: new Date(),
      },
    });

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

    await tx.notification.create({
      data: {
        userId: phase.project.clientId,
        title: "Phase approval requested",
        body: `"${phase.title}" is ready for your review.`,
        href: "/client/approvals",
      },
    });
  });

  await notifyWorkspace({
    userId: phase.project.clientId,
    eventKey: "PHASE_APPROVAL_REQUESTED",
    skipInApp: true,
    title: "Phase approval requested",
    body: `"${phase.title}" is ready for your review.`,
    href: "/client/approvals",
    email: {
      to: phase.project.client.email,
      eventKey: "PHASE_APPROVAL_REQUESTED",
      variables: {
        clientName: phase.project.client.name ?? "Client",
        projectTitle: phase.project.title,
        projectName: phase.project.title,
        phaseTitle: phase.title,
      },
    },
  });

  return NextResponse.json({ success: true });
}