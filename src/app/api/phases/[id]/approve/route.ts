import { NextResponse } from "next/server";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";
import { notifyWorkspace } from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/phases/[id]/approve   Client approves a phase.
 * Handles the complex unlock chain: approve -> unlock next -> check balance -> complete project.
 * Role: CLIENT only.
 */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "CLIENT");
  if (forbidden) return forbidden;

  const phase = await prisma.projectPhase.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          phases: { orderBy: { phaseNumber: "asc" } },
          payments: true,
        },
      },
    },
  });

  if (!phase) return errorResponse("Phase not found", 404);
  if (phase.project.clientId !== result.user.id) return errorResponse("Forbidden", 403);
  if (phase.status !== "AWAITING_APPROVAL") {
    return errorResponse("Phase is not awaiting approval", 400);
  }

  const project = phase.project;
  const phases = project.phases;
  const currentIndex = phases.findIndex((p) => p.id === id);
  const nextIndex = currentIndex + 1;
  const finalIndex = phases.length - 1;
  const notifyUserId = phase.assignedStaffId ?? project.projectManagerId ?? null;
  const notifyHref = phase.assignedStaffId
    ? `/staff/phases/${id}`
    : `/admin/projects/${project.id}`;

  await prisma.$transaction(async (tx) => {
    await tx.projectPhase.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    await tx.deliverable.updateMany({
      where: { phaseId: id },
      data: { status: "APPROVED", visibleToClient: true },
    });

    await tx.phaseMessage.create({
      data: {
        phaseId: id,
        senderId: result.user.id,
        senderName: result.user.name ?? "Client",
        senderRole: "CLIENT",
        message: `${result.user.name ?? "Client"} approved this phase`,
        type: "SYSTEM",
      },
    });

    if (nextIndex < phases.length) {
      if (nextIndex === finalIndex) {
        const balance = project.payments.find((p) => p.type === "BALANCE");

        if (balance && balance.amount > 0 && balance.status !== "CONFIRMED") {
          await tx.project.update({
            where: { id: project.id },
            data: { status: "AWAITING_BALANCE" },
          });
        } else {
          await tx.projectPhase.update({
            where: { id: phases[nextIndex].id },
            data: { status: "IN_PROGRESS" },
          });
        }
      } else {
        await tx.projectPhase.update({
          where: { id: phases[nextIndex].id },
          data: { status: "IN_PROGRESS" },
        });
      }
    } else {
      await tx.project.update({
        where: { id: project.id },
        data: { status: "COMPLETED" },
      });
    }

    await tx.notification.create({
      data: {
        userId: notifyUserId,
        role: notifyUserId ? null : "SUPER_ADMIN",
        title: "Phase approved by client",
        body: `"${phase.title}" in ${project.title} has been approved.`,
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
    eventKey: "PHASE_APPROVED",
    skipInApp: true,
    title: "Phase approved by client",
    body: `"${phase.title}" in ${project.title} has been approved.`,
    href: notifyHref,
    email: recipient?.email
      ? {
          to: recipient.email,
          eventKey: "PHASE_APPROVED",
          variables: {
            clientName: recipient.name ?? "Team",
            projectTitle: project.title,
            projectName: project.title,
            phaseTitle: phase.title,
          },
        }
      : undefined,
  });

  return NextResponse.json({ success: true });
}