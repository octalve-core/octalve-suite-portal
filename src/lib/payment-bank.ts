export const OCTALVE_PAYMENT_BANK = {
  accountNumber: process.env.NEXT_PUBLIC_OCTALVE_ACCOUNT_NUMBER ?? "1308342612",
  bankName: process.env.NEXT_PUBLIC_OCTALVE_BANK_NAME ?? "PROVIDUS BANK",
  accountName: process.env.NEXT_PUBLIC_OCTALVE_ACCOUNT_NAME ?? "OCTALVE LTD",
} as const;

export function resolvePaymentBankDetails(_payment?: {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
}) {
  return {
    bankName: OCTALVE_PAYMENT_BANK.bankName,
    accountName: OCTALVE_PAYMENT_BANK.accountName,
    accountNumber: OCTALVE_PAYMENT_BANK.accountNumber,
  };
}