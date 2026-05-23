import type { PaymentStatus, Project, ProjectPayment } from "@/lib/types";
import { getPackageTitle } from "../../packageCatalog";

export type PaymentRow = {
  payment: ProjectPayment;
  project: Project;
};

export type PaymentStatusFilter = "ALL" | PaymentStatus;

export const STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PENDING_CONFIRMATION: "Awaiting Confirmation",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
};

export const STATUS_ORDER: Record<PaymentStatus, number> = {
  UNPAID: 0,
  REJECTED: 1,
  PENDING_CONFIRMATION: 2,
  CONFIRMED: 3,
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

export function paymentTypeLabel(type: ProjectPayment["type"]) {
  return type === "DEPOSIT" ? "Deposit Payment" : "Balance Payment";
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
