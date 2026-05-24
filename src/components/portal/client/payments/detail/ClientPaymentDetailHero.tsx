import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  XCircle,
} from "lucide-react";

import type { PaymentStatus, Project, ProjectPayment } from "@/lib/types";
import { getPackageTitle } from "../../../packageCatalog";
import {
  PAYMENT_STATUS_ICON_TONE,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONE,
  formatPaymentMoney,
  paymentTypeLabel,
} from "./client-payment-detail-utils";

function StatusIcon({ status }: { status: PaymentStatus }) {
  if (status === "CONFIRMED") return <CheckCircle2 size={23} />;
  if (status === "REJECTED") return <XCircle size={23} />;
  if (status === "PENDING_CONFIRMATION") return <Clock3 size={23} />;

  return <CreditCard size={23} />;
}

export function ClientPaymentStatusChip({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
        PAYMENT_STATUS_TONE[status],
      ].join(" ")}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function ClientPaymentDetailHero({
  payment,
  project,
}: {
  payment: ProjectPayment;
  project: Project;
}) {
  return (
    <section>
      <Link
        href="/client/payments"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#0064E0]"
      >
        <ArrowLeft size={17} />
        Back to Payments
      </Link>

      <div className="mt-6 overflow-hidden rounded-[28px] bg-[#0064E0] text-white shadow-[0_22px_60px_rgba(0,100,224,0.22)]">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_34%),linear-gradient(135deg,#003C9A_0%,#0064E0_45%,#0045B8_100%)]" />
          <div className="absolute right-[-90px] top-[-100px] h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ClientPaymentStatusChip status={payment.status} />
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                  {getPackageTitle(project.packageType)}
                </span>
              </div>

              <div className="mt-6 flex items-start gap-4">
                <span
                  className={[
                    "grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white text-[#0064E0] ring-1",
                    PAYMENT_STATUS_ICON_TONE[payment.status],
                  ].join(" ")}
                >
                  <StatusIcon status={payment.status} />
                </span>

                <div className="min-w-0">
                  <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.065em] sm:text-[46px]">
                    {paymentTypeLabel(payment.type)}
                  </h1>
                  <p className="mt-2 max-w-3xl truncate text-sm font-medium leading-7 text-white/75 sm:text-[15px]">
                    {project.title} - {project.projectCode}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 text-left backdrop-blur lg:min-w-[260px] lg:text-right">
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-white/60">
                Amount Due
              </span>
              <strong className="mt-2 block text-3xl font-semibold tracking-[-0.055em]">
                {formatPaymentMoney(payment.amount)}
              </strong>
              <span className="mt-2 block break-all text-xs font-semibold text-white/65">
                {payment.reference}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}