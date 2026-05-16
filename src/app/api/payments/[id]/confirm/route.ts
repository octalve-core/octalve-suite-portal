import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/payments/[id]/confirm — Admin confirms payment received.
 * Handles the critical state machine: deposit → unlock first phase, balance → unlock final phase.
 * Role: SUPER_ADMIN only.
 */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const payment = await prisma.projectPayment.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          phases: { orderBy: { phaseNumber: "asc" } },
        },
      },
    },
  });

  if (!payment) return errorResponse("Payment not found", 404);
  if (payment.status !== "PENDING_CONFIRMATION") {
    return errorResponse("Payment is not pending confirmation", 400);
  }

  await prisma.$transaction(async (tx) => {
    // 1. Confirm the payment
    await tx.projectPayment.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        confirmedById: result.user.id,
      },
    });

    const project = payment.project;
    const phases = project.phases;

    if (payment.type === "DEPOSIT") {
      // Deposit confirmed → project becomes ACTIVE, unlock first phase
      await tx.project.update({
        where: { id: project.id },
        data: { status: "ACTIVE" },
      });

      const firstPhase = phases[0];
      if (firstPhase && firstPhase.status === "LOCKED") {
        await tx.projectPhase.update({
          where: { id: firstPhase.id },
          data: { status: "IN_PROGRESS" },
        });
      }
    }

    if (payment.type === "BALANCE" && project.status === "BALANCE_PENDING_CONFIRMATION") {
      // Balance confirmed → project becomes ACTIVE, unlock final phase
      await tx.project.update({
        where: { id: project.id },
        data: { status: "ACTIVE" },
      });

      const finalPhase = phases[phases.length - 1];
      if (finalPhase && finalPhase.status === "LOCKED") {
        await tx.projectPhase.update({
          where: { id: finalPhase.id },
          data: { status: "IN_PROGRESS" },
        });
      }
    }

    // Notify client
    await tx.notification.create({
      data: {
        userId: project.clientId,
        title: "Payment confirmed",
        body: `Your ${payment.type.toLowerCase()} payment for ${project.title} has been confirmed.`,
        href: "/client",
      },
    });
  });

  return NextResponse.json({ success: true });
}
