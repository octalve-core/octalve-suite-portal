import type { PaymentStatus, Project, ProjectPayment } from "@/lib/types";
import { getPackageTitle } from "../../packageCatalog";

export type PaymentRow = {
  payment: ProjectPayment;
  project: Project;
};

type PaymentWithCreatedAt = ProjectPayment & {
  createdAt?: string;
};

export type PaymentStatusFilter = "ALL" | PaymentStatus;
export type PaymentSortOption =
  | "NEWEST"
  | "OLDEST"
  | "AMOUNT_HIGH"
  | "AMOUNT_LOW"
  | "STATUS";

export const STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PENDING_CONFIRMATION: "Awaiting Confirmation",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
};

export const STATUS_ORDER: Record<PaymentStatus, number> = {
  UNPAID: 0,
  PENDING_CONFIRMATION: 1,
  CONFIRMED: 2,
  REJECTED: 3,
};

export const STATUS_CHIP_CLASSES: Record<PaymentStatus, string> = {
  UNPAID: "border-blue-200 bg-blue-50 text-[#0064E0]",
  PENDING_CONFIRMATION: "border-orange-200 bg-orange-50 text-orange-700",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

export const STATUS_ICON_CLASSES: Record<PaymentStatus, string> = {
  UNPAID: "bg-blue-50 text-[#0064E0] ring-blue-100",
  PENDING_CONFIRMATION: "bg-orange-50 text-orange-600 ring-orange-100",
  CONFIRMED: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  REJECTED: "bg-red-50 text-red-600 ring-red-100",
};

export const STATUS_ACCENT_CLASSES: Record<PaymentStatus, string> = {
  UNPAID: "border-b-[#0064E0]",
  PENDING_CONFIRMATION: "border-b-[#FC7E24]",
  CONFIRMED: "border-b-[#29BE3E]",
  REJECTED: "border-b-[#E61525]",
};

export function formatPaymentMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function getPaymentDateValue(row: PaymentRow) {
  const payment = row.payment as PaymentWithCreatedAt;

  return (
    payment.createdAt ||
    payment.clientMarkedPaidAt ||
    payment.confirmedAt ||
    row.project.createdAt
  );
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

export function formatPaymentTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function paymentTypeLabel(type: ProjectPayment["type"]) {
  return type === "DEPOSIT" ? "Deposit Payment" : "Balance Payment";
}

export function paymentActionLabel(status: PaymentStatus) {
  if (status === "UNPAID") return "Make payment";
  if (status === "CONFIRMED") return "View receipt";

  return "View details";
}

export function rowMatchesSearch(row: PaymentRow, query: string) {
  const value = query.trim().toLowerCase();

  if (!value) return true;

  const content = [
    row.payment.reference,
    row.payment.type,
    row.payment.status,
    row.project.title,
    row.project.businessName,
    row.project.projectCode,
    getPackageTitle(row.project.packageType),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return content.includes(value);
}

function getPaymentTimestamp(row: PaymentRow) {
  const value = getPaymentDateValue(row);
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function sortPaymentRows(
  rows: PaymentRow[],
  sortBy: PaymentSortOption,
) {
  return [...rows].sort((a, b) => {
    if (sortBy === "OLDEST") {
      return getPaymentTimestamp(a) - getPaymentTimestamp(b);
    }

    if (sortBy === "AMOUNT_HIGH") {
      return b.payment.amount - a.payment.amount;
    }

    if (sortBy === "AMOUNT_LOW") {
      return a.payment.amount - b.payment.amount;
    }

    if (sortBy === "STATUS") {
      const statusDiff =
        STATUS_ORDER[a.payment.status] - STATUS_ORDER[b.payment.status];

      if (statusDiff !== 0) return statusDiff;

      return getPaymentTimestamp(b) - getPaymentTimestamp(a);
    }

    return getPaymentTimestamp(b) - getPaymentTimestamp(a);
  });
}
