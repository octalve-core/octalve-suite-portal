import { prisma } from "@/lib/prisma";
import {
  PAYMENT_CONFIRMATION_SOURCES,
  PAYMENT_PROVIDERS,
  WALLET_TOPUP_STATUSES,
} from "@/lib/payment-constants";
import { recordWalletTopUpCredit } from "@/lib/wallet-ledger";
import { notifyWorkspace } from "@/lib/notification-service";

export type ConfirmWalletTopUpInput = {
  topUpId: string;
  provider: string;
  source: string;
  providerStatus?: string | null;
  providerReference?: string | null;
  gatewayReference?: string | null;
};

export type ConfirmWalletTopUpResult = {
  status: "CONFIRMED" | "ALREADY_CONFIRMED";
  topUpId: string;
  userId: string;
  walletStatus: string;
};

function safeProviderLabel(provider: string) {
  if (provider === PAYMENT_PROVIDERS.PAYSTACK) return "Paystack";
  if (provider === PAYMENT_PROVIDERS.FLUTTERWAVE) return "Flutterwave";
  if (provider === PAYMENT_PROVIDERS.WALLET) return "Octalve Wallet";

  return provider.replaceAll("_", " ").toLowerCase();
}

export async function confirmWalletTopUp(
  input: ConfirmWalletTopUpInput,
): Promise<ConfirmWalletTopUpResult> {
  const result: ConfirmWalletTopUpResult = await prisma.$transaction(
    async (tx): Promise<ConfirmWalletTopUpResult> => {
    const topUp = await tx.walletTopUp.findUnique({
      where: { id: input.topUpId },
      },
  );

    if (!topUp) {
      throw new Error("Wallet top-up not found");
    }

    if (topUp.status === WALLET_TOPUP_STATUSES.CONFIRMED) {
      await recordWalletTopUpCredit(tx, {
        userId: topUp.userId,
        topUpId: topUp.id,
        topUpReference: topUp.reference,
        provider: input.provider,
        source: input.source,
        amount: topUp.amount,
        currency: topUp.currency,
        gatewayReference: input.gatewayReference ?? topUp.reference,
        providerReference: input.providerReference ?? topUp.providerReference,
        },
  );

      return {
        status: "ALREADY_CONFIRMED",
        topUpId: topUp.id,
        userId: topUp.userId,
        walletStatus: topUp.status,
      };
    }

    if (
      topUp.status !== WALLET_TOPUP_STATUSES.INITIALIZED &&
      topUp.status !== WALLET_TOPUP_STATUSES.PENDING
    ) {
      throw new Error("Wallet top-up is not in a payable state");
    }

    const now = new Date();

    const updated = await tx.walletTopUp.update({
      where: { id: topUp.id },
      data: {
        status: WALLET_TOPUP_STATUSES.CONFIRMED,
        verifiedAt: now,
        confirmedAt: now,
        providerStatus: input.providerStatus ?? topUp.providerStatus,
        providerReference: input.providerReference ?? topUp.providerReference,
      },
      },
  );

    await recordWalletTopUpCredit(tx, {
      userId: updated.userId,
      topUpId: updated.id,
      topUpReference: updated.reference,
      provider: input.provider,
      source: input.source,
      amount: updated.amount,
      currency: updated.currency,
      gatewayReference: input.gatewayReference ?? updated.reference,
      providerReference: input.providerReference ?? updated.providerReference,
      },
  );

    await tx.notification.create({
      data: {
        userId: updated.userId,
        title: "Wallet funded",
        body: `Your wallet top-up of ₦${updated.amount.toLocaleString("en-NG")} has been confirmed via ${safeProviderLabel(input.provider)}.`,
        href: "/client/wallet",
      },
      },
  );

    if (input.source !== PAYMENT_CONFIRMATION_SOURCES.WALLET_LEDGER) {
      await tx.notification.create({
        data: {
          role: "SUPER_ADMIN",
          title: "Wallet top-up confirmed",
          body: `A client wallet top-up of ₦${updated.amount.toLocaleString("en-NG")} was confirmed via ${safeProviderLabel(input.provider)}.`,
          href: `/admin/wallet/${updated.id}`,
        },
        },
  );
    }

    return {
      status: "CONFIRMED",
      topUpId: updated.id,
      userId: updated.userId,
      walletStatus: updated.status,
    };
    },
  );

  if (result.status === "CONFIRMED") {
    const topUp = await prisma.walletTopUp.findUnique({
      where: { id: result.topUpId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      },
  );

    if (topUp?.user?.email) {
      const amountLabel = `${topUp.currency} ${topUp.amount.toLocaleString("en-NG")}`;

      await notifyWorkspace({
        userId: topUp.userId,
        eventKey: "WALLET_TOPUP_CONFIRMED",
        skipInApp: true,
        title: "Wallet funded",
        body: `Your wallet top-up of ${amountLabel} has been confirmed via ${safeProviderLabel(input.provider)}.`,
        href: "/client/wallet",
        email: {
          to: topUp.user.email,
          eventKey: "WALLET_TOPUP_CONFIRMED",
          variables: {
            clientName: topUp.user.name ?? "Client",
            amount: amountLabel,
          },
        },
        },
  );
    }
  }

  return result;
}