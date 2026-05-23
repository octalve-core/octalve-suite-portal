import { ArrowRight, WalletCards } from "lucide-react";
import { getPackageTitle } from "../../packageCatalog";
import type { PaymentRow } from "./client-payments-utils";
import {
  formatPaymentDate,
  formatPaymentMoney,
  paymentTypeLabel,
  STATUS_ICON_CLASSES,
} from "./client-payments-utils";
import { ClientPaymentStatusChip } from "./ClientPaymentStatusChip";

export function ClientPaymentCard({
  row,
  onMakePayment,
}: {
  row: PaymentRow;
  onMakePayment: (row: PaymentRow) => void;
}) {
  const { payment, project } = row;
  const canPay = payment.status === "UNPAID";

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(0,100,224,0.10)]">
      <div className="flex items-start gap-4">
        <span
          className={[
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1",
            STATUS_ICON_CLASSES[payment.status],
          ].join(" ")}
        >
          <WalletCards size={21} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
                {paymentTypeLabel(payment.type)}
              </h3>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                {project.title} · {project.projectCode}
              </p>
            </div>

            <ClientPaymentStatusChip status={payment.status} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Amount
              </span>
              <strong className="mt-1 block truncate text-sm text-slate-800">
                {formatPaymentMoney(payment.amount)}
              </strong>
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Package
              </span>
              <strong className="mt-1 block truncate text-sm text-slate-800">
                {getPackageTitle(project.packageType)}
              </strong>
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Reference
              </span>
              <strong className="mt-1 block truncate text-sm text-slate-800">
                {payment.reference}
              </strong>
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Confirmed
              </span>
              <strong className="mt-1 block truncate text-sm text-slate-800">
                {formatPaymentDate(payment.confirmedAt)}
              </strong>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold text-slate-500">
              {canPay
                ? "Payment action required"
                : payment.status === "PENDING_CONFIRMATION"
                  ? "Awaiting Octalve confirmation"
                  : "No payment action required"}
            </span>

            {canPay ? (
              <button
                type="button"
                onClick={() => onMakePayment(row)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,100,224,0.18)] transition hover:bg-[#0052B8]"
              >
                Make Payment
                <ArrowRight size={17} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
