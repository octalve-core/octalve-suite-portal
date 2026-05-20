export type PaymentBankDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export const OCTALVE_PAYMENT_BANK: PaymentBankDetails = {
  accountNumber: process.env.NEXT_PUBLIC_OCTALVE_ACCOUNT_NUMBER?.trim() || "1308342612",
  bankName: process.env.NEXT_PUBLIC_OCTALVE_BANK_NAME?.trim() || "PROVIDUS BANK",
  accountName: process.env.NEXT_PUBLIC_OCTALVE_ACCOUNT_NAME?.trim() || "OCTALVE LTD",
} as const;

const OLD_OR_PLACEHOLDER_VALUES = new Set([
  "",
  "Octalve Bank",
  "Octalve Consult",
  "Octalve",
  "0000000000",
]);

function cleanPaymentValue(value: string | null | undefined) {
  const cleaned = value?.trim() ?? "";

  return OLD_OR_PLACEHOLDER_VALUES.has(cleaned) ? "" : cleaned;
}

export function resolvePaymentBankDetails(payment?: {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
}): PaymentBankDetails {
  return {
    bankName: cleanPaymentValue(payment?.bankName) || OCTALVE_PAYMENT_BANK.bankName,
    accountName: cleanPaymentValue(payment?.accountName) || OCTALVE_PAYMENT_BANK.accountName,
    accountNumber: cleanPaymentValue(payment?.accountNumber) || OCTALVE_PAYMENT_BANK.accountNumber,
  };
}