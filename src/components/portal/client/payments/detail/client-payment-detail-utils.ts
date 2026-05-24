import type {
  PaymentMethodOption,
  PaymentStatus,
  Project,
  ProjectPayment,
} from "@/lib/types";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PENDING_CONFIRMATION: "Pending Confirmation",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, string> = {
  UNPAID: "border-blue-200 bg-blue-50 text-[#0064E0]",
  PENDING_CONFIRMATION: "border-orange-200 bg-orange-50 text-orange-700",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

export const PAYMENT_STATUS_ICON_TONE: Record<PaymentStatus, string> = {
  UNPAID: "bg-blue-50 text-[#0064E0] ring-blue-100",
  PENDING_CONFIRMATION: "bg-orange-50 text-orange-700 ring-orange-100",
  CONFIRMED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  REJECTED: "bg-red-50 text-red-700 ring-red-100",
};

export type PaymentMethodGroup = {
  bankMethod?: PaymentMethodOption;
  onlineMethods: PaymentMethodOption[];
  walletMethod?: PaymentMethodOption;
};

export type PaymentPanel = "BANK" | "ONLINE" | "WALLET";

export function formatPaymentMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPaymentDate(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatPaymentDateTime(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function paymentTypeLabel(type: ProjectPayment["type"]) {
  return type === "DEPOSIT" ? "Deposit Payment" : "Balance Payment";
}

export function canMarkPaymentForProject(project: Project, payment: ProjectPayment) {
  if (payment.status !== "UNPAID") return false;

  if (payment.type === "DEPOSIT") {
    return project.status === "APPROVED_AWAITING_DEPOSIT";
  }

  return project.status === "AWAITING_BALANCE";
}

export function isSafeGatewayRedirect(value?: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function groupPaymentMethods(methods: PaymentMethodOption[]): PaymentMethodGroup {
  const bankMethod = methods.find(
    (method) => method.provider === "MANUAL_BANK" && method.isEnabled,
  );

  const onlineMethods = methods.filter(
    (method) =>
      method.provider !== "MANUAL_BANK" &&
      method.provider !== "WALLET" &&
      method.isEnabled &&
      method.isReady &&
      method.isAutomated,
  );

  const walletMethod = methods.find(
    (method) => method.provider === "WALLET" && method.isEnabled,
  );

  return {
    bankMethod,
    onlineMethods,
    walletMethod,
  };
}

export function providerLabel(value?: string) {
  if (!value) return "Not set";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (item) => item.toUpperCase());
}

export function shortReference(value?: string) {
  const cleaned = String(value ?? "").trim();

  if (!cleaned) return "Not set";
  if (cleaned.length <= 24) return cleaned;

  return `${cleaned.slice(0, 14)}...${cleaned.slice(-6)}`;
}
