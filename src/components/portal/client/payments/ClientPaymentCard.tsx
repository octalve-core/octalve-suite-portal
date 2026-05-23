import { ArrowRight, MoreVertical, WalletCards } from "lucide-react";
import type { PaymentRow } from "./client-payments-utils";
import {
  formatPaymentDate,
  formatPaymentMoney,
  getPaymentDateValue,
  paymentActionLabel,
  paymentTypeLabel,
  STATUS_ICON_CLASSES,
} from "./client-payments-utils";
import { ClientPaymentStatusChip } from "./ClientPaymentStatusChip";

export function ClientPaymentCard({
  row,
  onOpenPayment,
}: {
  row: PaymentRow;
  onOpenPayment: (row: PaymentRow) => void;
}) {
  const { payment, project } = row;

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        <span
          className={[
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1",
            STATUS_ICON_CLASSES[payment.status],
          ].join(" ")}
        >
          <WalletCards size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold tracking-[-0.035em] text-slate-950">
                {paymentTypeLabel(payment.type)}
              </h3>
              <p className="mt-1 truncate text-sm font-medium text-slate-500">
                {project.title}
              </p>
            </div>

            <button
              type="button"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              aria-label="More payment options"
            >
              <MoreVertical size={17} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Amount
              </span>
              <strong className="mt-1 block text-sm text-slate-950">
                {formatPaymentMoney(payment.amount)}
              </strong>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Date
              </span>
              <strong className="mt-1 block text-sm text-slate-950">
                {formatPaymentDate(getPaymentDateValue(row))}
              </strong>
            </div>

            <div className="col-span-2">
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Reference
              </span>
              <strong className="mt-1 block break-all text-sm text-slate-950">
                {payment.reference}
              </strong>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
            <ClientPaymentStatusChip status={payment.status} />

            <button
              type="button"
              onClick={() => onOpenPayment(row)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 text-sm font-semibold text-[#0064E0] transition hover:bg-blue-50"
            >
              {paymentActionLabel(payment.status)}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
