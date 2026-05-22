import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";
import {
  PAYMENT_PROVIDERS,
  WALLET_LEDGER_DIRECTIONS,
} from "@/lib/payment-constants";

type Params = { params: Promise<{ id: string }> };

type MethodDefault = {
  provider: string;
  displayName: string;
  sortOrder: number;
  automated: boolean;
  requiresEnv: string[];
};

const DEFAULT_METHODS: MethodDefault[] = [
  {
    provider: PAYMENT_PROVIDERS.MANUAL_BANK,
    displayName: "Manual Bank Transfer",
    sortOrder: 10,
    automated: true,
    requiresEnv: [],
  },
  {
    provider: PAYMENT_PROVIDERS.PAYSTACK,
    displayName: "Paystack",
    sortOrder: 20,
    automated: true,
    requiresEnv: ["PAYSTACK_SECRET_KEY"],
  },
  {
    provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
    displayName: "Flutterwave",
    sortOrder: 30,
    automated: true,
    requiresEnv: ["FLUTTERWAVE_SECRET_KEY"],
  },
  {
    provider: PAYMENT_PROVIDERS.WALLET,
    displayName: "Octalve Wallet",
    sortOrder: 40,
    automated: true,
    requiresEnv: [],
  },
  {
    provider: PAYMENT_PROVIDERS.PAYPAL,
    displayName: "PayPal",
    sortOrder: 50,
    automated: false,
    requiresEnv: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"],
  },
];

function envReady(names: string[]) {
  return names.every((name) => Boolean(process.env[name]?.trim()));
}

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

async function getWalletBalance(userId: string) {
  const [totalIn, totalOut] = await Promise.all([
    prisma.walletLedgerEntry.aggregate({
      where: { userId, direction: WALLET_LEDGER_DIRECTIONS.IN },
      _sum: { amount: true },
    }),
    prisma.walletLedgerEntry.aggregate({
      where: { userId, direction: WALLET_LEDGER_DIRECTIONS.OUT },
      _sum: { amount: true },
    }),
  ]);

  return Number(totalIn._sum.amount ?? 0) - Number(totalOut._sum.amount ?? 0);
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const payment = await prisma.projectPayment.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!payment) return errorResponse("Payment not found", 404);

  const isOwner = payment.project.clientId === result.user.id;
  const isAdmin = result.role === "SUPER_ADMIN";

  if (!isOwner && !isAdmin) {
    return errorResponse("Forbidden", 403);
  }

  const walletBalance = isOwner ? await getWalletBalance(result.user.id) : 0;
  const stored = await prisma.paymentGatewaySetting.findMany();
  const storedByProvider = new Map(stored.map((gateway) => [gateway.provider, gateway]));

  const methods = DEFAULT_METHODS.map((defaults) => {
    const setting = storedByProvider.get(defaults.provider);

    const isEnabled =
      defaults.provider === PAYMENT_PROVIDERS.MANUAL_BANK
        ? setting?.isEnabled ?? true
        : defaults.provider === PAYMENT_PROVIDERS.WALLET
          ? setting?.isEnabled ?? true
          : setting?.isEnabled ?? false;

    const hasEnv = envReady(defaults.requiresEnv);
    let isReady = isEnabled && hasEnv && defaults.automated;
    let unavailableReason: string | undefined;

    if (defaults.provider === PAYMENT_PROVIDERS.WALLET) {
      const hasEnoughBalance = walletBalance >= payment.amount;

      isReady =
        isOwner &&
        payment.status === "UNPAID" &&
        isEnabled &&
        hasEnoughBalance;

      if (!isOwner) {
        unavailableReason = "Wallet payment is available to the project client only.";
      } else if (!isEnabled) {
        unavailableReason = "Octalve Wallet is currently unavailable.";
      } else if (!hasEnoughBalance) {
        unavailableReason = `Insufficient wallet balance. Available: ${formatNaira(walletBalance)}.`;
      }
    } else if (!isEnabled) {
      unavailableReason = "This payment option is currently unavailable.";
    } else if (!hasEnv) {
      unavailableReason = "This payment option is temporarily unavailable.";
    } else if (!defaults.automated) {
      unavailableReason = "This payment option is currently unavailable for online checkout.";
    }

    return {
      provider: defaults.provider,
      displayName: setting?.displayName ?? defaults.displayName,
      isEnabled,
      isReady,
      isAutomated: defaults.automated,
      sortOrder: setting?.sortOrder ?? defaults.sortOrder,
      unavailableReason,
      walletBalance:
        defaults.provider === PAYMENT_PROVIDERS.WALLET ? walletBalance : undefined,
      requiredAmount:
        defaults.provider === PAYMENT_PROVIDERS.WALLET ? payment.amount : undefined,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);

  return noStoreJson(methods);
}