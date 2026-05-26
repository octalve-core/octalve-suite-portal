import Link from "next/link";
import { CreditCard, ShieldAlert, WalletCards } from "lucide-react";

import type { PaymentBlock } from "./client-dashboard-utils";

export function ClientPaymentNotice({
  block,
  onPay,
}: {
  block: PaymentBlock;
  onPay: (paymentId: string) => void;
}) {
  const isUnpaid = block.payment.status === "UNPAID";

  return (
    <section className="rounded-[18px] border border-orange-200 bg-orange-50/70 px-4 py-3 shadow-none">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-orange-700 ring-1 ring-orange-100">
            <ShieldAlert size={18} />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-orange-200 bg-white px-3 py-1 text-[11px] font-black text-orange-700">
                {isUnpaid ? "Unpaid" : "Pending"}
              </span>

              <h2 className="text-sm font-semibold tracking-[-0.025em] text-slate-950">
                {block.title}
              </h2>
            </div>

            <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-5 text-slate-600">
              {block.body}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {isUnpaid ? (
            <button
              type="button"
              onClick={() => onPay(block.payment.id)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0064E0] px-5 text-sm font-bold text-white transition hover:bg-[#0052B8]"
            >
              <CreditCard size={15} />
              Pay Now
            </button>
          ) : (
            <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-orange-200 bg-white px-5 text-sm font-bold text-orange-700">
              Awaiting Confirmation
            </span>
          )}

          <Link
            href="/client/wallet"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0]"
          >
            <WalletCards size={15} />
            Open Wallet
          </Link>
        </div>
      </div>
    </section>
  );
}