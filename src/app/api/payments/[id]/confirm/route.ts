import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";
import {
  PAYMENT_CONFIRMATION_SOURCES,
  PAYMENT_PROVIDERS,
} from "@/lib/payment-constants";
import { confirmProjectPayment } from "@/lib/payment-confirmation";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/payments/[id]/confirm — Admin confirms manual bank payment.
 * Uses the shared payment confirmation state machine.
 */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const payment = await prisma.projectPayment.findUnique({
    where: { id },
    include: { project: true },
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

  await confirmProjectPayment({
    paymentId: id,
    provider: PAYMENT_PROVIDERS.MANUAL_BANK,
    source: PAYMENT_CONFIRMATION_SOURCES.ADMIN_MANUAL,
    confirmedById: result.user.id,
  });

  return NextResponse.json({ success: true });
}