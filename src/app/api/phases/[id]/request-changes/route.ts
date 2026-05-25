import { NextResponse } from "next/server";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";
import { notifyWorkspace } from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/phases/[id]/request-changes   Client requests changes on a phase.
 * Role: CLIENT only.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "CLIENT");
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));
  const message = String(body.message ?? "").trim();

  if (!message) return errorResponse("Change request message is required", 400);

  const phase = await prisma.projectPhase.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          clientId: true,
          projectManagerId: true,
          title: true,
        },
      },
    },
  });

  if (!phase) return errorResponse("Phase not found", 404);
  if (phase.project.clientId !== result.user.id) return errorResponse("Forbidden", 403);
  if (phase.status !== "AWAITING_APPROVAL") {
    return errorResponse("Phase is not awaiting approval", 400);
  }

  const safeMessage = message.slice(0, 1000);
  const notifyUserId = phase.assignedStaffId ?? phase.project.projectManagerId ?? null;
  const notifyHref = phase.assignedStaffId
    ? `/staff/phases/${id}`
    : `/admin/projects/${phase.projectId}`;

  await prisma.$transaction(async (tx) => {
    await tx.projectPhase.update({
      where: { id },
      data: {
        status: "CHANGES_REQUESTED",
        changeRequest: safeMessage,
      },
    });

    await tx.deliverable.updateMany({
      where: { phaseId: id, status: { not: "APPROVED" } },
      data: { status: "NEEDS_CHANGES" },
    });

    await tx.phaseMessage.create({
      data: {
        phaseId: id,
        senderId: result.user.id,
        senderName: result.user.name ?? "Client",
        senderRole: "CLIENT",
        message: safeMessage,
        type: "MESSAGE",
      },
    });

    await tx.notification.create({
      data: {
        userId: notifyUserId,
        role: notifyUserId ? null : "SUPER_ADMIN",
        title: "Changes requested",
        body: `Client requested changes on "${phase.title}".`,
        href: notifyHref,
      },
    });
  });

  const recipient = notifyUserId
    ? await prisma.user.findUnique({
        where: { id: notifyUserId },
        select: {
          name: true,
          email: true,
        },
      })
    : null;

  await notifyWorkspace({
    userId: notifyUserId,
    role: notifyUserId ? null : "SUPER_ADMIN",
    eventKey: "PHASE_CHANGES_REQUESTED",
    skipInApp: true,
    title: "Changes requested",
    body: `Client requested changes on "${phase.title}".`,
    href: notifyHref,
    email: recipient?.email
      ? {
          to: recipient.email,
          eventKey: "PHASE_CHANGES_REQUESTED",
          variables: {
            clientName: recipient.name ?? "Team",
            projectTitle: phase.project.title,
            projectName: phase.project.title,
            phaseTitle: phase.title,
            message: safeMessage.slice(0, 500),
          },
        }
      : undefined,
  });

  return NextResponse.json({ success: true });
}