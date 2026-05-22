import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";
import {
  PAYMENT_CONFIRMATION_SOURCES,
  PAYMENT_PROVIDERS,
  WALLET_TOPUP_STATUSES,
} from "@/lib/payment-constants";
import { confirmWalletTopUp } from "@/lib/wallet-topup-confirmation";
import type { Prisma } from "@prisma/client";

type FlutterwaveVerifyResponse = {
  status?: string;
  message?: string;
  data?: {
    id?: number | string;
    tx_ref?: string;
    flw_ref?: string;
    status?: string;
    amount?: number;
    currency?: string;
    charged_amount?: number;
    payment_type?: string;
  };
};

const FLUTTERWAVE_VERIFY_BY_ID_URL = "https://api.flutterwave.com/v3/transactions";
const FLUTTERWAVE_VERIFY_BY_REFERENCE_URL =
  "https://api.flutterwave.com/v3/transactions/verify_by_reference";

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = Response.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function cleanText(value: unknown, max = 180) {
  return String(value ?? "").trim().slice(0, max);
}

async function verifyWithFlutterwave(input: {
  txRef?: string;
  transactionId?: string;
}): Promise<FlutterwaveVerifyResponse> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("Flutterwave verification is temporarily unavailable");
  }

  const transactionId = cleanText(input.transactionId, 80);
  const txRef = cleanText(input.txRef, 160);

  const url = transactionId
    ? `${FLUTTERWAVE_VERIFY_BY_ID_URL}/${encodeURIComponent(transactionId)}/verify`
    : `${FLUTTERWAVE_VERIFY_BY_REFERENCE_URL}?tx_ref=${encodeURIComponent(txRef)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Cache-Control": "no-cache",
    },
  });

  const payload = (await response.json().catch(() => null)) as FlutterwaveVerifyResponse | null;

  if (!response.ok || !payload) {
    throw new Error(`Flutterwave verification failed with status ${response.status}`);
  }

  return payload;
}

function buildTopUpWhere(input: {
  txRef: string;
  transactionId: string;
  topUpId: string;
}): Prisma.WalletTopUpWhereInput {
  const clauses: Prisma.WalletTopUpWhereInput[] = [];

  if (input.txRef) {
    clauses.push({ reference: input.txRef });
  }

  if (input.transactionId) {
    clauses.push({ providerReference: input.transactionId });
  }

  if (input.topUpId) {
    clauses.push({ id: input.topUpId });
  }

  return {
    provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
    OR: clauses.length ? clauses : [{ id: "__missing_flutterwave_wallet_topup__" }],
  };
}

export async function POST(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const body = await request.json().catch(() => ({}));
  const txRef = cleanText(body.txRef, 160);
  const transactionId = cleanText(body.transactionId, 80);
  const topUpId = cleanText(body.topUpId, 160);

  if (!txRef && !transactionId && !topUpId) {
    return errorResponse("Flutterwave wallet funding reference is required", 400);
  }

  const topUp = await prisma.walletTopUp.findFirst({
    where: buildTopUpWhere({ txRef, transactionId, topUpId }),
    orderBy: { createdAt: "desc" },
  });

  if (!topUp || topUp.provider !== PAYMENT_PROVIDERS.FLUTTERWAVE) {
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
      provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
      topUpId: topUp.id,
      topUpReference: topUp.reference,
      status: "ALREADY_CONFIRMED",
      message: "This wallet funding has already been confirmed.",
    });
  }

  let flutterwavePayload: FlutterwaveVerifyResponse;

  try {
    flutterwavePayload = await verifyWithFlutterwave({
      txRef: topUp.reference,
      transactionId,
    });
  } catch (error) {
    await prisma.walletTopUp.update({
      where: { id: topUp.id },
      data: {
        status: WALLET_TOPUP_STATUSES.FAILED,
        failedAt: new Date(),
        failureReason:
          error instanceof Error
            ? error.message.slice(0, 250)
            : "Flutterwave wallet funding verification failed",
      },
    });

    return errorResponse("Unable to confirm Flutterwave wallet funding. Please try again or contact support.", 502);
  }

  const data = flutterwavePayload.data;
  const providerStatus = cleanText(data?.status ?? "unknown", 80);

  const paidAmount = Number(data?.amount ?? data?.charged_amount ?? 0);
  const amountMatches = Number.isFinite(paidAmount) && paidAmount >= topUp.amount;
  const currencyMatches = cleanText(data?.currency, 12).toUpperCase() === topUp.currency;
  const referenceMatches = data?.tx_ref === topUp.reference;
  const successful = flutterwavePayload.status === "success" && providerStatus === "successful";

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
        provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
        topUpId: topUp.id,
        topUpReference: topUp.reference,
        status: "FAILED",
        message: "Flutterwave wallet funding could not be confirmed. If you were debited, contact support with your reference.",
      },
      { status: 400 },
    );
  }

  const resultPayload = await confirmWalletTopUp({
    topUpId: topUp.id,
    provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
    source: PAYMENT_CONFIRMATION_SOURCES.SERVER_VERIFY,
    gatewayReference: topUp.reference,
    providerReference: data?.id ? String(data.id) : data?.flw_ref ?? data?.tx_ref ?? null,
    providerStatus,
  });

  return noStoreJson({
    provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
    topUpId: topUp.id,
    topUpReference: topUp.reference,
    status: resultPayload.status,
    message:
      resultPayload.status === "ALREADY_CONFIRMED"
        ? "This wallet funding has already been confirmed."
        : "Wallet funding verified and confirmed successfully.",
  });
}