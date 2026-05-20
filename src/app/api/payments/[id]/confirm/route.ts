import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/payments/[id]/confirm — Admin confirms payment received.
 * Handles the state machine:
 * - deposit confirmation opens the project and first phase
 * - balance confirmation opens the final phase
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

  if (payment.type === "DEPOSIT" && payment.project.status !== "DEPOSIT_PENDING_CONFIRMATION") {
    return errorResponse("Deposit payment is not awaiting confirmation for this project.", 400);
  }

  if (payment.type === "BALANCE" && payment.project.status !== "BALANCE_PENDING_CONFIRMATION") {
    return errorResponse("Balance payment is not awaiting confirmation for this project.", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectPayment.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        confirmedById: result.user.id,
        note: null,
      },
    });

    const project = payment.project;
    const phases = project.phases;

    if (payment.type === "DEPOSIT") {
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

    if (payment.type === "BALANCE") {
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