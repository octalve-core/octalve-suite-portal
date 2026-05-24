import type React from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  FileText,
  ReceiptText,
  UserRound,
  WalletCards,
} from "lucide-react";

import type { Project, ProjectPayment } from "@/lib/types";
import { getPackageTitle } from "../../../packageCatalog";
import {
  formatPaymentDate,
  formatPaymentDateTime,
  formatPaymentMoney,
  paymentTypeLabel,
  providerLabel,
  shortReference,
} from "./client-payment-detail-utils";
import { ClientPaymentStatusChip } from "./ClientPaymentDetailHero";

function SummaryItem({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-[#0064E0] ring-1 ring-blue-100">
          {icon}
        </span>

        <div className="min-w-0">
          <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </span>
          <strong className="mt-1 block break-words text-sm font-semibold leading-6 text-slate-950">
            {value}
          </strong>
          {helper ? (
            <span className="mt-1 block break-words text-xs font-semibold leading-5 text-slate-500">
              {helper}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ClientPaymentSummaryPanel({
  payment,
  project,
}: {
  payment: ProjectPayment;
  project: Project;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)] sm:p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
          Payment Summary
        </h2>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
          Project payment record, amount, status and related references.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryItem
          label="Project"
          value={project.title}
          helper={`${project.businessName} - ${project.projectCode}`}
          icon={<BriefcaseBusiness size={18} />}
        />

        <SummaryItem
          label="Client"
          value={project.clientEmail}
          helper="Payment owner"
          icon={<UserRound size={18} />}
        />

        <SummaryItem
          label="Payment Type"
          value={paymentTypeLabel(payment.type)}
          helper={getPackageTitle(project.packageType)}
          icon={<ReceiptText size={18} />}
        />

        <SummaryItem
          label="Amount"
          value={formatPaymentMoney(payment.amount)}
          helper={`Project total: ${formatPaymentMoney(project.totalAmount)}`}
          icon={<CreditCard size={18} />}
        />

        <SummaryItem
          label="Status"
          value={<ClientPaymentStatusChip status={payment.status} />}
          helper={
            payment.confirmedAt
              ? `Confirmed ${formatPaymentDate(payment.confirmedAt)}`
              : "Current payment state"
          }
          icon={<WalletCards size={18} />}
        />

        <SummaryItem
          label="Reference"
          value={shortReference(payment.reference)}
          helper={payment.reference}
          icon={<FileText size={18} />}
        />

        <SummaryItem
          label="Provider"
          value={providerLabel(String(payment.provider ?? ""))}
          helper={payment.paidVia || "Not set"}
          icon={<CreditCard size={18} />}
        />

        <SummaryItem
          label="Provider Reference"
          value={
            payment.providerReference
              ? shortReference(payment.providerReference)
              : "Not set"
          }
          helper={payment.gatewayReference || undefined}
          icon={<FileText size={18} />}
        />

        <SummaryItem
          label="Last Confirmation"
          value={formatPaymentDateTime(payment.confirmedAt)}
          helper={
            payment.confirmedSource
              ? providerLabel(String(payment.confirmedSource))
              : undefined
          }
          icon={<CalendarDays size={18} />}
        />
      </div>

      {payment.note ? (
        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold leading-6 text-orange-800">
          {payment.note}
        </div>
      ) : null}
    </section>
  );
}