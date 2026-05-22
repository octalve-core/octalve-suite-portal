import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/payments/[id]/mark-paid — Client marks payment as paid.
 * Role: CLIENT only, and the payment must be due for the project's current state.
 */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const payment = await prisma.projectPayment.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!payment) return errorResponse("Payment not found", 404);
  if (payment.project.clientId !== result.user.id) return errorResponse("Forbidden", 403);
  if (payment.status !== "UNPAID") return errorResponse("Payment is not in UNPAID status", 400);

  const expectedProjectStatus =
    payment.type === "DEPOSIT" ? "APPROVED_AWAITING_DEPOSIT" : "AWAITING_BALANCE";

  if (payment.project.status !== expectedProjectStatus) {
    return errorResponse(
      payment.type === "DEPOSIT"
        ? "Deposit payment is not currently due for this project."
        : "Balance payment is not currently due for this project.",
      400,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectPayment.update({
      where: { id },
      data: {
        status: "PENDING_CONFIRMATION",
        clientMarkedPaidAt: new Date(),
        note: null,
      },
    });

    const newStatus =
      payment.type === "DEPOSIT" ? "DEPOSIT_PENDING_CONFIRMATION" : "BALANCE_PENDING_CONFIRMATION";

    await tx.project.update({
      where: { id: payment.projectId },
      data: { status: newStatus },
    });

    await tx.notification.create({
      data: {
        role: "SUPER_ADMIN",
        title: "Payment pending confirmation",
        body: `${payment.project.title} — ${payment.type} payment marked as paid.`,
        href: `/admin/payments/${id}`,
      },
    });
  });

  return NextResponse.json({ success: true });
}