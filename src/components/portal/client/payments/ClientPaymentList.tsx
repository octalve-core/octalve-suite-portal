import { WalletCards } from "lucide-react";
import type { PaymentRow } from "./client-payments-utils";
import { ClientPaymentCard } from "./ClientPaymentCard";

export function ClientPaymentList({
  rows,
  onMakePayment,
}: {
  rows: PaymentRow[];
  onMakePayment: (row: PaymentRow) => void;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
          <WalletCards size={24} />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950">
          No matching payments
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Adjust your filters or search term. Payment details will appear once a project has a payment structure.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {rows.map((row) => (
        <ClientPaymentCard
          key={row.payment.id}
          row={row}
          onMakePayment={onMakePayment}
        />
      ))}
    </div>
  );
}
