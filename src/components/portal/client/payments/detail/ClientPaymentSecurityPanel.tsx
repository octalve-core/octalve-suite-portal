import Link from "next/link";
import {
  ArrowRight,
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
  onPayNow,
}: {
  payment: ProjectPayment;
  project: Project;
  onPayNow?: () => void;
}) {
  return (
    <aside className="grid gap-4 self-start">
      {onPayNow ? (
        <button
          type="button"
          onClick={onPayNow}
          className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:bg-[#0052B8]"
        >
          Pay Now
          <ArrowRight size={17} />
        </button>
      ) : null}

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
        <h2 className="text-xl font-medium tracking-[-0.035em] text-slate-900">
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
              <small className="mt-1 block truncate text-xs font-medium text-slate-500">
                View phases and details
              </small>
            </span>
            <ArrowRight size={16} className="text-slate-400" />
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
              <small className="mt-1 block truncate text-xs font-medium text-slate-500">
                View payment history
              </small>
            </span>
            <ArrowRight size={16} className="text-slate-400" />
          </Link>
        </div>
      </section>

      <section className="rounded-[24px] border border-blue-100 bg-blue-50 p-5 shadow-[0_14px_34px_rgba(0,100,224,0.06)]">
        <div className="flex items-start gap-3">
          <ShieldCheck size={21} className="mt-0.5 shrink-0 text-[#0064E0]" />
          <div>
            <strong className="block text-sm font-bold text-blue-950">
              Secure Payment
            </strong>
            <p className="mt-1 text-sm font-medium leading-6 text-blue-800">
              Your payment is processed securely through Octalve approved payment channels.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
            <FileText size={18} />
          </span>

          <div>
            <h2 className="text-xl font-medium tracking-[-0.035em] text-slate-900">
              Payment Instruction
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              This is a {paymentTypeLabel(payment.type).toLowerCase()} of{" "}
              <strong className="text-slate-950">{formatPaymentMoney(payment.amount)}</strong>.
              Use the exact payment reference when making bank transfer.
            </p>
          </div>
        </div>
      </section>
    </aside>
  );
}