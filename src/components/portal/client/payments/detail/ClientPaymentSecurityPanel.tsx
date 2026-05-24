import Link from "next/link";
import {
  BriefcaseBusiness,
  FileText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import type { Project, ProjectPayment } from "@/lib/types";
import {
  formatPaymentMoney,
  paymentTypeLabel,
} from "./client-payment-detail-utils";

export function ClientPaymentSecurityPanel({
  payment,
  project,
}: {
  payment: ProjectPayment;
  project: Project;
}) {
  return (
    <aside className="grid gap-4 self-start">
      <section className="rounded-[24px] border border-blue-100 bg-blue-50 p-5 shadow-[0_14px_34px_rgba(0,100,224,0.06)]">
        <div className="flex items-start gap-3">
          <ShieldCheck size={21} className="mt-0.5 shrink-0 text-[#0064E0]" />
          <div>
            <strong className="block text-sm font-bold text-blue-950">
              Secure payment handling
            </strong>
            <p className="mt-1 text-sm font-medium leading-6 text-blue-800">
              Checkout and wallet payment are initialized by the backend only. This page does not expose secret keys, confirm payments directly, or store payment data in browser storage.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
          Payment Tools
        </h2>

        <div className="mt-4 grid gap-2">
          <Link
            href={`/client/projects/${project.id}`}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
              <BriefcaseBusiness size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm text-slate-950">
                Open Project
              </strong>
              <small className="mt-1 block truncate text-xs font-semibold text-slate-500">
                View project phases and details
              </small>
            </span>
          </Link>

          <Link
            href="/client/payments"
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
              <WalletCards size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm text-slate-950">
                All Payments
              </strong>
              <small className="mt-1 block truncate text-xs font-semibold text-slate-500">
                Return to payment records
              </small>
            </span>
          </Link>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
            <FileText size={18} />
          </span>

          <div>
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
              Payment Instruction
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              This is a {paymentTypeLabel(payment.type).toLowerCase()} of{" "}
              <strong className="text-slate-950">{formatPaymentMoney(payment.amount)}</strong>.
              Use the exact reference when paying by bank transfer. Online and wallet payments are completed through secure server verification.
            </p>
          </div>
        </div>
      </section>
    </aside>
  );
}
