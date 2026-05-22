import { NextResponse } from "next/server";
import {
  getOfficialPaymentBankDetails,
  validatePaymentBankDetails,
} from "@/lib/payment-settings";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  requireRoles,
  errorResponse,
} from "@/lib/api-helpers";

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const details = await getOfficialPaymentBankDetails();
  return noStoreJson(details);
}

export async function PATCH(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));
  const validation = validatePaymentBankDetails({
    bankName: String(body.bankName ?? ""),
    accountName: String(body.accountName ?? ""),
    accountNumber: String(body.accountNumber ?? ""),
  });

  if (!validation.ok) {
    return errorResponse(validation.message, 400);
  }

  const saved = await prisma.$transaction(async (tx) => {
    const bank = await tx.paymentBankSetting.upsert({
      where: { id: "official" },
      create: {
        id: "official",
        ...validation.value,
      },
      update: validation.value,
    });

    await tx.projectPayment.updateMany({
      where: {
        status: {
          in: ["UNPAID", "PENDING_CONFIRMATION"],
        },
        provider: "MANUAL_BANK",
      },
      data: {
        bankName: validation.value.bankName,
        accountName: validation.value.accountName,
        accountNumber: validation.value.accountNumber,
      },
    });

    return bank;
  });

  return noStoreJson({
    bankName: saved.bankName,
    accountName: saved.accountName,
    accountNumber: saved.accountNumber,
  });
}
