import { prisma } from "@/lib/prisma";
import { Prisma, type ProjectStatus } from "@prisma/client";
import {
  PAYMENT_CONFIRMATION_SOURCES,
  PAYMENT_PROVIDERS,
  PAYMENT_TRANSACTION_STATUSES,
  WEBHOOK_PROCESSING_STATUSES,
} from "@/lib/payment-constants";
import {
  recordExternalProjectPaymentLedgerSettlement,
  recordWalletProjectPaymentDebit,
} from "@/lib/wallet-ledger";

export type ConfirmProjectPaymentInput = {
  paymentId: string;
  provider: string;
  source: string;
  confirmedById?: string | null;
  gatewayReference?: string | null;
  providerReference?: string | null;
  paidVia?: string | null;
  providerStatus?: string | null;
  transactionId?: string | null;
  webhookEventId?: string | null;
  providerDisplayName?: string;
  walletDebit?: boolean;
};

export type ConfirmProjectPaymentResult = {
  status: "CONFIRMED" | "ALREADY_CONFIRMED";
  paymentId: string;
  projectId: string;
  projectStatus: string;
  paymentType: string;
};

function expectedProjectStatusForPayment(type: string, source: string): ProjectStatus[] {
  const isManualAdmin = source === PAYMENT_CONFIRMATION_SOURCES.ADMIN_MANUAL;

  if (type === "DEPOSIT") {
    return isManualAdmin
      ? ["DEPOSIT_PENDING_CONFIRMATION"]
      : ["APPROVED_AWAITING_DEPOSIT", "DEPOSIT_PENDING_CONFIRMATION"];
  }

  return isManualAdmin
    ? ["BALANCE_PENDING_CONFIRMATION"]
    : ["AWAITING_BALANCE", "BALANCE_PENDING_CONFIRMATION"];
}

function expectedPaymentStatusForSource(source: string) {
  return source === PAYMENT_CONFIRMATION_SOURCES.ADMIN_MANUAL
    ? "PENDING_CONFIRMATION"
    : "UNPAID";
}

function projectStatusAfterPayment(type: string): ProjectStatus {
  if (type === "DEPOSIT") return "ACTIVE";
  if (type === "BALANCE") return "ACTIVE";

  return "ACTIVE";
}

function safeProviderLabel(provider: string, providerDisplayName?: string) {
  if (providerDisplayName?.trim()) return providerDisplayName.trim();

  if (provider === PAYMENT_PROVIDERS.MANUAL_BANK) return "manual bank transfer";
  if (provider === PAYMENT_PROVIDERS.PAYSTACK) return "Paystack";
  if (provider === PAYMENT_PROVIDERS.FLUTTERWAVE) return "Flutterwave";
  if (provider === PAYMENT_PROVIDERS.WALLET) return "Octalve Wallet";

  return provider.replaceAll("_", " ").toLowerCase();
}

async function updateLinkedAutomationRecords(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  input: ConfirmProjectPaymentInput,
  status: "CONFIRMED" | "ALREADY_CONFIRMED",
) {
  const now = new Date();

  if (input.transactionId) {
    const transactionData = {
      status: PAYMENT_TRANSACTION_STATUSES.CONFIRMED,
      verifiedAt: now,
      confirmedAt: now,
      providerStatus: input.providerStatus ?? undefined,
      providerReference: input.providerReference ?? undefined,
      webhookEventId: input.webhookEventId ?? undefined,
    };

    await tx.paymentTransaction.update({
      where: { id: input.transactionId },
      data: transactionData,
    });
  }

  if (input.webhookEventId) {
    await tx.paymentWebhookEvent.update({
      where: { id: input.webhookEventId },
      data: {
        status: WEBHOOK_PROCESSING_STATUSES.PROCESSED,
        processedAt: now,
        processingError: null,
      },
    });
  }

  return status;
}

