import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";
import { WALLET_LEDGER_DIRECTIONS } from "@/lib/payment-constants";

type Params = { params: Promise<{ topUpId: string }> };

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
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

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  );
}

async function getWalletBalance(userId: string) {
  const entries = await prisma.walletLedgerEntry.findMany({
    where: { userId },
    select: {
      amount: true,
      direction: true,
    },
  });

  return entries.reduce((balance, entry) => {
    if (entry.direction === WALLET_LEDGER_DIRECTIONS.IN) return balance + entry.amount;
    if (entry.direction === WALLET_LEDGER_DIRECTIONS.OUT) return balance - entry.amount;
    return balance;
  }, 0);
}

export async function GET(_request: Request, { params }: Params) {
  const { topUpId } = await params;

  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const topUp = await prisma.walletTopUp.findUnique({
    where: { id: topUpId },
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
      walletLedgerEntries: {
        orderBy: { createdAt: "desc" },
        include: {
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
        },
      },
    },
  });

  if (!topUp) {
    return errorResponse("Wallet top-up not found", 404);
  }

  const references = uniqueStrings([
    topUp.reference,
    topUp.providerReference,
  ]);

  const webhookEvents = references.length
    ? await prisma.paymentWebhookEvent.findMany({
        where: {
          provider: topUp.provider,
          reference: { in: references },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  const walletBalance = await getWalletBalance(topUp.userId);

  const ledgerCreditTotal = topUp.walletLedgerEntries
    .filter((entry) => entry.direction === WALLET_LEDGER_DIRECTIONS.IN)
    .reduce((total, entry) => total + entry.amount, 0);

  const ledgerDebitTotal = topUp.walletLedgerEntries
    .filter((entry) => entry.direction === WALLET_LEDGER_DIRECTIONS.OUT)
    .reduce((total, entry) => total + entry.amount, 0);

  return noStoreJson({
    topUp: {
      id: topUp.id,
      userId: topUp.userId,
      provider: topUp.provider,
      status: topUp.status,
      amount: topUp.amount,
      currency: topUp.currency,
      reference: topUp.reference,
      providerRecord: Boolean(topUp.providerReference),
      providerStatus: topUp.providerStatus ?? undefined,
      initiatedById: topUp.initiatedById ?? undefined,
      verifiedAt: serializeDate(topUp.verifiedAt),
      confirmedAt: serializeDate(topUp.confirmedAt),
      failedAt: serializeDate(topUp.failedAt),
      failureRecorded: Boolean(topUp.failureReason),
      createdAt: topUp.createdAt.toISOString(),
      updatedAt: topUp.updatedAt.toISOString(),
      user: serializeUser(topUp.user),
    },
    user: serializeUser(topUp.user),
    walletBalance,
    ledgerEntries: topUp.walletLedgerEntries.map((entry) => ({
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
      reference: entry.reference ? "Recorded" : undefined,
      description: entry.description ?? undefined,
      metadata: entry.metadata ?? undefined,
      createdAt: entry.createdAt.toISOString(),
      project: entry.project ?? undefined,
      payment: entry.payment ?? undefined,
    })),
    webhookEvents: webhookEvents.map((event) => ({
      id: event.id,
      provider: event.provider,
      eventType: event.eventType,
      eventRecord: Boolean(event.eventId),
      referenceRecorded: Boolean(event.reference),
      status: event.status,
      signatureValid: event.signatureValid,
      processedAt: serializeDate(event.processedAt),
      processingIssue: Boolean(event.processingError),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    })),
    timeline: [
      {
        label: "Created",
        value: topUp.createdAt.toISOString(),
        status: "DONE",
      },
      {
        label: "Provider Checkout",
        value: topUp.providerStatus ? topUp.updatedAt.toISOString() : undefined,
        status: topUp.providerStatus ? "DONE" : "PENDING",
      },
      {
        label: "Verified",
        value: serializeDate(topUp.verifiedAt),
        status: topUp.verifiedAt ? "DONE" : topUp.failedAt ? "FAILED" : "PENDING",
      },
      {
        label: "Confirmed",
        value: serializeDate(topUp.confirmedAt),
        status: topUp.confirmedAt ? "DONE" : topUp.failedAt ? "FAILED" : "PENDING",
      },
      {
        label: "Failed",
        value: serializeDate(topUp.failedAt),
        status: topUp.failedAt ? "FAILED" : "PENDING",
      },
    ],
    summary: {
      currency: topUp.currency,
      ledgerCreditTotal,
      ledgerDebitTotal,
      ledgerNet: ledgerCreditTotal - ledgerDebitTotal,
      webhookCount: webhookEvents.length,
      hasFailure: Boolean(topUp.failedAt || topUp.failureReason),
    },
  });
}