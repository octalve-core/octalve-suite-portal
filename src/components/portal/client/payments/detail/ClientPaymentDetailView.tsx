"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CreditCard } from "lucide-react";

import { useApp } from "../../../AppContext";
import { ClientManualPaymentModal } from "../../shared/ClientManualPaymentModal";
import { ClientPaymentDetailHero } from "./ClientPaymentDetailHero";
import { ClientPaymentSecurityPanel } from "./ClientPaymentSecurityPanel";
import { ClientPaymentSummaryPanel } from "./ClientPaymentSummaryPanel";

function PaymentNotFound() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/client/payments"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#0064E0]"
      >
        <ArrowLeft size={17} />
        Back to Payments
      </Link>

      <section className="mt-6 grid min-h-80 place-items-center rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
        <div>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
            <CreditCard size={24} />
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
            Payment not found
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            This payment may have been removed, or it may not belong to your workspace.
          </p>

          <Link
            href="/client/payments"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white"
          >
            Open Payments
          </Link>
        </div>
      </section>
    </main>
  );
}

export function ClientPaymentDetailView({
  paymentId,
}: {
  paymentId: string;
}) {
  const { clientProjects, setSelectedProjectId } = useApp();
  const [openPaymentId, setOpenPaymentId] = useState<string | null>(null);

  const row = useMemo(() => {
    for (const project of clientProjects) {
      const payment = project.payments.find((item) => item.id === paymentId);

      if (payment) {
        return {
          project,
          payment,
        };
      }
    }

    return null;
  }, [clientProjects, paymentId]);

  useEffect(() => {
    if (row?.project.id) {
      setSelectedProjectId(row.project.id);
    }
  }, [row?.project.id, setSelectedProjectId]);

  if (!row) {
    return <PaymentNotFound />;
  }

  const { project, payment } = row;
  const canPayNow = payment.status === "UNPAID";

  return (
    <>
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5">
          <ClientPaymentDetailHero
            payment={payment}
            project={project}
            onPayNow={canPayNow ? () => setOpenPaymentId(payment.id) : undefined}
          />

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="grid gap-5">
              <ClientPaymentSummaryPanel payment={payment} project={project} />
            </div>

            <ClientPaymentSecurityPanel
              payment={payment}
              project={project}
              onPayNow={canPayNow ? () => setOpenPaymentId(payment.id) : undefined}
            />
          </section>
        </div>
      </main>

      {openPaymentId ? (
        <ClientManualPaymentModal
          project={project}
          paymentId={openPaymentId}
          onClose={() => setOpenPaymentId(null)}
        />
      ) : null}
    </>
  );
}
