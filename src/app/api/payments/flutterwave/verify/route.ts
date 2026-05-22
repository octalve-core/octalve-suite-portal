import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, errorResponse } from "@/lib/api-helpers";
import {
  PAYMENT_CONFIRMATION_SOURCES,
  PAYMENT_PROVIDERS,
  PAYMENT_TRANSACTION_STATUSES,
} from "@/lib/payment-constants";

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

function providerReferenceFromFlutterwave(data: FlutterwaveVerifyResponse["data"]) {
  if (data?.id) return String(data.id);
  return data?.flw_ref ?? data?.tx_ref ?? null;
}

function paidViaFromFlutterwave(data: FlutterwaveVerifyResponse["data"]) {
  const paymentType = data?.payment_type;
  const cardType = data?.card?.type;
  const issuer = data?.card?.issuer;
  const last4 = data?.card?.last_4digits;

  return [paymentType, cardType, issuer, last4 ? `****${last4}` : ""]
    .filter(Boolean)
    .join(" / ")
    .slice(0, 120) || null;
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

export async function POST(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const body = await request.json().catch(() => ({}));
  const txRef = cleanText(body.txRef, 160);
  const transactionId = cleanText(body.transactionId, 80);
  const paymentId = cleanText(body.paymentId, 160);

  if (!txRef && !transactionId) {
    return errorResponse("Flutterwave transaction reference is required", 400);
  }

  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
      OR: [
        txRef ? { reference: txRef } : {},
        transactionId ? { providerReference: transactionId } : {},
      ],
    },
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

  if (!transaction || transaction.provider !== PAYMENT_PROVIDERS.FLUTTERWAVE) {
    return errorResponse("Payment transaction not found", 404);
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
      provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
      paymentId: transaction.paymentId,
      paymentReference: transaction.payment.reference,
      transactionReference: transaction.reference,
      status: "ALREADY_CONFIRMED",
      message: "This payment has already been confirmed.",
      projectStatus: project.status,
    });
  }

  let flutterwavePayload: FlutterwaveVerifyResponse;

  try {
    flutterwavePayload = await verifyWithFlutterwave({ txRef: transaction.reference, transactionId });
  } catch (error) {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PAYMENT_TRANSACTION_STATUSES.FAILED,
        failedAt: new Date(),
        failureReason:
          error instanceof Error
            ? error.message.slice(0, 250)
            : "Flutterwave verification failed",
      },
    });

    return errorResponse("Unable to confirm Flutterwave payment. Please try again or contact support.", 502);
  }

  const data = flutterwavePayload.data;
  const providerStatus = cleanText(data?.status ?? "unknown", 80);

  const expectedAmount = transaction.amount;
  const paidAmount = Number(data?.amount ?? data?.charged_amount ?? 0);
  const amountMatches = Number.isFinite(paidAmount) && paidAmount >= expectedAmount;
  const currencyMatches = cleanText(data?.currency, 12).toUpperCase() === transaction.currency;
  const referenceMatches = data?.tx_ref === transaction.reference;
  const successful = flutterwavePayload.status === "success" && providerStatus === "successful";

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
        provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
        paymentId: transaction.paymentId,
        paymentReference: transaction.payment.reference,
        transactionReference: transaction.reference,
        status: "FAILED",
        message: "Flutterwave payment could not be confirmed. If you were debited, contact support with your reference.",
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
          providerReference: providerReferenceFromFlutterwave(data),
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
        providerReference: providerReferenceFromFlutterwave(data),
      },
    });

    await tx.projectPayment.update({
      where: { id: freshPayment.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        clientMarkedPaidAt: new Date(),
        provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
        gatewayReference: transaction.reference,
        providerReference: providerReferenceFromFlutterwave(data),
        paidVia: paidViaFromFlutterwave(data),
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
        body: `${freshPayment.project.title} — ${freshPayment.type} payment was confirmed through Flutterwave.`,
        href: "/admin/payments",
      },
    });

    return {
      status: "CONFIRMED" as const,
      projectStatus: nextProjectStatus,
    };
  });

  return noStoreJson({
    provider: PAYMENT_PROVIDERS.FLUTTERWAVE,
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