import { CreditCard, Clock3 } from "lucide-react";
import type { PaymentBlock } from "./client-dashboard-utils";
import {
  getBadgeClasses,
  getToneForStatus,
  statusLabel,
} from "./client-dashboard-utils";

export function ClientPaymentNotice({
  block,
  onPay,
}: {
  block: PaymentBlock;
  onPay: (paymentId: string) => void;
}) {
  const isUnpaid = block.payment.status === "UNPAID";

  return (
    <section className="rounded-[28px] border border-orange-200 bg-orange-50 p-5 shadow-[0_16px_38px_rgba(251,146,60,0.08)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-orange-700 ring-1 ring-orange-100">
            {isUnpaid ? <CreditCard size={21} /> : <Clock3 size={21} />}
          </span>

          <div className="min-w-0">
            <span
              className={[
                "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                getBadgeClasses(getToneForStatus(block.payment.status)),
              ].join(" ")}
            >
              {statusLabel(block.payment.status)}
            </span>

            <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-950">
              {block.title}
            </h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
              {block.body}
            </p>
          </div>
        </div>

        {isUnpaid ? (
          <button
            type="button"
            onClick={() => onPay(block.payment.id)}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(0,100,224,0.22)] transition hover:bg-[#0052B8]"
          >
            Make Payment
          </button>
        ) : (
          <span className="inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700">
            Awaiting confirmation
          </span>
        )}
      </div>
    </section>
  );
}
