import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";
import { PAYMENT_PROVIDERS, PAYMENT_TRANSACTION_STATUSES } from "@/lib/payment-constants";

type Params = { params: Promise<{ id: string }> };

function normalizeProvider(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function makeTransactionReference(paymentReference: string, provider: string) {
  return `${paymentReference}-${provider}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function makeIdempotencyKey(paymentId: string, provider: string) {
  return `${paymentId}:${provider}:${randomBytes(12).toString("hex")}`;
}

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const body = await request.json().catch(() => ({}));
  const provider = normalizeProvider(body.provider);

  const payment = await prisma.projectPayment.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!payment) return errorResponse("Payment not found", 404);
  if (payment.project.clientId !== result.user.id) return errorResponse("Forbidden", 403);

  if (payment.status !== "UNPAID") {
    return errorResponse("Payment is not available for initialization", 400);
  }

  const expectedProjectStatus =
    payment.type === "DEPOSIT" ? "APPROVED_AWAITING_DEPOSIT" : "AWAITING_BALANCE";

  if (payment.project.status !== expectedProjectStatus) {
    return errorResponse(
      payment.type === "DEPOSIT"
        ? "Deposit payment is not currently due for this project."
        : "Balance payment is not currently due for this project.",
      400,
    );
  }

  if (provider === PAYMENT_PROVIDERS.MANUAL_BANK) {
    return noStoreJson({
      provider,
      paymentId: payment.id,
      paymentReference: payment.reference,
      status: "MANUAL_READY",
      message: "Manual bank transfer is available. Use the displayed bank details and submit after payment.",
    });
  }

  if (
    provider !== PAYMENT_PROVIDERS.PAYSTACK &&
    provider !== PAYMENT_PROVIDERS.FLUTTERWAVE &&
    provider !== PAYMENT_PROVIDERS.PAYPAL &&
    provider !== PAYMENT_PROVIDERS.WALLET
  ) {
    return errorResponse("Unsupported payment provider", 400);
  }

  const gateway = await prisma.paymentGatewaySetting.findUnique({
    where: { provider },
  });

  if (!gateway?.isEnabled) {
    return errorResponse("Selected payment provider is not enabled", 400);
  }

  const transactionReference = makeTransactionReference(payment.reference, provider);
  const idempotencyKey = makeIdempotencyKey(payment.id, provider);

  await prisma.paymentTransaction.create({
    data: {
      paymentId: payment.id,
      projectId: payment.projectId,
      provider,
      status: PAYMENT_TRANSACTION_STATUSES.INITIALIZED,
      amount: payment.amount,
      currency: "NGN",
      reference: transactionReference,
      idempotencyKey,
      initiatedById: result.user.id,
    },
  });

  return noStoreJson(
    {
      provider,
      paymentId: payment.id,
      paymentReference: payment.reference,
      transactionReference,
      status: "INITIALIZED_NOT_CONNECTED",
      message: "Provider transaction record created. External gateway connection will be activated in the next provider-specific batch.",
    },
    { status: 202 },
  );
}