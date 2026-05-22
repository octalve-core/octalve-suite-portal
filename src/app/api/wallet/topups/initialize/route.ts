import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";
import {
  PAYMENT_PROVIDERS,
  WALLET_TOPUP_STATUSES,
} from "@/lib/payment-constants";

type PaystackInitializeResponse = {
  status: boolean;
  message?: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  };
};

type FlutterwaveInitializeResponse = {
  status?: string;
  message?: string;
  data?: {
    link?: string;
  };
};

const PAYSTACK_INITIALIZE_URL = "https://api.paystack.co/transaction/initialize";
const FLUTTERWAVE_INITIALIZE_URL = "https://api.flutterwave.com/v3/payments";

const MIN_TOP_UP_AMOUNT = 1000;
const MAX_TOP_UP_AMOUNT = 5000000;

function normalizeProvider(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function normalizeAmount(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return 0;

  return Math.round(amount);
}

function makeTopUpReference(provider: string) {
  return `WALLET-${provider}-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function makeIdempotencyKey(userId: string, provider: string) {
  return `${userId}:WALLET_TOPUP:${provider}:${randomBytes(12).toString("hex")}`;
}

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = Response.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function getCallbackBaseUrl(request: Request) {
  const configured =
    process.env.PAYMENT_CALLBACK_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) return configured.replace(/\/+$/, "");

  return new URL(request.url).origin;
}

function safeFailureReason(value: unknown) {
  const message =
    value instanceof Error ? value.message : String(value ?? "Provider request failed");

  return message.slice(0, 250);
}

async function assertGatewayReady(provider: string) {
  const gateway = await prisma.paymentGatewaySetting.findUnique({
    where: { provider },
  });

  if (!gateway?.isEnabled) {
    return "This wallet funding option is currently unavailable.";
  }

  if (provider === PAYMENT_PROVIDERS.PAYSTACK && !process.env.PAYSTACK_SECRET_KEY?.trim()) {
    return "Paystack wallet funding is temporarily unavailable.";
  }

  if (
    provider === PAYMENT_PROVIDERS.FLUTTERWAVE &&
    !process.env.FLUTTERWAVE_SECRET_KEY?.trim()
  ) {
    return "Flutterwave wallet funding is temporarily unavailable.";
  }

  return null;
}

async function createWalletTopUp(input: {
  userId: string;
  provider: string;
  amount: number;
}) {
  return prisma.walletTopUp.create({
    data: {
      userId: input.userId,
      provider: input.provider,
      status: WALLET_TOPUP_STATUSES.INITIALIZED,
      amount: input.amount,
      currency: "NGN",
      reference: makeTopUpReference(input.provider),
      idempotencyKey: makeIdempotencyKey(input.userId, input.provider),
      initiatedById: input.userId,
    },
  });
}

async function initializePaystackTopUp(input: {
  request: Request;
  user: { id: string; email: string; name?: string | null };
  amount: number;
}) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();

  if (!secretKey) {
    return errorResponse("Paystack wallet funding is temporarily unavailable.", 503);
  }

  const topUp = await createWalletTopUp({
    userId: input.user.id,
    provider: PAYMENT_PROVIDERS.PAYSTACK,
    amount: input.amount,
  });

  const callbackUrl = `${getCallbackBaseUrl(input.request)}/client/wallet/callback/paystack?topUpId=${encodeURIComponent(topUp.id)}`;

  try {
    const response = await fetch(PAYSTACK_INITIALIZE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        email: input.user.email,
        amount: input.amount * 100,
        currency: "NGN",
        reference: topUp.reference,
        callback_url: callbackUrl,
        metadata: {
          topUpId: topUp.id,
          source: "OCTALVE_SUITE_WALLET",
        },
      }),
    });

    const payload = (await response.json().catch(() => null)) as PaystackInitializeResponse | null;

    if (
      !response.ok ||
      !payload?.status ||
      !payload.data?.authorization_url ||
      !payload.data?.reference
    ) {
      const failureReason =
        payload?.message || `Paystack initialize failed with status ${response.status}`;

      await prisma.walletTopUp.update({
        where: { id: topUp.id },
        data: {
          status: WALLET_TOPUP_STATUSES.FAILED,
          failedAt: new Date(),
          failureReason: failureReason.slice(0, 250),
        },
      });

      return errorResponse("Unable to start Paystack wallet funding. Please try again.", 502);
    }

    const updated = await prisma.walletTopUp.update({
      where: { id: topUp.id },
      data: {
        status: WALLET_TOPUP_STATUSES.PENDING,
        providerReference: payload.data.reference,
        providerStatus: "authorization_url_created",
        authorizationUrl: payload.data.authorization_url,
      },
    });

    return noStoreJson({
      provider: PAYMENT_PROVIDERS.PAYSTACK,
      topUpId: updated.id,
      topUpReference: updated.reference,
      transactionReference: updated.reference,
      authorizationUrl: updated.authorizationUrl,
      status: "PAYSTACK_WALLET_AUTHORIZATION_READY",
      message: "Paystack wallet funding checkout is ready.",
    });
  } catch (error) {
    await prisma.walletTopUp.update({
      where: { id: topUp.id },
      data: {
        status: WALLET_TOPUP_STATUSES.FAILED,
        failedAt: new Date(),
        failureReason: safeFailureReason(error),
      },
    });

    return errorResponse("Unable to start Paystack wallet funding. Please try again.", 502);
  }
}

async function initializeFlutterwaveTopUp(input: {
  request: Request;
  user: { id: string; email: string; name?: string | null };
  amount: number;
}) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY?.trim();

  if (!secretKey) {
    return errorResponse("Flutterwave wallet funding is temporarily unavailable.", 503);
  }

  const topUp = await createWalletTopUp({
    userId: input.user.id,
    provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
    amount: input.amount,
  });

  const redirectUrl = `${getCallbackBaseUrl(input.request)}/client/wallet/callback/flutterwave?topUpId=${encodeURIComponent(topUp.id)}`;

  try {
    const response = await fetch(FLUTTERWAVE_INITIALIZE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        tx_ref: topUp.reference,
        amount: String(input.amount),
        currency: "NGN",
        redirect_url: redirectUrl,
        customer: {
          email: input.user.email,
          name: input.user.name || input.user.email,
        },
        meta: {
          topUpId: topUp.id,
          source: "OCTALVE_SUITE_WALLET",
        },
        customizations: {
          title: "Octalve Wallet",
          description: "Wallet funding for Octalve Suite",
        },
        configurations: {
          session_duration: 30,
          max_retry_attempt: 3,
        },
      }),
    });

    const payload = (await response.json().catch(() => null)) as FlutterwaveInitializeResponse | null;

    if (
      !response.ok ||
      payload?.status !== "success" ||
      !payload.data?.link
    ) {
      const failureReason =
        payload?.message || `Flutterwave initialize failed with status ${response.status}`;

      await prisma.walletTopUp.update({
        where: { id: topUp.id },
        data: {
          status: WALLET_TOPUP_STATUSES.FAILED,
          failedAt: new Date(),
          failureReason: failureReason.slice(0, 250),
        },
      });

      return errorResponse("Unable to start Flutterwave wallet funding. Please try again.", 502);
    }

    const updated = await prisma.walletTopUp.update({
      where: { id: topUp.id },
      data: {
        status: WALLET_TOPUP_STATUSES.PENDING,
        providerReference: topUp.reference,
        providerStatus: "hosted_link_created",
        authorizationUrl: payload.data.link,
      },
    });

    return noStoreJson({
      provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
      topUpId: updated.id,
      topUpReference: updated.reference,
      transactionReference: updated.reference,
      authorizationUrl: updated.authorizationUrl,
      status: "FLUTTERWAVE_WALLET_LINK_READY",
      message: "Flutterwave wallet funding checkout is ready.",
    });
  } catch (error) {
    await prisma.walletTopUp.update({
      where: { id: topUp.id },
      data: {
        status: WALLET_TOPUP_STATUSES.FAILED,
        failedAt: new Date(),
        failureReason: safeFailureReason(error),
      },
    });

    return errorResponse("Unable to start Flutterwave wallet funding. Please try again.", 502);
  }
}

export async function POST(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  if (result.role !== "CLIENT") {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json().catch(() => ({}));
  const provider = normalizeProvider(body.provider);
  const amount = normalizeAmount(body.amount);

  if (amount < MIN_TOP_UP_AMOUNT) {
    return errorResponse("Minimum wallet funding amount is ₦1,000.", 400);
  }

  if (amount > MAX_TOP_UP_AMOUNT) {
    return errorResponse("Maximum wallet funding amount is ₦5,000,000.", 400);
  }

  if (provider !== PAYMENT_PROVIDERS.PAYSTACK && provider !== PAYMENT_PROVIDERS.FLUTTERWAVE) {
    return errorResponse("Unsupported wallet funding provider", 400);
  }

  const gatewayError = await assertGatewayReady(provider);

  if (gatewayError) {
    return errorResponse(gatewayError, 400);
  }

  const user = {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
  };

  if (provider === PAYMENT_PROVIDERS.PAYSTACK) {
    return initializePaystackTopUp({ request, user, amount });
  }

  return initializeFlutterwaveTopUp({ request, user, amount });
}