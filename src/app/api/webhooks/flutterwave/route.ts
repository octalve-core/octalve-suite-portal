import { createHash, createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  PAYMENT_CONFIRMATION_SOURCES,
  PAYMENT_PROVIDERS,
  PAYMENT_TRANSACTION_STATUSES,
  WEBHOOK_PROCESSING_STATUSES,
} from "@/lib/payment-constants";
import { confirmProjectPayment } from "@/lib/payment-confirmation";

type FlutterwaveWebhookPayload = {
  event?: string;
  type?: string;
  data?: {
    id?: number | string;
    tx_ref?: string;
    flw_ref?: string;
    status?: string;
    amount?: number;
    charged_amount?: number;
    currency?: string;
    payment_type?: string;
    processor_response?: string;
    customer?: {
      email?: string;
      name?: string;
    };
    card?: {
      type?: string;
      last_4digits?: string;
      issuer?: string;
    };
    meta?: {
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

function getWebhookSecret() {
  return process.env.FLUTTERWAVE_WEBHOOK_SECRET?.trim() || "";
}

function safeEqualText(left: string, right: string) {
  try {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) return false;

    return timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

function verifyFlutterwaveWebhook(rawBody: string, request: Request) {
  const secret = getWebhookSecret();
  if (!secret) return false;

  const hmacSignature = request.headers.get("flutterwave-signature");
  const legacyVerifHash = request.headers.get("verif-hash");

  if (hmacSignature) {
    const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
    if (safeEqualText(expected, hmacSignature)) return true;
  }

  if (legacyVerifHash) {
    return safeEqualText(secret, legacyVerifHash);
  }

  return false;
}

function providerReferenceFromFlutterwave(data: FlutterwaveWebhookPayload["data"]) {
  if (data?.id) return String(data.id);
  return data?.flw_ref ?? data?.tx_ref ?? null;
}

function paidViaFromFlutterwave(data: FlutterwaveWebhookPayload["data"]) {
  const paymentType = data?.payment_type;
  const cardType = data?.card?.type;
  const issuer = data?.card?.issuer;
  const last4 = data?.card?.last_4digits;

  return [paymentType, cardType, issuer, last4 ? `****${last4}` : ""]
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
    idempotencyKey: `${PAYMENT_PROVIDERS.FLUTTERWAVE}:${safeEventId}`,
  };
}

function isSuccessfulFlutterwaveStatus(status: string) {
  return status === "successful" || status === "succeeded" || status === "success";
}

function isSupportedFlutterwaveEvent(eventType: string) {
  return eventType === "charge.completed" || eventType === "charge.success";
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

async function processFlutterwaveCharge(input: {
  webhookEventId: string;
  reference: string;
  data: NonNullable<FlutterwaveWebhookPayload["data"]>;
}) {
  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
      reference: input.reference,
    },
    include: {
      payment: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!transaction || transaction.provider !== PAYMENT_PROVIDERS.FLUTTERWAVE) {
    await markWebhookEvent({
      id: input.webhookEventId,
      status: WEBHOOK_PROCESSING_STATUSES.FAILED,
      processedAt: new Date(),
      processingError: "Matching Flutterwave transaction not found",
    });

    return noStoreJson({ received: true, processed: false, reason: "transaction_not_found" });
  }

  const providerStatus = cleanText(input.data.status || "unknown", 80);
  const paidAmount = Number(input.data.amount ?? input.data.charged_amount ?? 0);
  const amountMatches = Number.isFinite(paidAmount) && paidAmount >= transaction.amount;
  const currencyMatches =
    cleanText(input.data.currency, 12).toUpperCase() === transaction.currency;
  const referenceMatches = input.data.tx_ref === transaction.reference;
  const successful = isSuccessfulFlutterwaveStatus(providerStatus);

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
    provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
    source: PAYMENT_CONFIRMATION_SOURCES.WEBHOOK,
    gatewayReference: transaction.reference,
    providerReference: providerReferenceFromFlutterwave(input.data),
    paidVia: paidViaFromFlutterwave(input.data),
    providerStatus,
    transactionId: transaction.id,
    webhookEventId: input.webhookEventId,
    providerDisplayName: "Flutterwave webhook",
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
  const payloadHash = hashPayload(rawBody);
  const signatureValid = verifyFlutterwaveWebhook(rawBody, request);

  if (!signatureValid) {
    return noStoreJson({ received: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: FlutterwaveWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as FlutterwaveWebhookPayload;
  } catch {
    return noStoreJson({ received: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventType = cleanText(payload.event ?? payload.type, 120);
  const reference = cleanText(payload.data?.tx_ref, 160);
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
      provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
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

  if (!isSupportedFlutterwaveEvent(eventType)) {
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
    return await processFlutterwaveCharge({
      webhookEventId: webhookEvent.id,
      reference,
      data: payload.data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 250) : "Webhook processing failed";

    await markWebhookEvent({
      id: webhookEvent.id,
      status: WEBHOOK_PROCESSING_STATUSES.FAILED,
      processedAt: new Date(),
      processingError: message,
    });

    return noStoreJson({ received: true, processed: false, reason: "processing_failed" });
  }
}