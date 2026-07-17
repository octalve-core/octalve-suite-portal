import { createHash, createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  PAYMENT_CONFIRMATION_SOURCES,
  PAYMENT_PROVIDERS,
  PAYMENT_TRANSACTION_STATUSES,
  WALLET_TOPUP_STATUSES,
  WEBHOOK_PROCESSING_STATUSES,
} from "@/lib/payment-constants";
import { confirmProjectPayment } from "@/lib/payment-confirmation";
import { confirmWalletTopUp } from "@/lib/wallet-topup-confirmation";

type PaystackWebhookPayload = {
  event?: string;
  data?: {
    id?: number | string;
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    gateway_response?: string;
    channel?: string;
    paid_at?: string | null;
    authorization?: {
      channel?: string;
      card_type?: string;
      bank?: string;
      last4?: string;
      exp_month?: string;
      exp_year?: string;
    };
    metadata?: {
      paymentId?: string;
      projectId?: string;
      projectCode?: string;
      paymentType?: string;
      source?: string;
    };
  };
};

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

function hashPayload(rawBody: string) {
  return createHash("sha256").update(rawBody).digest("hex");
}

function getWebhookSigningSecret() {
  return (
    process.env.PAYSTACK_WEBHOOK_SECRET?.trim() ||
    process.env.PAYSTACK_SECRET_KEY?.trim() ||
    ""
  );
}

function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const secret = getWebhookSigningSecret();

  if (!secret || !signature) return false;

  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");

  try {
    const expectedBuffer = Buffer.from(expected, "hex");
    const signatureBuffer = Buffer.from(signature, "hex");

    if (expectedBuffer.length !== signatureBuffer.length) return false;

    return timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch {
    return false;
  }
}

function providerReferenceFromPaystack(data: PaystackWebhookPayload["data"]) {
  if (!data?.id) return data?.reference ?? null;
  return String(data.id);
}

function paidViaFromPaystack(data: PaystackWebhookPayload["data"]) {
  const channel = data?.channel ?? data?.authorization?.channel;
  const cardType = data?.authorization?.card_type;
  const bank = data?.authorization?.bank;
  const last4 = data?.authorization?.last4;

  return [channel, cardType, bank, last4 ? `****${last4}` : ""]
    .filter(Boolean)
    .join(" / ")
    .slice(0, 120) || null;
}

function makeEventIdentity(input: {
  eventType: string;
  eventId: string;
  reference: string;
  payloadHash: string;
}) {
  const safeEventId =
    input.eventId ||
    `${input.eventType}:${input.reference || input.payloadHash.slice(0, 24)}`;

  return {
    eventId: safeEventId,
    idempotencyKey: `${PAYMENT_PROVIDERS.PAYSTACK}:${safeEventId}`,
  };
}

async function markWebhookEvent(input: {
  id: string;
  status: string;
  processingError?: string | null;
  processedAt?: Date | null;
}) {
  await prisma.paymentWebhookEvent.update({
    where: { id: input.id },
    data: {
      status: input.status,
      processingError: input.processingError ?? null,
      processedAt: input.processedAt ?? null,
    },
  });
}

async function processWalletTopUpCharge(input: {
  webhookEventId: string;
  reference: string;
  data: NonNullable<PaystackWebhookPayload["data"]>;
}) {
  const topUp = await prisma.walletTopUp.findUnique({
    where: { reference: input.reference },
  });

  if (!topUp || topUp.provider !== PAYMENT_PROVIDERS.PAYSTACK) {
    await markWebhookEvent({
      id: input.webhookEventId,
      status: WEBHOOK_PROCESSING_STATUSES.FAILED,
      processedAt: new Date(),
      processingError: "Matching Paystack payment or wallet funding record not found",
    });

    return noStoreJson({ received: true, processed: false, reason: "record_not_found" });
  }

  const providerStatus = cleanText(input.data.status || "unknown", 80);
  const amountMatches = Number(input.data.amount) === topUp.amount * 100;
  const currencyMatches =
    cleanText(input.data.currency, 12).toUpperCase() === topUp.currency;
  const referenceMatches = input.data.reference === topUp.reference;
  const successful = providerStatus === "success";

  if (!successful || !amountMatches || !currencyMatches || !referenceMatches) {
    const reason = [
      !successful ? `Provider status: ${providerStatus}` : "",
      !amountMatches ? "Amount mismatch" : "",
      !currencyMatches ? "Currency mismatch" : "",
      !referenceMatches ? "Reference mismatch" : "",
    ]
      .filter(Boolean)
      .join("; ")
      .slice(0, 250);

    await prisma.$transaction(async (tx) => {
      await tx.walletTopUp.update({
        where: { id: topUp.id },
        data: {
          status: WALLET_TOPUP_STATUSES.FAILED,
          providerStatus,
          failedAt: new Date(),
          failureReason: reason,
        },
      });

      await tx.paymentWebhookEvent.update({
        where: { id: input.webhookEventId },
        data: {
          status: WEBHOOK_PROCESSING_STATUSES.FAILED,
          processedAt: new Date(),
          processingError: reason,
        },
      });
    });

    return noStoreJson({ received: true, processed: false, reason: "wallet_topup_verification_failed" });
  }

  const result = await confirmWalletTopUp({
    topUpId: topUp.id,
    provider: PAYMENT_PROVIDERS.PAYSTACK,
    source: PAYMENT_CONFIRMATION_SOURCES.WEBHOOK,
    gatewayReference: topUp.reference,
    providerReference: input.data.id ? String(input.data.id) : input.data.reference ?? null,
    providerStatus,
  });

  await markWebhookEvent({
    id: input.webhookEventId,
    status: WEBHOOK_PROCESSING_STATUSES.PROCESSED,
    processedAt: new Date(),
    processingError: null,
  });

  return noStoreJson({
    received: true,
    processed: result.status === "CONFIRMED",
    duplicate: result.status === "ALREADY_CONFIRMED",
    status: result.status,
    recordType: "WALLET_TOPUP",
  });
}

