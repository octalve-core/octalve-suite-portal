"use client";

import { useState } from "react";
import { resolvePaymentBankDetails } from "@/lib/payment-bank";
import type { Project } from "@/lib/types";
import { useApp } from "../../AppContext";
import { formatNaira } from "../dashboard/client-dashboard-utils";
import { ClientModalShell } from "./ClientModalShell";
import { ClientPaymentCopyRow } from "./ClientPaymentCopyRow";

export function ClientManualPaymentModal({
  project,
  paymentId,
  onClose,
}: {
  project: Project;
  paymentId: string;
  onClose: () => void;
}) {
  const { markPaymentPaid } = useApp();
  const [loading, setLoading] = useState(false);

  const payment = project.payments.find((item) => item.id === paymentId);

  if (!payment) return null;

  const bank = resolvePaymentBankDetails(payment);

  return (
    <ClientModalShell
      title={`${payment.type === "DEPOSIT" ? "Deposit" : "Balance"} Payment`}
      onClose={onClose}
    >
      <div className="grid gap-5">
        <p className="m-0 text-sm font-medium leading-6 text-slate-600">
          Please make a bank transfer using the details below. After payment,
          click <strong>I have paid</strong>. Octalve will confirm it securely
          before unlocking the next step.
        </p>

        <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-2 rounded-2xl bg-[#0064E0] p-4 text-white sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
              Amount
            </span>
            <strong className="text-2xl font-semibold tracking-[-0.04em]">
              {formatNaira(payment.amount)}
            </strong>
          </div>

          <ClientPaymentCopyRow label="Bank Name" value={bank.bankName} />
          <ClientPaymentCopyRow label="Account Name" value={bank.accountName} />
          <ClientPaymentCopyRow label="Account Number" value={bank.accountNumber} />
          <ClientPaymentCopyRow label="Reference" value={payment.reference} />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);

              try {
                await markPaymentPaid(payment.id);
                onClose();
              } finally {
                setLoading(false);
              }
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(0,100,224,0.22)] transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting..." : "I have paid"}
          </button>
        </div>
      </div>
    </ClientModalShell>
  );
}
