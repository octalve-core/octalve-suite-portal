import type { Prisma } from "@prisma/client";
import {
  PAYMENT_CONFIRMATION_SOURCES,
  PAYMENT_PROVIDERS,
  WALLET_LEDGER_DIRECTIONS,
  WALLET_LEDGER_ENTRY_TYPES,
} from "@/lib/payment-constants";

type WalletLedgerTx = Prisma.TransactionClient;

export type RecordExternalProjectPaymentLedgerInput = {
  userId: string;
  projectId: string;
  projectTitle: string;
  paymentId: string;
  paymentReference: string;
  paymentType: string;
  provider: string;
  source: string;
  transactionId?: string | null;
  amount: number;
  currency?: string;
  gatewayReference?: string | null;
  providerReference?: string | null;
};

function cleanReference(value: string) {
  return value
    .trim()
    .replace(/[^A-Za-z0-9._-]/g, "-")
    .slice(0, 140);
}

function externalCreditReference(paymentReference: string) {
  return `EXT-IN-${cleanReference(paymentReference)}`;
}

function projectDebitReference(paymentReference: string) {
  return `PROJECT-OUT-${cleanReference(paymentReference)}`;
}

function cleanMetadata(input: RecordExternalProjectPaymentLedgerInput) {
  const metadata: Record<string, string | number | null> = {
    paymentType: input.paymentType,
    provider: input.provider,
    source: input.source,
    paymentReference: input.paymentReference,
    gatewayReference: input.gatewayReference ?? null,
    providerReference: input.providerReference ?? null,
  };

  return metadata;
}

async function getCurrentWalletBalance(tx: WalletLedgerTx, userId: string) {
  const entries = await tx.walletLedgerEntry.findMany({
    where: { userId },
    select: {
      direction: true,
      amount: true,
    },
  });

  return entries.reduce((balance, entry) => {
    if (entry.direction === WALLET_LEDGER_DIRECTIONS.IN) return balance + entry.amount;
    if (entry.direction === WALLET_LEDGER_DIRECTIONS.OUT) return balance - entry.amount;
    return balance;
  }, 0);
}

/**
 * Records externally paid project payments as a net-zero client wallet ledger settlement:
 * 1. CREDIT / IN — external payment received
 * 2. PROJECT_PAYMENT / OUT — payment applied to the project
 *
 * This preserves an auditable finance trail without creating a false wallet balance.
 */
export async function recordExternalProjectPaymentLedgerSettlement(
  tx: WalletLedgerTx,
  input: RecordExternalProjectPaymentLedgerInput,
) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { created: false, reason: "invalid_amount" as const };
  }

  if (
    input.provider === PAYMENT_PROVIDERS.WALLET ||
    input.source === PAYMENT_CONFIRMATION_SOURCES.WALLET_LEDGER
  ) {
    return { created: false, reason: "wallet_payment_excluded" as const };
  }

  const currency = input.currency ?? "NGN";
  const creditReference = externalCreditReference(input.paymentReference);
  const debitReference = projectDebitReference(input.paymentReference);

  const [existingCredit, existingDebit] = await Promise.all([
    tx.walletLedgerEntry.findUnique({ where: { reference: creditReference } }),
    tx.walletLedgerEntry.findUnique({ where: { reference: debitReference } }),
  ]);

  if (existingCredit && existingDebit) {
    return { created: false, reason: "already_recorded" as const };
  }

  let balance = await getCurrentWalletBalance(tx, input.userId);
  const metadata = cleanMetadata(input);

  if (!existingCredit) {
    balance += input.amount;

    await tx.walletLedgerEntry.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        paymentId: input.paymentId,
        transactionId: input.transactionId ?? null,
        entryType: WALLET_LEDGER_ENTRY_TYPES.CREDIT,
        direction: WALLET_LEDGER_DIRECTIONS.IN,
        amount: input.amount,
        currency,
        balanceAfter: balance,
        reference: creditReference,
        description: `${input.paymentType.toLowerCase()} payment received for ${input.projectTitle}`,
        metadata,
      },
    });
  }

  if (!existingDebit) {
    balance -= input.amount;

    await tx.walletLedgerEntry.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        paymentId: input.paymentId,
        transactionId: input.transactionId ?? null,
        entryType: WALLET_LEDGER_ENTRY_TYPES.PROJECT_PAYMENT,
        direction: WALLET_LEDGER_DIRECTIONS.OUT,
        amount: input.amount,
        currency,
        balanceAfter: balance,
        reference: debitReference,
        description: `${input.paymentType.toLowerCase()} payment applied to ${input.projectTitle}`,
        metadata,
      },
    });
  }

  return { created: true, reason: "recorded" as const };
}