export type PaymentBankDetails = {
  accountNumber: string;
  bankName: string;
  accountName: string;
};

export const OCTALVE_PAYMENT_BANK: PaymentBankDetails = {
  accountNumber: process.env.NEXT_PUBLIC_OCTALVE_ACCOUNT_NUMBER?.trim() || "1308342612",
  bankName: process.env.NEXT_PUBLIC_OCTALVE_BANK_NAME?.trim() || "PROVIDUS BANK",
  accountName: process.env.NEXT_PUBLIC_OCTALVE_ACCOUNT_NAME?.trim() || "OCTALVE LTD",
} as const;

/**
 * Returns the official Octalve payment account used across the portal.
 *
 * We intentionally do not trust per-payment stored bank fields for display,
 * because older payment rows may contain legacy/demo account values.
 * New backend/system-settings support can later update this one central source.
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