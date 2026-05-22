import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";
import {
  PAYMENT_PROVIDERS,
  PAYMENT_TRANSACTION_STATUSES,
} from "@/lib/payment-constants";

type Params = { params: Promise<{ id: string }> };

type PaystackInitializeResponse = {
  status: boolean;
  message?: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  };
};

const PAYSTACK_INITIALIZE_URL = "https://api.paystack.co/transaction/initialize";

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
  const message = value instanceof Error ? value.message : String(value ?? "Provider request failed");
  return message.slice(0, 250);
}

async function initializePaystackTransaction(input: {
  request: Request;
  payment: {
    id: string;
    reference: string;
    amount: number;
    type: string;
    projectId: string;
    project: {
      id: string;
      title: string;
      projectCode: string;
      clientId: string;
      clientEmail: string;
    };
  };
  userId: string;
}) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();

  if (!secretKey) {
    return errorResponse("Paystack server key is not configured", 500);
  }

  const existing = await prisma.paymentTransaction.findFirst({
    where: {
      paymentId: input.payment.id,
      provider: PAYMENT_PROVIDERS.PAYSTACK,
      status: {
        in: [
          PAYMENT_TRANSACTION_STATUSES.INITIALIZED,
          PAYMENT_TRANSACTION_STATUSES.PENDING,
        ],
      },
      authorizationUrl: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing?.authorizationUrl) {
    return noStoreJson({
      provider: PAYMENT_PROVIDERS.PAYSTACK,
      paymentId: input.payment.id,
      paymentReference: input.payment.reference,
      transactionReference: existing.reference,
      authorizationUrl: existing.authorizationUrl,
      status: "PAYSTACK_AUTHORIZATION_READY",
      message: "Paystack checkout is ready.",
    });
  }

  const transactionReference = makeTransactionReference(
    input.payment.reference,
    PAYMENT_PROVIDERS.PAYSTACK,
  );

  const transaction = await prisma.paymentTransaction.create({
    data: {
      paymentId: input.payment.id,
      projectId: input.payment.projectId,
      provider: PAYMENT_PROVIDERS.PAYSTACK,
      status: PAYMENT_TRANSACTION_STATUSES.INITIALIZED,
      amount: input.payment.amount,
      currency: "NGN",
      reference: transactionReference,
      idempotencyKey: makeIdempotencyKey(input.payment.id, PAYMENT_PROVIDERS.PAYSTACK),
      initiatedById: input.userId,
    },
  });

  const callbackUrl = `${getCallbackBaseUrl(input.request)}/client/payments/callback/paystack?paymentId=${encodeURIComponent(input.payment.id)}`;

  try {
    const response = await fetch(PAYSTACK_INITIALIZE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        email: input.payment.project.clientEmail,
        amount: input.payment.amount * 100,
        currency: "NGN",
        reference: transaction.reference,
        callback_url: callbackUrl,
        metadata: {
          paymentId: input.payment.id,
          projectId: input.payment.projectId,
          projectCode: input.payment.project.projectCode,
          paymentType: input.payment.type,
          source: "OCTALVE_SUITE_PORTAL",
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

      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PAYMENT_TRANSACTION_STATUSES.FAILED,
          failedAt: new Date(),
          failureReason: failureReason.slice(0, 250),
        },
      });

      return errorResponse("Unable to initialize Paystack payment. Please try again.", 502);
    }

    const updated = await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PAYMENT_TRANSACTION_STATUSES.PENDING,
        providerReference: payload.data.reference,
        providerStatus: "authorization_url_created",
        authorizationUrl: payload.data.authorization_url,
      },
    });

    return noStoreJson({
      provider: PAYMENT_PROVIDERS.PAYSTACK,
      paymentId: input.payment.id,
      paymentReference: input.payment.reference,
      transactionReference: updated.reference,
      authorizationUrl: updated.authorizationUrl,
      status: "PAYSTACK_AUTHORIZATION_READY",
      message: "Paystack checkout is ready.",
    });
  } catch (error) {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PAYMENT_TRANSACTION_STATUSES.FAILED,
        failedAt: new Date(),
        failureReason: safeFailureReason(error),
      },
    });

    return errorResponse("Unable to initialize Paystack payment. Please try again.", 502);
  }
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

  if (provider === PAYMENT_PROVIDERS.PAYSTACK) {
    const gateway = await prisma.paymentGatewaySetting.findUnique({
      where: { provider },
    });

    if (!gateway?.isEnabled) {
      return errorResponse("Paystack is not enabled", 400);
    }

    return initializePaystackTransaction({
      request,
      payment,
      userId: result.user.id,
    });
  }

  if (
    provider === PAYMENT_PROVIDERS.FLUTTERWAVE ||
    provider === PAYMENT_PROVIDERS.PAYPAL ||
    provider === PAYMENT_PROVIDERS.WALLET
  ) {
    return errorResponse("This payment provider is not connected yet", 400);
  }

  return errorResponse("Unsupported payment provider", 400);
}