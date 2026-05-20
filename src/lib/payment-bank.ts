export const OCTALVE_PAYMENT_BANK = {
  accountNumber: "1308342612",
  bankName: "PROVIDUS BANK",
  accountName: "OCTALVE LTD",
} as const;

/**
 * Current official Octalve payment account.
 * 
 * For now, the portal displays this account consistently even if older payment
 * records still contain previous bank details in the database.
 * Later, this can be replaced with an admin-editable backend setting.
 */
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