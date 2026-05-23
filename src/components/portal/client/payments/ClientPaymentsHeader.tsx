import { ClientPaymentStatusChip } from "./ClientPaymentStatusChip";

export function ClientPaymentsHeader() {
  return (
    <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 sm:p-8">
        <div className="absolute -right-20 -top-28 h-64 w-64 rounded-full bg-[#0064E0]/10 blur-2xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.34em] text-[#0064E0]">
              Billing
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Payments
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-[15px]">
              Track deposit, balance, payment reference and confirmation status from one clear place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ClientPaymentStatusChip status="UNPAID" />
            <ClientPaymentStatusChip status="PENDING_CONFIRMATION" />
            <ClientPaymentStatusChip status="CONFIRMED" />
          </div>
        </div>
      </div>
    </section>
  );
}
