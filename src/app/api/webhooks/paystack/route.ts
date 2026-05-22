import { createHash, createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  PAYMENT_CONFIRMATION_SOURCES,
  PAYMENT_PROVIDERS,
  PAYMENT_TRANSACTION_STATUSES,
  WEBHOOK_PROCESSING_STATUSES,
} from "@/lib/payment-constants";

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
          project: {
            include: {
              phases: { orderBy: { phaseNumber: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!transaction || transaction.provider !== PAYMENT_PROVIDERS.PAYSTACK) {
    await markWebhookEvent({
      id: input.webhookEventId,
      status: WEBHOOK_PROCESSING_STATUSES.FAILED,
      processingError: "Matching Paystack transaction not found",
    });

    return noStoreJson({ received: true, processed: false, reason: "transaction_not_found" });
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

  await prisma.$transaction(async (tx) => {
    const freshPayment = await tx.projectPayment.findUnique({
      where: { id: transaction.paymentId },
      include: {
        project: {
          include: {
            phases: { orderBy: { phaseNumber: "asc" } },
          },
        },
      },
    });

    if (!freshPayment) {
      throw new Error("Payment not found during webhook processing");
    }

    if (freshPayment.status === "CONFIRMED") {
      await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          webhookEventId: input.webhookEventId,
          status: PAYMENT_TRANSACTION_STATUSES.CONFIRMED,
          verifiedAt: transaction.verifiedAt ?? new Date(),
          confirmedAt: transaction.confirmedAt ?? new Date(),
          providerStatus,
          providerReference: providerReferenceFromPaystack(input.data),
        },
      });

      await tx.paymentWebhookEvent.update({
        where: { id: input.webhookEventId },
        data: {
          status: WEBHOOK_PROCESSING_STATUSES.PROCESSED,
          processedAt: new Date(),
          processingError: null,
        },
      });

      return;
    }

    const expectedProjectStatus =
      freshPayment.type === "DEPOSIT"
        ? "APPROVED_AWAITING_DEPOSIT"
        : "AWAITING_BALANCE";

    const pendingProjectStatus =
      freshPayment.type === "DEPOSIT"
        ? "DEPOSIT_PENDING_CONFIRMATION"
        : "BALANCE_PENDING_CONFIRMATION";

    if (
      freshPayment.status !== "UNPAID" ||
      ![expectedProjectStatus, pendingProjectStatus].includes(freshPayment.project.status)
    ) {
      throw new Error("Payment is not in a payable state");
    }

    await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        webhookEventId: input.webhookEventId,
        status: PAYMENT_TRANSACTION_STATUSES.CONFIRMED,
        verifiedAt: transaction.verifiedAt ?? new Date(),
        confirmedAt: new Date(),
        providerStatus,
        providerReference: providerReferenceFromPaystack(input.data),
      },
    });

    await tx.projectPayment.update({
      where: { id: freshPayment.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        clientMarkedPaidAt: new Date(),
        provider: PAYMENT_PROVIDERS.PAYSTACK,
        gatewayReference: transaction.reference,
        providerReference: providerReferenceFromPaystack(input.data),
        paidVia: paidViaFromPaystack(input.data),
        confirmedSource: PAYMENT_CONFIRMATION_SOURCES.WEBHOOK,
        note: null,
      },
    });

    if (freshPayment.type === "DEPOSIT") {
      await tx.project.update({
        where: { id: freshPayment.projectId },
        data: { status: "ACTIVE" },
      });

      const firstPhase = freshPayment.project.phases[0];

      if (firstPhase && firstPhase.status === "LOCKED") {
        await tx.projectPhase.update({
          where: { id: firstPhase.id },
          data: { status: "IN_PROGRESS" },
        });
      }
    }

    if (freshPayment.type === "BALANCE") {
      await tx.project.update({
        where: { id: freshPayment.projectId },
        data: { status: "ACTIVE" },
      });

      const finalPhase = freshPayment.project.phases[freshPayment.project.phases.length - 1];

      if (finalPhase && finalPhase.status === "LOCKED") {
        await tx.projectPhase.update({
          where: { id: finalPhase.id },
          data: { status: "IN_PROGRESS" },
        });
      }
    }

    await tx.paymentWebhookEvent.update({
      where: { id: input.webhookEventId },
      data: {
        status: WEBHOOK_PROCESSING_STATUSES.PROCESSED,
        processedAt: new Date(),
        processingError: null,
      },
    });

    await tx.notification.create({
      data: {
        userId: freshPayment.project.clientId,
        title: "Payment confirmed",
        body: `Your ${freshPayment.type.toLowerCase()} payment for ${freshPayment.project.title} has been confirmed.`,
        href: "/client",
      },
    });

    await tx.notification.create({
      data: {
        role: "SUPER_ADMIN",
        title: "Paystack webhook payment confirmed",
        body: `${freshPayment.project.title} — ${freshPayment.type} payment was confirmed through Paystack webhook.`,
        href: "/admin/payments",
      },
    });
  });

  return noStoreJson({ received: true, processed: true });
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