export async function confirmProjectPayment(
  input: ConfirmProjectPaymentInput,
): Promise<ConfirmProjectPaymentResult> {
  return prisma.$transaction(async (tx) => {
    const freshPayment = await tx.projectPayment.findUnique({
      where: { id: input.paymentId },
      include: {
        project: {
          include: {
            phases: { orderBy: { phaseNumber: "asc" } },
          },
        },
      },
    });

    if (!freshPayment) {
      throw new Error("Payment not found");
    }

    if (freshPayment.status === "CONFIRMED") {
      await updateLinkedAutomationRecords(tx, input, "ALREADY_CONFIRMED");

      await recordExternalProjectPaymentLedgerSettlement(tx, {
        userId: freshPayment.project.clientId,
        projectId: freshPayment.projectId,
        projectTitle: freshPayment.project.title,
        paymentId: freshPayment.id,
        paymentReference: freshPayment.reference,
        paymentType: freshPayment.type,
        provider: input.provider,
        source: input.source,
        transactionId: input.transactionId ?? null,
        amount: freshPayment.amount,
        currency: "NGN",
        gatewayReference: input.gatewayReference ?? null,
        providerReference: input.providerReference ?? null,
      });
      return {
        status: "ALREADY_CONFIRMED",
        paymentId: freshPayment.id,
        projectId: freshPayment.projectId,
        projectStatus: freshPayment.project.status,
        paymentType: freshPayment.type,
      };
    }

    const expectedPaymentStatus = expectedPaymentStatusForSource(input.source);

    if (freshPayment.status !== expectedPaymentStatus) {
      throw new Error("Payment is not in a payable state");
    }

    const allowedProjectStatuses = expectedProjectStatusForPayment(
      freshPayment.type,
      input.source,
    );

    if (!allowedProjectStatuses.includes(freshPayment.project.status)) {
      throw new Error("Project is not in a payable state");
    }

    const now = new Date();
    const nextProjectStatus = projectStatusAfterPayment(freshPayment.type);

    const paymentUpdateData = {
      status: "CONFIRMED" as const,
      confirmedAt: now,
      note: null,
      provider: input.provider,
      confirmedSource: input.source,
    };

    if (input.confirmedById) {
      Object.assign(paymentUpdateData, { confirmedById: input.confirmedById });
    }

    if (input.source !== PAYMENT_CONFIRMATION_SOURCES.ADMIN_MANUAL) {
      Object.assign(paymentUpdateData, { clientMarkedPaidAt: now });
    }

    if (input.gatewayReference !== undefined) {
      Object.assign(paymentUpdateData, { gatewayReference: input.gatewayReference });
    }

    if (input.providerReference !== undefined) {
      Object.assign(paymentUpdateData, { providerReference: input.providerReference });
    }

    if (input.paidVia !== undefined) {
      Object.assign(paymentUpdateData, { paidVia: input.paidVia });
    }

    if (input.walletDebit) {
      await recordWalletProjectPaymentDebit(tx, {
        userId: freshPayment.project.clientId,
        projectId: freshPayment.projectId,
        projectTitle: freshPayment.project.title,
        paymentId: freshPayment.id,
        paymentReference: freshPayment.reference,
        paymentType: freshPayment.type,
        amount: freshPayment.amount,
        currency: "NGN",
      });
    }
    await tx.projectPayment.update({
      where: { id: freshPayment.id },
      data: paymentUpdateData,
    });

    await updateLinkedAutomationRecords(tx, input, "CONFIRMED");

    await recordExternalProjectPaymentLedgerSettlement(tx, {
      userId: freshPayment.project.clientId,
      projectId: freshPayment.projectId,
      projectTitle: freshPayment.project.title,
      paymentId: freshPayment.id,
      paymentReference: freshPayment.reference,
      paymentType: freshPayment.type,
      provider: input.provider,
      source: input.source,
      transactionId: input.transactionId ?? null,
      amount: freshPayment.amount,
      currency: "NGN",
      gatewayReference: input.gatewayReference ?? null,
      providerReference: input.providerReference ?? null,
    });

    await tx.project.update({
      where: { id: freshPayment.projectId },
      data: { status: nextProjectStatus },
    });

    const phases = freshPayment.project.phases;

    if (freshPayment.type === "DEPOSIT") {
      const firstPhase = phases[0];

      if (firstPhase && firstPhase.status === "LOCKED") {
        await tx.projectPhase.update({
          where: { id: firstPhase.id },
          data: { status: "IN_PROGRESS" },
        });
      }
    }

    if (freshPayment.type === "BALANCE") {
      const finalPhase = phases[phases.length - 1];

      if (finalPhase && finalPhase.status === "LOCKED") {
        await tx.projectPhase.update({
          where: { id: finalPhase.id },
          data: { status: "IN_PROGRESS" },
        });
      }
    }

    await tx.notification.create({
      data: {
        userId: freshPayment.project.clientId,
        title: "Payment confirmed",
        body: `Your ${freshPayment.type.toLowerCase()} payment for ${freshPayment.project.title} has been confirmed.`,
        href: `/client/payments/${freshPayment.id}`,
      },
    });

    if (input.source !== PAYMENT_CONFIRMATION_SOURCES.ADMIN_MANUAL) {
      const providerLabel = safeProviderLabel(input.provider, input.providerDisplayName);

      await tx.notification.create({
        data: {
          role: "SUPER_ADMIN",
          title: "Online payment confirmed",
          body: `${freshPayment.project.title} — ${freshPayment.type} payment was confirmed through ${providerLabel}.`,
          href: `/admin/payments/${freshPayment.id}`,
        },
      });
    }

    return {
      status: "CONFIRMED",
      paymentId: freshPayment.id,
      projectId: freshPayment.projectId,
      projectStatus: nextProjectStatus,
      paymentType: freshPayment.type,
    };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}