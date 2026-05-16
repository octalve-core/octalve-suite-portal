import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/payments/[id]/mark-paid — Client marks payment as paid.
 * Role: CLIENT (must own the project).
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

  await prisma.$transaction(async (tx) => {
    // Mark payment as pending confirmation
    await tx.projectPayment.update({
      where: { id },
      data: {
        status: "PENDING_CONFIRMATION",
        clientMarkedPaidAt: new Date(),
      },
    });

    // Update project status
    const newStatus = payment.type === "DEPOSIT"
      ? "DEPOSIT_PENDING_CONFIRMATION" as const
      : "BALANCE_PENDING_CONFIRMATION" as const;

    await tx.project.update({
      where: { id: payment.projectId },
      data: { status: newStatus },
    });

    // Notify admin
    await tx.notification.create({
      data: {
        role: "SUPER_ADMIN",
        title: "Payment pending confirmation",
        body: `${payment.project.title} — ${payment.type} payment marked as paid.`,
        href: "/admin/payments",
      },
    });
  });

  return NextResponse.json({ success: true });
}
