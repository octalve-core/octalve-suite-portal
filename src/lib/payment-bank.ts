export type PaymentBankDetails = {
  accountNumber: string;
  bankName: string;
  accountName: string;
};

export const OCTALVE_PAYMENT_BANK: PaymentBankDetails = {
  accountNumber:
    process.env.OCTALVE_ACCOUNT_NUMBER?.trim() ||
    process.env.NEXT_PUBLIC_OCTALVE_ACCOUNT_NUMBER?.trim() ||
    "1308342612",
  bankName:
    process.env.OCTALVE_BANK_NAME?.trim() ||
    process.env.NEXT_PUBLIC_OCTALVE_BANK_NAME?.trim() ||
    "PROVIDUS BANK",
  accountName:
    process.env.OCTALVE_ACCOUNT_NAME?.trim() ||
    process.env.NEXT_PUBLIC_OCTALVE_ACCOUNT_NAME?.trim() ||
    "OCTALVE LTD",
} as const;

/**
 * Returns the official Octalve payment account used across the portal.
 *
 * This is a static fallback. Server routes should prefer getOfficialPaymentBankDetails()
 * from "@/lib/payment-settings" so database-managed bank settings can override env values.
 */
export function resolvePaymentBankDetails(_payment?: {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
}): PaymentBankDetails {
  return {
    bankName: OCTALVE_PAYMENT_BANK.bankName,
    accountName: OCTALVE_PAYMENT_BANK.accountName,
    accountNumber: OCTALVE_PAYMENT_BANK.accountNumber,
  };
}