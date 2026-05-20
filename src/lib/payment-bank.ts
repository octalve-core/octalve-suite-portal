export const OCTALVE_PAYMENT_BANK = {
  accountNumber: "1308342612",
  bankName: "PROVIDUS BANK",
  accountName: "OCTALVE LTD",
} as const;

export function resolvePaymentBankDetails(payment: {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
}) {
  return {
    bankName: payment.bankName || OCTALVE_PAYMENT_BANK.bankName,
    accountName: payment.accountName || OCTALVE_PAYMENT_BANK.accountName,
    accountNumber: payment.accountNumber || OCTALVE_PAYMENT_BANK.accountNumber,
  };
}