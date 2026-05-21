import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  if (result.role !== "CLIENT") {
    return errorResponse("Forbidden", 403);
  }

  const entries = await prisma.walletLedgerEntry.findMany({
    where: { userId: result.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totals = entries.reduce(
    (acc, entry) => {
      const amount = Number.isFinite(entry.amount) ? entry.amount : 0;

      if (entry.direction === "IN") {
        acc.balance += amount;
      }

      if (entry.direction === "OUT") {
        acc.balance -= amount;
      }

      if (entry.entryType === "HOLD") {
        acc.heldBalance += amount;
      }

      if (entry.entryType === "CREDIT" || entry.entryType === "REFUND" || entry.entryType === "RELEASE") {
        acc.totalCredited += amount;
      }

      if (entry.entryType === "DEBIT" || entry.entryType === "PROJECT_PAYMENT") {
        acc.totalSpent += amount;
      }

      return acc;
    },
    {
      balance: 0,
      heldBalance: 0,
      totalCredited: 0,
      totalSpent: 0,
    },
  );

  const availableBalance = Math.max(totals.balance - totals.heldBalance, 0);

  const response = NextResponse.json({
    currency: "NGN",
    balance: totals.balance,
    availableBalance,
    heldBalance: totals.heldBalance,
    totalCredited: totals.totalCredited,
    totalSpent: totals.totalSpent,
    entries: entries.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      projectId: entry.projectId ?? undefined,
      paymentId: entry.paymentId ?? undefined,
      transactionId: entry.transactionId ?? undefined,
      entryType: entry.entryType,
      direction: entry.direction,
      amount: entry.amount,
      currency: entry.currency,
      balanceAfter: entry.balanceAfter ?? undefined,
      reference: entry.reference,
      description: entry.description ?? undefined,
      metadata: entry.metadata ?? undefined,
      createdAt: entry.createdAt.toISOString(),
    })),
  });

  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}