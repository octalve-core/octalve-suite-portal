import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";
import {
  PAYMENT_PROVIDERS,
  PAYMENT_TRANSACTION_STATUSES,
} from "@/lib/payment-constants";

type Params = { params: Promise<{ id: string }> };

type GatewayPaymentInput = {
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
    businessName?: string | null;
  };
};

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

async function createGatewayTransaction(input: {
  payment: GatewayPaymentInput;
  provider: string;
  userId: string;
}) {
  const existing = await prisma.paymentTransaction.findFirst({
    where: {
      paymentId: input.payment.id,
      provider: input.provider,
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
    return {
      existing,
      transaction: null,
      transactionReference: existing.reference,
    };
  }

  const transactionReference = makeTransactionReference(
    input.payment.reference,
    input.provider,
  );

  const transaction = await prisma.paymentTransaction.create({
    data: {
      paymentId: input.payment.id,
      projectId: input.payment.projectId,
      provider: input.provider,
      status: PAYMENT_TRANSACTION_STATUSES.INITIALIZED,
      amount: input.payment.amount,
      currency: "NGN",
      reference: transactionReference,
      idempotencyKey: makeIdempotencyKey(input.payment.id, input.provider),
      initiatedById: input.userId,
    },
  });

  return {
    existing: null,
    transaction,
    transactionReference,
  };
}

async function initializePaystackTransaction(input: {
  request: Request;
  payment: GatewayPaymentInput;
  userId: string;
}) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();

  if (!secretKey) {
    return errorResponse("Paystack is temporarily unavailable. Please use another payment option or contact support.", 503);
  }

  const record = await createGatewayTransaction({
    payment: input.payment,
    provider: PAYMENT_PROVIDERS.PAYSTACK,
    userId: input.userId,
  });

  if (record.existing?.authorizationUrl) {
    return noStoreJson({
      provider: PAYMENT_PROVIDERS.PAYSTACK,
      paymentId: input.payment.id,
      paymentReference: input.payment.reference,
      transactionReference: record.existing.reference,
      authorizationUrl: record.existing.authorizationUrl,
      status: "PAYSTACK_AUTHORIZATION_READY",
      message: "Paystack checkout is ready.",
    });
  }

  if (!record.transaction) {
    return errorResponse("Unable to prepare Paystack checkout. Please try again.", 502);
  }

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
        reference: record.transaction.reference,
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
        where: { id: record.transaction.id },
        data: {
          status: PAYMENT_TRANSACTION_STATUSES.FAILED,
          failedAt: new Date(),
          failureReason: failureReason.slice(0, 250),
        },
      });

      return errorResponse("Unable to start Paystack checkout. Please try again or use another payment option.", 502);
    }

    const updated = await prisma.paymentTransaction.update({
      where: { id: record.transaction.id },
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
      where: { id: record.transaction.id },
      data: {
        status: PAYMENT_TRANSACTION_STATUSES.FAILED,
        failedAt: new Date(),
        failureReason: safeFailureReason(error),
      },
    });

    return errorResponse("Unable to start Paystack checkout. Please try again or use another payment option.", 502);
  }
}

async function initializeFlutterwaveTransaction(input: {
  request: Request;
  payment: GatewayPaymentInput;
  userId: string;
}) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY?.trim();

  if (!secretKey) {
    return errorResponse("Flutterwave is temporarily unavailable. Please use another payment option or contact support.", 503);
  }

  const record = await createGatewayTransaction({
    payment: input.payment,
    provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
    userId: input.userId,
  });

  if (record.existing?.authorizationUrl) {
    return noStoreJson({
      provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
      paymentId: input.payment.id,
      paymentReference: input.payment.reference,
      transactionReference: record.existing.reference,
      authorizationUrl: record.existing.authorizationUrl,
      status: "FLUTTERWAVE_LINK_READY",
      message: "Flutterwave checkout is ready.",
    });
  }

  if (!record.transaction) {
    return errorResponse("Unable to prepare Flutterwave checkout. Please try again.", 502);
  }

  const redirectUrl = `${getCallbackBaseUrl(input.request)}/client/payments/callback/flutterwave?paymentId=${encodeURIComponent(input.payment.id)}`;

  try {
    const response = await fetch(FLUTTERWAVE_INITIALIZE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        tx_ref: record.transaction.reference,
        amount: String(input.payment.amount),
        currency: "NGN",
        redirect_url: redirectUrl,
        customer: {
          email: input.payment.project.clientEmail,
          name: input.payment.project.businessName || input.payment.project.title,
        },
        meta: {
          paymentId: input.payment.id,
          projectId: input.payment.projectId,
          projectCode: input.payment.project.projectCode,
          paymentType: input.payment.type,
          source: "OCTALVE_SUITE_PORTAL",
        },
        customizations: {
          title: "Octalve Suite",
          description: `${input.payment.type.toLowerCase()} payment for ${input.payment.project.title}`,
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

      await prisma.paymentTransaction.update({
        where: { id: record.transaction.id },
        data: {
          status: PAYMENT_TRANSACTION_STATUSES.FAILED,
          failedAt: new Date(),
          failureReason: failureReason.slice(0, 250),
        },
      });

      return errorResponse("Unable to start Flutterwave checkout. Please try again or use another payment option.", 502);
    }

    const updated = await prisma.paymentTransaction.update({
      where: { id: record.transaction.id },
      data: {
        status: PAYMENT_TRANSACTION_STATUSES.PENDING,
        providerReference: record.transaction.reference,
        providerStatus: "hosted_link_created",
        authorizationUrl: payload.data.link,
      },
    });

    return noStoreJson({
      provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
      paymentId: input.payment.id,
      paymentReference: input.payment.reference,
      transactionReference: updated.reference,
      authorizationUrl: updated.authorizationUrl,
      status: "FLUTTERWAVE_LINK_READY",
      message: "Flutterwave checkout is ready.",
    });
  } catch (error) {
    await prisma.paymentTransaction.update({
      where: { id: record.transaction.id },
      data: {
        status: PAYMENT_TRANSACTION_STATUSES.FAILED,
        failedAt: new Date(),
        failureReason: safeFailureReason(error),
      },
    });

    return errorResponse("Unable to start Flutterwave checkout. Please try again or use another payment option.", 502);
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

  if (provider === PAYMENT_PROVIDERS.PAYSTACK || provider === PAYMENT_PROVIDERS.FLUTTERWAVE) {
    const gateway = await prisma.paymentGatewaySetting.findUnique({
      where: { provider },
    });

    if (!gateway?.isEnabled) {
      return errorResponse("This payment option is currently unavailable.", 400);
    }

    if (provider === PAYMENT_PROVIDERS.PAYSTACK) {
      return initializePaystackTransaction({
        request,
        payment,
        userId: result.user.id,
      });
    }

    return initializeFlutterwaveTransaction({
      request,
      payment,
      userId: result.user.id,
    });
  }

  if (
    provider === PAYMENT_PROVIDERS.PAYPAL ||
    provider === PAYMENT_PROVIDERS.WALLET
  ) {
    return errorResponse("This payment option is currently unavailable.", 400);
  }

  return errorResponse("Unsupported payment provider", 400);
}