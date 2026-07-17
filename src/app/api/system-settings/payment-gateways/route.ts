import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, requireRoles, errorResponse } from "@/lib/api-helpers";
import { PAYMENT_GATEWAY_MODES, PAYMENT_PROVIDERS } from "@/lib/payment-constants";

type GatewayDefault = {
  provider: string;
  displayName: string;
  isEnabled: boolean;
  mode: string;
  sortOrder: number;
  publicKeyEnvName?: string;
  secretKeyEnvName?: string;
  webhookSecretEnvName?: string;
  callbackPath?: string;
  webhookPath?: string;
  notes?: string;
};

const DEFAULT_GATEWAYS: GatewayDefault[] = [
  {
    provider: PAYMENT_PROVIDERS.MANUAL_BANK,
    displayName: "Manual Bank Transfer",
    isEnabled: true,
    mode: PAYMENT_GATEWAY_MODES.LIVE,
    sortOrder: 10,
    callbackPath: null as unknown as string,
    webhookPath: null as unknown as string,
    notes: "Manual bank transfer is confirmed by finance/admin review.",
  },
  {
    provider: PAYMENT_PROVIDERS.PAYSTACK,
    displayName: "Paystack",
    isEnabled: false,
    mode: PAYMENT_GATEWAY_MODES.LIVE,
    sortOrder: 20,
    publicKeyEnvName: "PAYSTACK_PUBLIC_KEY",
    secretKeyEnvName: "PAYSTACK_SECRET_KEY",
    webhookSecretEnvName: "PAYSTACK_WEBHOOK_SECRET",
    callbackPath: "/client/payments/callback/paystack",
    webhookPath: "/api/webhooks/paystack",
    notes: "Credential values are stored only in server environment variables.",
  },
  {
    provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
    displayName: "Flutterwave",
    isEnabled: false,
    mode: PAYMENT_GATEWAY_MODES.LIVE,
    sortOrder: 30,
    publicKeyEnvName: "FLUTTERWAVE_PUBLIC_KEY",
    secretKeyEnvName: "FLUTTERWAVE_SECRET_KEY",
    webhookSecretEnvName: "FLUTTERWAVE_WEBHOOK_SECRET",
    callbackPath: "/client/payments/callback/flutterwave",
    webhookPath: "/api/webhooks/flutterwave",
    notes: "Credential values are stored only in server environment variables.",
  },
  {
    provider: PAYMENT_PROVIDERS.PAYPAL,
    displayName: "PayPal",
    isEnabled: false,
    mode: PAYMENT_GATEWAY_MODES.LIVE,
    sortOrder: 40,
    publicKeyEnvName: "PAYPAL_CLIENT_ID",
    secretKeyEnvName: "PAYPAL_CLIENT_SECRET",
    webhookSecretEnvName: "PAYPAL_WEBHOOK_ID",
    callbackPath: "/client/payments/callback/paypal",
    webhookPath: "/api/webhooks/paypal",
    notes: "Reserved for activation after provider verification is completed.",
  },
  {
    provider: PAYMENT_PROVIDERS.WALLET,
    displayName: "Octalve Wallet",
    isEnabled: false,
    mode: PAYMENT_GATEWAY_MODES.LIVE,
    sortOrder: 50,
    callbackPath: "/client/wallet",
    webhookPath: null as unknown as string,
    notes: "Enables clients to pay eligible project invoices directly from their verified Octalve Wallet balance.",
  },
];

const DEFAULT_BY_PROVIDER = new Map(DEFAULT_GATEWAYS.map((item) => [item.provider, item]));

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function envConfigured(name?: string | null) {
  return Boolean(name && process.env[name]?.trim());
}

function serializeGateway(setting: GatewayDefault & { id?: string; createdAt?: Date; updatedAt?: Date }) {
  return {
    id: setting.id ?? setting.provider,
    provider: setting.provider,
    displayName: setting.displayName,
    isEnabled: setting.isEnabled,
    mode: setting.mode,
    sortOrder: setting.sortOrder,
    callbackPath: setting.callbackPath ?? undefined,
    webhookPath: setting.webhookPath ?? undefined,
    notes: setting.notes ?? undefined,
    publicKeyConfigured: envConfigured(setting.publicKeyEnvName),
    secretKeyConfigured: envConfigured(setting.secretKeyEnvName),
    webhookSecretConfigured: envConfigured(setting.webhookSecretEnvName),
    createdAt: setting.createdAt?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: setting.updatedAt?.toISOString() ?? new Date(0).toISOString(),
  };
}

async function listGatewaySettings() {
  const stored = await prisma.paymentGatewaySetting.findMany({
    orderBy: [{ sortOrder: "asc" }, { provider: "asc" }],
  });

  const storedByProvider = new Map(stored.map((item) => [item.provider, item]));

  return DEFAULT_GATEWAYS.map((defaults) => {
    const existing = storedByProvider.get(defaults.provider);

    return serializeGateway({
      ...defaults,
      ...(existing
        ? {
            id: existing.id,
            displayName: existing.displayName,
            isEnabled: existing.isEnabled,
            mode: existing.mode,
            sortOrder: existing.sortOrder,
            publicKeyEnvName: existing.publicKeyEnvName ?? defaults.publicKeyEnvName,
            secretKeyEnvName: existing.secretKeyEnvName ?? defaults.secretKeyEnvName,
            webhookSecretEnvName: existing.webhookSecretEnvName ?? defaults.webhookSecretEnvName,
            callbackPath: existing.callbackPath ?? defaults.callbackPath,
            webhookPath: existing.webhookPath ?? defaults.webhookPath,
            notes: existing.notes ?? defaults.notes,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
          }
        : {}),
    });
  });
}

export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const gateways = await listGatewaySettings();
  return noStoreJson(gateways);
}

export async function PATCH(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));
  const provider = String(body.provider ?? "").trim().toUpperCase();
  const defaults = DEFAULT_BY_PROVIDER.get(provider);

  if (!defaults) {
    return errorResponse("Unsupported payment provider", 400);
  }

  const mode = String(body.mode ?? defaults.mode).trim().toUpperCase();

  if (mode !== PAYMENT_GATEWAY_MODES.LIVE && mode !== PAYMENT_GATEWAY_MODES.TEST) {
    return errorResponse("Gateway mode must be LIVE or TEST", 400);
  }

  const isEnabled =
    typeof body.isEnabled === "boolean" ? body.isEnabled : defaults.isEnabled;

  const notes =
    typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : defaults.notes ?? null;

  await prisma.paymentGatewaySetting.upsert({
    where: { provider },
    create: {
      provider,
      displayName: defaults.displayName,
      isEnabled,
      mode,
      sortOrder: defaults.sortOrder,
      publicKeyEnvName: defaults.publicKeyEnvName ?? null,
      secretKeyEnvName: defaults.secretKeyEnvName ?? null,
      webhookSecretEnvName: defaults.webhookSecretEnvName ?? null,
      callbackPath: defaults.callbackPath ?? null,
      webhookPath: defaults.webhookPath ?? null,
      notes,
    },
    update: {
      isEnabled,
      mode,
      notes,
      publicKeyEnvName: defaults.publicKeyEnvName ?? null,
      secretKeyEnvName: defaults.secretKeyEnvName ?? null,
      webhookSecretEnvName: defaults.webhookSecretEnvName ?? null,
      callbackPath: defaults.callbackPath ?? null,
      webhookPath: defaults.webhookPath ?? null,
    },
  });

  const gateways = await listGatewaySettings();
  return noStoreJson(gateways);
}