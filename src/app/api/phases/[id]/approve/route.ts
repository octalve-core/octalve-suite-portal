import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/phases/[id]/approve — Client approves a phase.
 * Handles the complex unlock chain: approve → unlock next → check balance → complete project.
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

  await prisma.$transaction(async (tx) => {
    // 1. Approve the phase
    await tx.projectPhase.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    // 2. Approve all deliverables
    await tx.deliverable.updateMany({
      where: { phaseId: id },
      data: { status: "APPROVED", visibleToClient: true },
    });

    // 3. System message
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

    // 4. Handle next phase / project completion
    if (nextIndex < phases.length) {
      // There is a next phase
      if (nextIndex === finalIndex) {
        // Next is the FINAL phase — check balance payment
        const balance = project.payments.find((p) => p.type === "BALANCE");
        if (balance && balance.amount > 0 && balance.status !== "CONFIRMED") {
          // Balance not paid — set project to AWAITING_BALANCE, don't unlock
          await tx.project.update({
            where: { id: project.id },
            data: { status: "AWAITING_BALANCE" },
          });
        } else {
          // Balance already paid or zero — unlock final phase
          await tx.projectPhase.update({
            where: { id: phases[nextIndex].id },
            data: { status: "IN_PROGRESS" },
          });
        }
      } else {
        // Normal next phase — unlock it
        await tx.projectPhase.update({
          where: { id: phases[nextIndex].id },
          data: { status: "IN_PROGRESS" },
        });
      }
    } else {
      // This was the last phase — project is complete
      await tx.project.update({
        where: { id: project.id },
        data: { status: "COMPLETED" },
      });
    }

    // 5. Notify staff/PM
    await tx.notification.create({
      data: {
        userId: project.projectManagerId,
        role: "SUPER_ADMIN",
        title: "Phase approved by client",
        body: `"${phase.title}" in ${project.title} has been approved.`,
        href: `/admin/projects/${project.id}`,
      },
    });
  });

  return NextResponse.json({ success: true });
}
