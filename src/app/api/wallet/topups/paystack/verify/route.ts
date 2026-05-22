import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";
import {
  PAYMENT_CONFIRMATION_SOURCES,
  PAYMENT_PROVIDERS,
  WALLET_TOPUP_STATUSES,
} from "@/lib/payment-constants";
import { confirmWalletTopUp } from "@/lib/wallet-topup-confirmation";

type PaystackVerifyResponse = {
  status: boolean;
  message?: string;
  data?: {
    id?: number;
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    channel?: string;
  };
};

const PAYSTACK_VERIFY_BASE_URL = "https://api.paystack.co/transaction/verify";

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = Response.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function cleanReference(value: unknown) {
  return String(value ?? "").trim().slice(0, 160);
}

async function verifyWithPaystack(reference: string): Promise<PaystackVerifyResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("Paystack verification is temporarily unavailable");
  }

  const response = await fetch(`${PAYSTACK_VERIFY_BASE_URL}/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Cache-Control": "no-cache",
    },
  });

  const payload = (await response.json().catch(() => null)) as PaystackVerifyResponse | null;

  if (!response.ok || !payload) {
    throw new Error(`Paystack verification failed with status ${response.status}`);
  }

  return payload;
}

export async function POST(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const body = await request.json().catch(() => ({}));
  const reference = cleanReference(body.reference);
  const topUpId = cleanReference(body.topUpId);

  if (!reference) {
    return errorResponse("Wallet funding reference is required", 400);
  }

  const topUp = await prisma.walletTopUp.findUnique({
    where: { reference },
  });

  if (!topUp || topUp.provider !== PAYMENT_PROVIDERS.PAYSTACK) {
    return errorResponse("Wallet funding record not found", 404);
  }

  if (topUpId && topUp.id !== topUpId) {
    return errorResponse("Wallet funding reference mismatch", 400);
  }

  const isOwner = topUp.userId === result.user.id;
  const isAdmin = result.role === "SUPER_ADMIN";

  if (!isOwner && !isAdmin) {
    return errorResponse("Forbidden", 403);
  }

  if (topUp.status === WALLET_TOPUP_STATUSES.CONFIRMED) {
    return noStoreJson({
      provider: PAYMENT_PROVIDERS.PAYSTACK,
      topUpId: topUp.id,
      topUpReference: topUp.reference,
      status: "ALREADY_CONFIRMED",
      message: "This wallet funding has already been confirmed.",
    });
  }

  let paystackPayload: PaystackVerifyResponse;

  try {
    paystackPayload = await verifyWithPaystack(reference);
  } catch (error) {
    await prisma.walletTopUp.update({
      where: { id: topUp.id },
      data: {
        status: WALLET_TOPUP_STATUSES.FAILED,
        failedAt: new Date(),
        failureReason:
          error instanceof Error
            ? error.message.slice(0, 250)
            : "Paystack wallet funding verification failed",
      },
    });

    return errorResponse("Unable to confirm Paystack wallet funding. Please try again or contact support.", 502);
  }

  const data = paystackPayload.data;
  const providerStatus = data?.status ?? "unknown";

  const amountMatches = Number(data?.amount) === topUp.amount * 100;
  const currencyMatches = String(data?.currency ?? "").toUpperCase() === topUp.currency;
  const referenceMatches = data?.reference === topUp.reference;
  const successful = paystackPayload.status === true && providerStatus === "success";

  if (!successful || !amountMatches || !currencyMatches || !referenceMatches) {
    const reason = [
      !successful ? `Provider status: ${providerStatus}` : "",
      !amountMatches ? "Amount mismatch" : "",
      !currencyMatches ? "Currency mismatch" : "",
      !referenceMatches ? "Reference mismatch" : "",
    ].filter(Boolean).join("; ");

    await prisma.walletTopUp.update({
      where: { id: topUp.id },
      data: {
        status: WALLET_TOPUP_STATUSES.FAILED,
        providerStatus,
        failedAt: new Date(),
        failureReason: reason.slice(0, 250),
      },
    });

    return noStoreJson(
      {
        provider: PAYMENT_PROVIDERS.PAYSTACK,
        topUpId: topUp.id,
        topUpReference: topUp.reference,
        status: "FAILED",
        message: "Paystack wallet funding could not be confirmed. If you were debited, contact support with your reference.",
      },
      { status: 400 },
    );
  }

  const resultPayload = await confirmWalletTopUp({
    topUpId: topUp.id,
    provider: PAYMENT_PROVIDERS.PAYSTACK,
    source: PAYMENT_CONFIRMATION_SOURCES.SERVER_VERIFY,
    gatewayReference: topUp.reference,
    providerReference: data?.id ? String(data.id) : data?.reference ?? null,
    providerStatus,
  });

  return noStoreJson({
    provider: PAYMENT_PROVIDERS.PAYSTACK,
    topUpId: topUp.id,
    topUpReference: topUp.reference,
    status: resultPayload.status,
    message:
      resultPayload.status === "ALREADY_CONFIRMED"
        ? "This wallet funding has already been confirmed."
        : "Wallet funding verified and confirmed successfully.",
  });
}