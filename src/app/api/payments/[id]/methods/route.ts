import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";
import { PAYMENT_PROVIDERS } from "@/lib/payment-constants";

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
    provider: PAYMENT_PROVIDERS.PAYPAL,
    displayName: "PayPal",
    sortOrder: 40,
    automated: false,
    requiresEnv: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"],
  },
  {
    provider: PAYMENT_PROVIDERS.WALLET,
    displayName: "Octalve Wallet",
    sortOrder: 50,
    automated: false,
    requiresEnv: [],
  },
];

function envReady(names: string[]) {
  return names.every((name) => Boolean(process.env[name]?.trim()));
}

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
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

  const stored = await prisma.paymentGatewaySetting.findMany();
  const storedByProvider = new Map(stored.map((gateway) => [gateway.provider, gateway]));

  const methods = DEFAULT_METHODS.map((defaults) => {
    const setting = storedByProvider.get(defaults.provider);
    const isEnabled =
      defaults.provider === PAYMENT_PROVIDERS.MANUAL_BANK
        ? setting?.isEnabled ?? true
        : setting?.isEnabled ?? false;

    const hasEnv = envReady(defaults.requiresEnv);
    const isReady = isEnabled && hasEnv && defaults.automated;

    let unavailableReason: string | undefined;

    if (!isEnabled) {
      unavailableReason = "Disabled by admin";
    } else if (!hasEnv) {
      unavailableReason = "Provider server key is not configured";
    } else if (!defaults.automated) {
      unavailableReason = "Gateway automation will be activated in a provider-specific batch";
    }

    return {
      provider: defaults.provider,
      displayName: setting?.displayName ?? defaults.displayName,
      isEnabled,
      isReady,
      isAutomated: defaults.automated,
      sortOrder: setting?.sortOrder ?? defaults.sortOrder,
      unavailableReason,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);

  return noStoreJson(methods);
}