import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";
import {
  PAYMENT_CONFIRMATION_SOURCES,
  PAYMENT_PROVIDERS,
  PAYMENT_TRANSACTION_STATUSES,
} from "@/lib/payment-constants";

type PaystackVerifyResponse = {
  status: boolean;
  message?: string;
  data?: {
    id?: number;
    domain?: string;
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    paid_at?: string | null;
    gateway_response?: string;
    channel?: string;
    authorization?: {
      channel?: string;
      card_type?: string;
      bank?: string;
      last4?: string;
      exp_month?: string;
      exp_year?: string;
    };
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

function providerReferenceFromPaystack(data: PaystackVerifyResponse["data"]) {
  if (!data?.id) return data?.reference ?? null;
  return String(data.id);
}

function paidViaFromPaystack(data: PaystackVerifyResponse["data"]) {
  const channel = data?.channel ?? data?.authorization?.channel;
  const cardType = data?.authorization?.card_type;
  const bank = data?.authorization?.bank;
  const last4 = data?.authorization?.last4;

  return [channel, cardType, bank, last4 ? `****${last4}` : ""]
    .filter(Boolean)
    .join(" / ")
    .slice(0, 120) || null;
}

async function verifyWithPaystack(reference: string): Promise<PaystackVerifyResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("Paystack server key is not configured");
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
  const paymentId = cleanReference(body.paymentId);

  if (!reference) {
    return errorResponse("Payment reference is required", 400);
  }

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { reference },
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
    return errorResponse("Paystack transaction not found", 404);
  }

  if (paymentId && transaction.paymentId !== paymentId) {
    return errorResponse("Payment reference mismatch", 400);
  }

  const project = transaction.payment.project;
  const isOwner = project.clientId === result.user.id;
  const isAdmin = result.role === "SUPER_ADMIN";

  if (!isOwner && !isAdmin) {
    return errorResponse("Forbidden", 403);
  }

  if (transaction.payment.status === "CONFIRMED") {
    return noStoreJson({
      provider: PAYMENT_PROVIDERS.PAYSTACK,
      paymentId: transaction.paymentId,
      paymentReference: transaction.payment.reference,
      transactionReference: transaction.reference,
      status: "ALREADY_CONFIRMED",
      message: "This payment has already been confirmed.",
      projectStatus: project.status,
    });
  }

  let paystackPayload: PaystackVerifyResponse;

  try {
    paystackPayload = await verifyWithPaystack(reference);
  } catch (error) {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PAYMENT_TRANSACTION_STATUSES.FAILED,
        failedAt: new Date(),
        failureReason:
          error instanceof Error
            ? error.message.slice(0, 250)
            : "Paystack verification failed",
      },
    });

    return errorResponse("Unable to verify Paystack payment. Please try again.", 502);
  }

  const data = paystackPayload.data;
  const providerStatus = data?.status ?? "unknown";

  const amountMatches = Number(data?.amount) === transaction.amount * 100;
  const currencyMatches = String(data?.currency ?? "").toUpperCase() === transaction.currency;
  const referenceMatches = data?.reference === transaction.reference;
  const successful = paystackPayload.status === true && providerStatus === "success";

  if (!successful || !amountMatches || !currencyMatches || !referenceMatches) {
    const reason = [
      !successful ? `Provider status: ${providerStatus}` : "",
      !amountMatches ? "Amount mismatch" : "",
      !currencyMatches ? "Currency mismatch" : "",
      !referenceMatches ? "Reference mismatch" : "",
    ].filter(Boolean).join("; ");

    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PAYMENT_TRANSACTION_STATUSES.FAILED,
        providerStatus,
        failedAt: new Date(),
        failureReason: reason.slice(0, 250),
      },
    });

    return noStoreJson(
      {
        provider: PAYMENT_PROVIDERS.PAYSTACK,
        paymentId: transaction.paymentId,
        paymentReference: transaction.payment.reference,
        transactionReference: transaction.reference,
        status: "FAILED",
        message: "Paystack payment could not be confirmed. If you were debited, contact support with your reference.",
        projectStatus: project.status,
      },
      { status: 400 },
    );
  }

  const resultPayload = await prisma.$transaction(async (tx) => {
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
      throw new Error("Payment disappeared during verification");
    }

    if (freshPayment.status === "CONFIRMED") {
      await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PAYMENT_TRANSACTION_STATUSES.CONFIRMED,
          verifiedAt: new Date(),
          confirmedAt: new Date(),
          providerStatus,
          providerReference: providerReferenceFromPaystack(data),
        },
      });

      return {
        status: "ALREADY_CONFIRMED" as const,
        projectStatus: freshPayment.project.status,
      };
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
        status: PAYMENT_TRANSACTION_STATUSES.CONFIRMED,
        verifiedAt: new Date(),
        confirmedAt: new Date(),
        providerStatus,
        providerReference: providerReferenceFromPaystack(data),
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
        providerReference: providerReferenceFromPaystack(data),
        paidVia: paidViaFromPaystack(data),
        confirmedSource: PAYMENT_CONFIRMATION_SOURCES.SERVER_VERIFY,
        note: null,
      },
    });

    let nextProjectStatus = freshPayment.project.status;

    if (freshPayment.type === "DEPOSIT") {
      nextProjectStatus = "ACTIVE";

      await tx.project.update({
        where: { id: freshPayment.projectId },
        data: { status: nextProjectStatus },
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
      nextProjectStatus = "ACTIVE";

      await tx.project.update({
        where: { id: freshPayment.projectId },
        data: { status: nextProjectStatus },
      });

      const finalPhase = freshPayment.project.phases[freshPayment.project.phases.length - 1];

      if (finalPhase && finalPhase.status === "LOCKED") {
        await tx.projectPhase.update({
          where: { id: finalPhase.id },
          data: { status: "IN_PROGRESS" },
        });
      }
    }

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
        title: "Online payment confirmed",
        body: `${freshPayment.project.title} — ${freshPayment.type} payment was confirmed through Paystack.`,
        href: "/admin/payments",
      },
    });

    return {
      status: "CONFIRMED" as const,
      projectStatus: nextProjectStatus,
    };
  });

  return noStoreJson({
    provider: PAYMENT_PROVIDERS.PAYSTACK,
    paymentId: transaction.paymentId,
    paymentReference: transaction.payment.reference,
    transactionReference: transaction.reference,
    status: resultPayload.status,
    message:
      resultPayload.status === "ALREADY_CONFIRMED"
        ? "This payment has already been confirmed."
        : "Payment verified and confirmed successfully.",
    projectStatus: resultPayload.projectStatus,
  });
}