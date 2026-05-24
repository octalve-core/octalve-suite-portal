import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
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

function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : undefined;
}

type PaymentForAudit = NonNullable<Awaited<ReturnType<typeof getPaymentForAudit>>>;
type AuditTransaction = PaymentForAudit["transactions"][number];
type AuditWebhookEvent = NonNullable<AuditTransaction["webhookEvent"]>;
type AuditLedgerEntry = PaymentForAudit["walletLedgerEntries"][number];
type RelatedWebhookEvent = Awaited<ReturnType<typeof getRelatedWebhookEvents>>[number];
type LinkedTopUp = Awaited<ReturnType<typeof getLinkedTopUps>>[number];

function serializePaymentTransaction(transaction: AuditTransaction) {
  return {
    id: transaction.id,
    paymentId: transaction.paymentId,
    projectId: transaction.projectId,
    webhookEventId: transaction.webhookEventId ?? undefined,
    provider: transaction.provider,
    status: transaction.status,
    amount: transaction.amount,
    currency: transaction.currency,
    reference: transaction.reference,
    providerReference: transaction.providerReference ?? undefined,
    providerStatus: transaction.providerStatus ?? undefined,
    initiatedById: transaction.initiatedById ?? undefined,
    verifiedAt: serializeDate(transaction.verifiedAt),
    confirmedAt: serializeDate(transaction.confirmedAt),
    failedAt: serializeDate(transaction.failedAt),
    failureReason: transaction.failureReason ?? undefined,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

function serializeWebhookEvent(event: AuditWebhookEvent) {
  return {
    id: event.id,
    provider: event.provider,
    eventType: event.eventType,
    eventId: event.eventId ?? undefined,
    reference: event.reference ?? undefined,
    status: event.status,
    signatureValid: event.signatureValid,
    processedAt: serializeDate(event.processedAt),
    processingError: event.processingError ?? undefined,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

function serializeStandaloneWebhookEvent(event: RelatedWebhookEvent) {
  return {
    id: event.id,
    provider: event.provider,
    eventType: event.eventType,
    eventId: event.eventId ?? undefined,
    reference: event.reference ?? undefined,
    status: event.status,
    signatureValid: event.signatureValid,
    processedAt: serializeDate(event.processedAt),
    processingError: event.processingError ?? undefined,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

function serializeLedgerEntry(entry: AuditLedgerEntry) {
  return {
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
  };
}

function serializeWalletTopUp(topUp: LinkedTopUp) {
  return {
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
  };
}

async function getPaymentForAudit(id: string) {
  return prisma.projectPayment.findUnique({
    where: { id },
    include: {
      confirmedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      project: {
        select: {
          id: true,
          title: true,
          businessName: true,
          clientEmail: true,
          projectCode: true,
          status: true,
          totalAmount: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
            },
          },
        },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        include: {
          webhookEvent: true,
        },
      },
      walletLedgerEntries: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

async function getRelatedWebhookEvents(input: {
  webhookEventIds: string[];
  references: string[];
}) {
  const or = [];

  if (input.webhookEventIds.length) {
    or.push({ id: { in: input.webhookEventIds } });
  }

  if (input.references.length) {
    or.push({ reference: { in: input.references } });
  }

  if (!or.length) return [];

  return prisma.paymentWebhookEvent.findMany({
    where: { OR: or },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

async function getLinkedTopUps(topUpIds: string[]) {
  if (!topUpIds.length) return [];

  return prisma.walletTopUp.findMany({
    where: { id: { in: topUpIds } },
    orderBy: { createdAt: "desc" },
  });
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const payment = await getPaymentForAudit(id);

  if (!payment) {
    return errorResponse("Payment not found", 404);
  }

  const referenceCandidates = uniqueStrings([
    payment.reference,
    payment.gatewayReference,
    payment.providerReference,
    ...payment.transactions.flatMap((transaction) => [
      transaction.reference,
      transaction.providerReference,
    ]),
  ]);

  const webhookEventIds = uniqueStrings([
    ...payment.transactions.map((transaction) => transaction.webhookEventId),
  ]);

  const relatedWebhookEvents = await getRelatedWebhookEvents({
    webhookEventIds,
    references: referenceCandidates,
  });

  const transactionWebhookEvents = payment.transactions
    .map((transaction) => transaction.webhookEvent)
    .filter(
      (event): event is AuditWebhookEvent => Boolean(event),
    );

  const webhookEventsById = new Map(
    [...transactionWebhookEvents, ...relatedWebhookEvents].map((event) => [event.id, event]),
  );

  const linkedTopUps = await getLinkedTopUps(
    uniqueStrings(payment.walletLedgerEntries.map((entry) => entry.topUpId)),
  );

  const ledgerTotalIn = payment.walletLedgerEntries
    .filter((entry) => entry.direction === "IN")
    .reduce((total, entry) => total + entry.amount, 0);

  const ledgerTotalOut = payment.walletLedgerEntries
    .filter((entry) => entry.direction === "OUT")
    .reduce((total, entry) => total + entry.amount, 0);

  return noStoreJson({
    payment: {
      id: payment.id,
      projectId: payment.projectId,
      type: payment.type,
      amount: payment.amount,
      status: payment.status,
      reference: payment.reference,
      bankName: payment.bankName,
      accountName: payment.accountName,
      accountNumber: payment.accountNumber,
      clientMarkedPaidAt: serializeDate(payment.clientMarkedPaidAt),
      confirmedAt: serializeDate(payment.confirmedAt),
      note: payment.note ?? undefined,
      provider: payment.provider,
      gatewayReference: payment.gatewayReference ?? undefined,
      providerReference: payment.providerReference ?? undefined,
      paidVia: payment.paidVia ?? undefined,
      confirmedSource: payment.confirmedSource ?? undefined,
      confirmedBy: payment.confirmedBy,
      transactions: payment.transactions.map(serializePaymentTransaction),
      walletLedgerEntries: payment.walletLedgerEntries.map(serializeLedgerEntry),
    },
    project: payment.project,
    transactions: payment.transactions.map(serializePaymentTransaction),
    webhookEvents: Array.from(webhookEventsById.values()).map(serializeStandaloneWebhookEvent),
    walletLedgerEntries: payment.walletLedgerEntries.map(serializeLedgerEntry),
    linkedTopUps: linkedTopUps.map(serializeWalletTopUp),
    summary: {
      currency: "NGN",
      transactionCount: payment.transactions.length,
      webhookCount: webhookEventsById.size,
      ledgerEntryCount: payment.walletLedgerEntries.length,
      ledgerTotalIn,
      ledgerTotalOut,
      ledgerNet: ledgerTotalIn - ledgerTotalOut,
    },
  });
}