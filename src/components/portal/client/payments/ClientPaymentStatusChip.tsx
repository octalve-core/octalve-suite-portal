import type { PaymentStatus } from "@/lib/types";
import { STATUS_CHIP_CLASSES, STATUS_LABELS } from "./client-payments-utils";

export function ClientPaymentStatusChip({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
        STATUS_CHIP_CLASSES[status],
      ].join(" ")}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
