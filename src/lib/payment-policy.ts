export const DEFAULT_PROJECT_DEPOSIT_PERCENTAGE = 70 as const;

export type ProjectPaymentSplit = {
  totalAmount: number;
  depositAmount: number;
  balanceAmount: number;
  depositPercentage: number;
};

type ProjectPaymentSplitInput = {
  totalAmount: unknown;
  depositAmount?: unknown;
  balanceAmount?: unknown;
  depositPercentage?: number;
};

function toIntegerAmount(value: unknown): number {
  const parsed =
    typeof value === "string" && value.trim() !== ""
      ? Number(value.trim())
      : Number(value);

  if (!Number.isFinite(parsed)) return Number.NaN;

  return Math.round(parsed);
}

function normalizeDepositPercentage(value?: number): number {
  if (!Number.isFinite(value)) return DEFAULT_PROJECT_DEPOSIT_PERCENTAGE;

  return Math.min(100, Math.max(1, Math.round(Number(value))));
}

export function calculateProjectPaymentSplit(
  totalAmount: unknown,
  depositPercentage: number = DEFAULT_PROJECT_DEPOSIT_PERCENTAGE,
): ProjectPaymentSplit {
  const normalizedTotal = toIntegerAmount(totalAmount);
  const safeTotal = Number.isFinite(normalizedTotal)
    ? Math.max(normalizedTotal, 0)
    : 0;

  const safePercentage = normalizeDepositPercentage(depositPercentage);
  const depositAmount = Math.round((safeTotal * safePercentage) / 100);
  const balanceAmount = Math.max(safeTotal - depositAmount, 0);

  return {
    totalAmount: safeTotal,
    depositAmount,
    balanceAmount,
    depositPercentage: safePercentage,
  };
}

export function validateProjectPaymentSplit(input: ProjectPaymentSplitInput):
  | { ok: true; split: ProjectPaymentSplit }
  | { ok: false; message: string } {
  const split = calculateProjectPaymentSplit(
    input.totalAmount,
    input.depositPercentage,
  );

  const requestedDeposit = toIntegerAmount(input.depositAmount);
  const requestedBalance = toIntegerAmount(input.balanceAmount);

  if (!Number.isFinite(toIntegerAmount(input.totalAmount)) || split.totalAmount <= 0) {
    return { ok: false, message: "Total amount must be greater than zero" };
  }

  if (!Number.isFinite(requestedDeposit) || !Number.isFinite(requestedBalance)) {
    return { ok: false, message: "Payment amounts are required" };
  }

  if (requestedDeposit < 0 || requestedBalance < 0) {
    return { ok: false, message: "Payment amounts cannot be negative" };
  }

  if (requestedDeposit <= 0) {
    return { ok: false, message: "Deposit amount must be greater than zero" };
  }

  if (requestedDeposit + requestedBalance !== split.totalAmount) {
    return {
      ok: false,
      message: "Deposit and balance must add up to the total project amount",
    };
  }

  if (
    requestedDeposit !== split.depositAmount ||
    requestedBalance !== split.balanceAmount
  ) {
    return {
      ok: false,
      message: `Payment split must use ${split.depositPercentage}% deposit and ${100 - split.depositPercentage}% balance`,
    };
  }

  return { ok: true, split };
}