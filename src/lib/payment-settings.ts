import { prisma } from "@/lib/prisma";

export type PaymentBankDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export const PAYMENT_BANK_SETTING_ID = "official";

export function envPaymentBankDetails(): PaymentBankDetails {
  return {
    bankName:
      process.env.OCTALVE_BANK_NAME?.trim() ||
      process.env.NEXT_PUBLIC_OCTALVE_BANK_NAME?.trim() ||
      "PROVIDUS BANK",
    accountName:
      process.env.OCTALVE_ACCOUNT_NAME?.trim() ||
      process.env.NEXT_PUBLIC_OCTALVE_ACCOUNT_NAME?.trim() ||
      "OCTALVE LTD",
    accountNumber:
      process.env.OCTALVE_ACCOUNT_NUMBER?.trim() ||
      process.env.NEXT_PUBLIC_OCTALVE_ACCOUNT_NUMBER?.trim() ||
      "1308342612",
  };
}

export function normalizePaymentBankDetails(input: PaymentBankDetails): PaymentBankDetails {
  return {
    bankName: input.bankName.trim(),
    accountName: input.accountName.trim(),
    accountNumber: input.accountNumber.trim(),
  };
}

export function validatePaymentBankDetails(input: PaymentBankDetails):
  | { ok: true; value: PaymentBankDetails }
  | { ok: false; message: string } {
  const value = normalizePaymentBankDetails(input);

  if (!value.bankName) {
    return { ok: false, message: "Bank name is required" };
  }

  if (!value.accountName) {
    return { ok: false, message: "Account name is required" };
  }

  if (!value.accountNumber) {
    return { ok: false, message: "Account number is required" };
  }

  if (!/^[0-9]{5,20}$/.test(value.accountNumber)) {
    return { ok: false, message: "Account number must contain 5 to 20 digits only" };
  }

  return { ok: true, value };
}

export async function getOfficialPaymentBankDetails(): Promise<PaymentBankDetails> {
  const stored = await prisma.paymentBankSetting.findUnique({
    where: { id: PAYMENT_BANK_SETTING_ID },
  });

  if (stored) {
    return {
      bankName: stored.bankName,
      accountName: stored.accountName,
      accountNumber: stored.accountNumber,
    };
  }

  return envPaymentBankDetails();
}

export async function upsertOfficialPaymentBankDetails(
  details: PaymentBankDetails,
): Promise<PaymentBankDetails> {
  const validation = validatePaymentBankDetails(details);

  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const saved = await prisma.paymentBankSetting.upsert({
    where: { id: PAYMENT_BANK_SETTING_ID },
    create: {
      id: PAYMENT_BANK_SETTING_ID,
      ...validation.value,
    },
    update: validation.value,
  });

  return {
    bankName: saved.bankName,
    accountName: saved.accountName,
    accountNumber: saved.accountNumber,
  };
}