import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles } from "@/lib/api-helpers";
import {
  WALLET_LEDGER_DIRECTIONS,
  WALLET_LEDGER_ENTRY_TYPES,
  WALLET_TOPUP_STATUSES,
} from "@/lib/payment-constants";

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function sumAmount(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : undefined;
}

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    company: user.company ?? undefined,
  };
}

export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const [
    clients,
    balanceGroups,
    clientTopUpGroups,
    confirmedTopUpTotal,
    pendingTopUpCount,
    failedTopUpCount,
    ledgerEntryCount,
    topUps,
    ledgerEntries,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    prisma.walletLedgerEntry.groupBy({
      by: ["userId", "direction"],
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.walletTopUp.groupBy({
      by: ["userId", "status"],
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.walletTopUp.aggregate({
      where: { status: WALLET_TOPUP_STATUSES.CONFIRMED },
      _sum: { amount: true },
    }),
    prisma.walletTopUp.count({
      where: { status: WALLET_TOPUP_STATUSES.PENDING },
    }),
    prisma.walletTopUp.count({
      where: { status: WALLET_TOPUP_STATUSES.FAILED },
    }),
    prisma.walletLedgerEntry.count(),
    prisma.walletTopUp.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
          },
        },
      },
    }),
    prisma.walletLedgerEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 150,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            businessName: true,
            projectCode: true,
          },
        },
        payment: {
          select: {
            id: true,
            reference: true,
            type: true,
            status: true,
            amount: true,
          },
        },
        topUp: {
          select: {
            id: true,
            reference: true,
            provider: true,
            status: true,
            amount: true,
          },
        },
      },
    }),
  ]);

  const clientTotals = new Map<
    string,
    {
      totalIn: number;
      totalOut: number;
      ledgerEntryCount: number;
      topUpCount: number;
      confirmedTopUpTotal: number;
      lastActivityAt?: string;
    }
  >();

  for (const client of clients) {
    clientTotals.set(client.id, {
      totalIn: 0,
      totalOut: 0,
      ledgerEntryCount: 0,
      topUpCount: 0,
      confirmedTopUpTotal: 0,
    });
  }

  for (const group of balanceGroups) {
    const current = clientTotals.get(group.userId) ?? {
      totalIn: 0,
      totalOut: 0,
      ledgerEntryCount: 0,
      topUpCount: 0,
      confirmedTopUpTotal: 0,
    };

    if (group.direction === WALLET_LEDGER_DIRECTIONS.IN) {
      current.totalIn += sumAmount(group._sum.amount);
    }

    if (group.direction === WALLET_LEDGER_DIRECTIONS.OUT) {
      current.totalOut += sumAmount(group._sum.amount);
    }

    current.ledgerEntryCount += group._count._all;
    clientTotals.set(group.userId, current);
  }

  for (const group of clientTopUpGroups) {
    const current = clientTotals.get(group.userId) ?? {
      totalIn: 0,
      totalOut: 0,
      ledgerEntryCount: 0,
      topUpCount: 0,
      confirmedTopUpTotal: 0,
    };

    current.topUpCount += group._count._all;

    if (group.status === WALLET_TOPUP_STATUSES.CONFIRMED) {
      current.confirmedTopUpTotal += sumAmount(group._sum.amount);
    }

    clientTotals.set(group.userId, current);
  }

  for (const entry of ledgerEntries) {
    const current = clientTotals.get(entry.userId);
    if (!current) continue;

    const createdAt = entry.createdAt.toISOString();

    if (!current.lastActivityAt || createdAt > current.lastActivityAt) {
      current.lastActivityAt = createdAt;
    }
  }

  const clientsSummary = clients
    .map((client) => {
      const totals = clientTotals.get(client.id) ?? {
        totalIn: 0,
        totalOut: 0,
        ledgerEntryCount: 0,
        topUpCount: 0,
        confirmedTopUpTotal: 0,
      };

      const balance = totals.totalIn - totals.totalOut;

      return {
        user: serializeUser(client),
        balance,
        availableBalance: Math.max(balance, 0),
        totalIn: totals.totalIn,
        totalOut: totals.totalOut,
        topUpCount: totals.topUpCount,
        confirmedTopUpTotal: totals.confirmedTopUpTotal,
        ledgerEntryCount: totals.ledgerEntryCount,
        lastActivityAt: totals.lastActivityAt,
      };
    })
    .sort((a, b) => b.balance - a.balance);

  const totalCredited = balanceGroups
    .filter((group) => group.direction === WALLET_LEDGER_DIRECTIONS.IN)
    .reduce((total, group) => total + sumAmount(group._sum.amount), 0);

  const totalSpent = balanceGroups
    .filter((group) => group.direction === WALLET_LEDGER_DIRECTIONS.OUT)
    .reduce((total, group) => total + sumAmount(group._sum.amount), 0);

  const totalBalance = totalCredited - totalSpent;

  return noStoreJson({
    currency: "NGN",
    summary: {
      clientCount: clients.length,
      activeWalletCount: clientsSummary.filter(
        (client) => client.ledgerEntryCount > 0 || client.topUpCount > 0,
      ).length,
      totalBalance,
      totalCredited,
      totalSpent,
      confirmedTopUpTotal: sumAmount(confirmedTopUpTotal._sum.amount),
      pendingTopUpCount,
      failedTopUpCount,
      ledgerEntryCount,
    },
    clients: clientsSummary,
    topUps: topUps.map((topUp) => ({
      id: topUp.id,
      userId: topUp.userId,
      provider: topUp.provider,
      status: topUp.status,
      amount: topUp.amount,
      currency: topUp.currency,
      reference: topUp.reference,
      providerReference: topUp.providerReference ?? undefined,
      providerStatus: topUp.providerStatus ?? undefined,
      initiatedById: topUp.initiatedById ?? undefined,
      verifiedAt: serializeDate(topUp.verifiedAt),
      confirmedAt: serializeDate(topUp.confirmedAt),
      failedAt: serializeDate(topUp.failedAt),
      failureReason: topUp.failureReason ?? undefined,
      createdAt: topUp.createdAt.toISOString(),
      updatedAt: topUp.updatedAt.toISOString(),
      user: serializeUser(topUp.user),
    })),
    ledgerEntries: ledgerEntries.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      projectId: entry.projectId ?? undefined,
      paymentId: entry.paymentId ?? undefined,
      transactionId: entry.transactionId ?? undefined,
      topUpId: entry.topUpId ?? undefined,
      entryType: entry.entryType,
      direction: entry.direction,
      amount: entry.amount,
      currency: entry.currency,
      balanceAfter: entry.balanceAfter ?? undefined,
      reference: entry.reference,
      description: entry.description ?? undefined,
      metadata: entry.metadata ?? undefined,
      createdAt: entry.createdAt.toISOString(),
      user: serializeUser(entry.user),
      project: entry.project ?? undefined,
      payment: entry.payment ?? undefined,
      topUp: entry.topUp ?? undefined,
    })),
  });
}