async function processChargeSuccess(input: {
  webhookEventId: string;
  reference: string;
  data: NonNullable<PaystackWebhookPayload["data"]>;
}) {
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { reference: input.reference },
    include: {
      payment: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!transaction || transaction.provider !== PAYMENT_PROVIDERS.PAYSTACK) {
    return processWalletTopUpCharge({
      webhookEventId: input.webhookEventId,
      reference: input.reference,
      data: input.data,
    });
  }

  const providerStatus = cleanText(input.data.status || "unknown", 80);
  const amountMatches = Number(input.data.amount) === transaction.amount * 100;
  const currencyMatches =
    cleanText(input.data.currency, 12).toUpperCase() === transaction.currency;
  const referenceMatches = input.data.reference === transaction.reference;
  const successful = providerStatus === "success";

  if (!successful || !amountMatches || !currencyMatches || !referenceMatches) {
    const reason = [
      !successful ? `Provider status: ${providerStatus}` : "",
      !amountMatches ? "Amount mismatch" : "",
      !currencyMatches ? "Currency mismatch" : "",
      !referenceMatches ? "Reference mismatch" : "",
    ]
      .filter(Boolean)
      .join("; ")
      .slice(0, 250);

    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          webhookEventId: input.webhookEventId,
          status: PAYMENT_TRANSACTION_STATUSES.FAILED,
          providerStatus,
          failedAt: new Date(),
          failureReason: reason,
        },
      });

      await tx.paymentWebhookEvent.update({
        where: { id: input.webhookEventId },
        data: {
          status: WEBHOOK_PROCESSING_STATUSES.FAILED,
          processedAt: new Date(),
          processingError: reason,
        },
      });
    });

    return noStoreJson({ received: true, processed: false, reason: "verification_failed" });
  }

  const result = await confirmProjectPayment({
    paymentId: transaction.paymentId,
    provider: PAYMENT_PROVIDERS.PAYSTACK,
    source: PAYMENT_CONFIRMATION_SOURCES.WEBHOOK,
    gatewayReference: transaction.reference,
    providerReference: providerReferenceFromPaystack(input.data),
    paidVia: paidViaFromPaystack(input.data),
    providerStatus,
    transactionId: transaction.id,
    webhookEventId: input.webhookEventId,
    providerDisplayName: "Paystack webhook",
  });

  return noStoreJson({
    received: true,
    processed: result.status === "CONFIRMED",
    duplicate: result.status === "ALREADY_CONFIRMED",
    status: result.status,
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  const payloadHash = hashPayload(rawBody);
  const signatureValid = verifyPaystackSignature(rawBody, signature);

  if (!signatureValid) {
    return noStoreJson({ received: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: PaystackWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as PaystackWebhookPayload;
  } catch {
    return noStoreJson({ received: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventType = cleanText(payload.event, 120);
  const reference = cleanText(payload.data?.reference, 160);
  const providerEventId = cleanText(payload.data?.id, 120);
  const identity = makeEventIdentity({
    eventType,
    eventId: providerEventId,
    reference,
    payloadHash,
  });

  const webhookEvent = await prisma.paymentWebhookEvent.upsert({
    where: { idempotencyKey: identity.idempotencyKey },
    create: {
      provider: PAYMENT_PROVIDERS.PAYSTACK,
      eventType: eventType || "unknown",
      eventId: identity.eventId,
      reference: reference || null,
      status: WEBHOOK_PROCESSING_STATUSES.RECEIVED,
      signatureValid: true,
      payloadHash,
      idempotencyKey: identity.idempotencyKey,
    },
    update: {},
  });

  if (
    webhookEvent.status === WEBHOOK_PROCESSING_STATUSES.PROCESSED ||
    webhookEvent.status === WEBHOOK_PROCESSING_STATUSES.IGNORED
  ) {
    return noStoreJson({
      received: true,
      duplicate: true,
      status: webhookEvent.status,
    });
  }

  if (eventType !== "charge.success") {
    await markWebhookEvent({
      id: webhookEvent.id,
      status: WEBHOOK_PROCESSING_STATUSES.IGNORED,
      processedAt: new Date(),
      processingError: null,
    });

    return noStoreJson({ received: true, processed: false, ignored: true });
  }

  if (!reference || !payload.data) {
    await markWebhookEvent({
      id: webhookEvent.id,
      status: WEBHOOK_PROCESSING_STATUSES.FAILED,
      processedAt: new Date(),
      processingError: "Missing reference or data",
    });

    return noStoreJson({ received: true, processed: false, reason: "missing_reference" });
  }

  try {
    return await processChargeSuccess({
      webhookEventId: webhookEvent.id,
      reference,
      data: payload.data,
    });
  } catch (error) {
    void error;
    const message = "Webhook processing failed";

    await markWebhookEvent({
      id: webhookEvent.id,
      status: WEBHOOK_PROCESSING_STATUSES.FAILED,
      processedAt: new Date(),
      processingError: message,
    });

    return noStoreJson({ received: true, processed: false, reason: "processing_failed" });
  }
}