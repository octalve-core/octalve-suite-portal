import { NextResponse } from "next/server";
import { ADMIN_AUDIT_ACTIONS, writeAdminAuditLog } from "@/lib/admin-audit";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/payments/[id]/reject — Admin rejects a payment.
 * Role: SUPER_ADMIN only.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;
  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));
  const { note } = body as { note?: string };

  const payment = await prisma.projectPayment.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!payment) return errorResponse("Payment not found", 404);
  if (payment.status !== "PENDING_CONFIRMATION") {
    return errorResponse("Payment is not pending confirmation", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectPayment.update({
      where: { id },
      data: { status: "REJECTED", note: note ?? null },
    });

    // Revert project status
    const revertStatus = payment.type === "DEPOSIT"
      ? "APPROVED_AWAITING_DEPOSIT" as const
      : "AWAITING_BALANCE" as const;

    await tx.project.update({
      where: { id: payment.projectId },
      data: { status: revertStatus },
    });

    // Reset payment status so client can retry
    await tx.projectPayment.update({
      where: { id },
      data: { status: "UNPAID", clientMarkedPaidAt: null },
    });

    // Notify client
    await tx.notification.create({
      data: {
        userId: payment.project.clientId,
        title: "Payment rejected",
        body: `Your ${payment.type.toLowerCase()} payment was rejected.${note ? ` Reason: ${note}` : ""}`,
        href: `/client/payments/${id}`,
      },
    });
  });

  await writeAdminAuditLog({
    actorId: result.user.id,
    actorRole: "SUPER_ADMIN",
    action: ADMIN_AUDIT_ACTIONS.PAYMENT_REJECT,
    targetType: "PAYMENT",
    targetId: payment.id,
    targetLabel: payment.reference,
    riskLevel: "HIGH",
    reason: note ?? undefined,
    metadata: {
      projectId: payment.projectId,
      paymentType: payment.type,
      amount: payment.amount,
      previousStatus: payment.status,
    },
  });

  return NextResponse.json({ success: true });
}
