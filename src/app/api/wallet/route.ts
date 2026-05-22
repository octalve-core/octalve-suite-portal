import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";
import {
  WALLET_LEDGER_DIRECTIONS,
  WALLET_LEDGER_ENTRY_TYPES,
} from "@/lib/payment-constants";

function sumAmount(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  if (result.role !== "CLIENT") {
    return errorResponse("Forbidden", 403);
  }

  const userId = result.user.id;

  const [
    entries,
    totalIn,
    totalOut,
    held,
    credited,
    spent,
  ] = await Promise.all([
    prisma.walletLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.walletLedgerEntry.aggregate({
      where: { userId, direction: WALLET_LEDGER_DIRECTIONS.IN },
      _sum: { amount: true },
    }),
    prisma.walletLedgerEntry.aggregate({
      where: { userId, direction: WALLET_LEDGER_DIRECTIONS.OUT },
      _sum: { amount: true },
    }),
    prisma.walletLedgerEntry.aggregate({
      where: { userId, entryType: WALLET_LEDGER_ENTRY_TYPES.HOLD },
      _sum: { amount: true },
    }),
    prisma.walletLedgerEntry.aggregate({
      where: {
        userId,
        entryType: {
          in: [
            WALLET_LEDGER_ENTRY_TYPES.CREDIT,
            WALLET_LEDGER_ENTRY_TYPES.REFUND,
            WALLET_LEDGER_ENTRY_TYPES.RELEASE,
          ],
        },
      },
      _sum: { amount: true },
    }),
    prisma.walletLedgerEntry.aggregate({
      where: {
        userId,
        entryType: {
          in: [
            WALLET_LEDGER_ENTRY_TYPES.DEBIT,
            WALLET_LEDGER_ENTRY_TYPES.PROJECT_PAYMENT,
          ],
        },
      },
      _sum: { amount: true },
    }),
  ]);

  const balance = sumAmount(totalIn._sum.amount) - sumAmount(totalOut._sum.amount);
  const heldBalance = sumAmount(held._sum.amount);
  const availableBalance = Math.max(balance - heldBalance, 0);

  const response = NextResponse.json({
    currency: "NGN",
    balance,
    availableBalance,
    heldBalance,
    totalCredited: sumAmount(credited._sum.amount),
    totalSpent: sumAmount(spent._sum.amount),
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