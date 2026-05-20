export type PaymentBankDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export const OCTALVE_PAYMENT_BANK: PaymentBankDetails = {
  accountNumber: process.env.NEXT_PUBLIC_OCTALVE_ACCOUNT_NUMBER ?? "1308342612",
  bankName: process.env.NEXT_PUBLIC_OCTALVE_BANK_NAME ?? "PROVIDUS BANK",
  accountName: process.env.NEXT_PUBLIC_OCTALVE_ACCOUNT_NAME ?? "OCTALVE LTD",
} as const;

export function resolvePaymentBankDetails(payment?: {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
}): PaymentBankDetails {
  return {
    bankName: payment?.bankName?.trim() || OCTALVE_PAYMENT_BANK.bankName,
    accountName: payment?.accountName?.trim() || OCTALVE_PAYMENT_BANK.accountName,
    accountNumber: payment?.accountNumber?.trim() || OCTALVE_PAYMENT_BANK.accountNumber,
  };
}