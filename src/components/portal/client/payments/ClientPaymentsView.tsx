"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { useApp } from "../../AppContext";
import { ClientManualPaymentModal } from "../shared/ClientManualPaymentModal";
import { ClientPaymentFilters } from "./ClientPaymentFilters";
import { ClientPaymentList } from "./ClientPaymentList";
import { ClientPaymentStats } from "./ClientPaymentStats";
import { ClientPaymentsHeader } from "./ClientPaymentsHeader";
import type { PaymentRow, PaymentStatusFilter } from "./client-payments-utils";
import { rowMatchesSearch, STATUS_ORDER } from "./client-payments-utils";

export function ClientPaymentsView({ initialPaymentId }: { initialPaymentId?: string } = {}) {
  const { clientProjects, selectedProject } = useApp();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("ALL");
  const [projectFilter, setProjectFilter] = useState(selectedProject?.id ?? "ALL");
  const [activePayment, setActivePayment] = useState<{
    project: Project;
    paymentId: string;
  } | null>(null);

  const rows = useMemo<PaymentRow[]>(() => {
    return clientProjects
      .flatMap((project) =>
        project.payments.map((payment) => ({
          payment,
          project,
        })),
      )
      .sort((a, b) => {
        const statusDiff =
          STATUS_ORDER[a.payment.status] - STATUS_ORDER[b.payment.status];

        if (statusDiff !== 0) return statusDiff;

        return a.project.title.localeCompare(b.project.title);
      });
  }, [clientProjects]);

  const openedInitialPaymentRef = useRef(false);

  useEffect(() => {
    if (!initialPaymentId || openedInitialPaymentRef.current) return;

    const row = rows.find((item) => item.payment.id === initialPaymentId);

    if (!row) return;

    openedInitialPaymentRef.current = true;

    if (row.payment.status === "UNPAID") {
      setActivePayment({
        project: row.project,
        paymentId: row.payment.id,
      });
    }
  }, [initialPaymentId, rows]);

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) =>
        statusFilter === "ALL" ? true : row.payment.status === statusFilter,
      )
      .filter((row) =>
        projectFilter === "ALL" ? true : row.project.id === projectFilter,
      )
      .filter((row) => rowMatchesSearch(row, query));
  }, [projectFilter, query, rows, statusFilter]);

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6">
        <ClientPaymentsHeader />

        <ClientPaymentStats rows={rows} />

        <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                  Payment Schedule
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Open unpaid records to use enabled payment methods securely.
                </p>
              </div>

              <ClientPaymentFilters
                query={query}
                setQuery={setQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                projectFilter={projectFilter}
                setProjectFilter={setProjectFilter}
                projects={clientProjects}
              />
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <ClientPaymentList
              rows={filteredRows}
              onMakePayment={(row) =>
                setActivePayment({
                  project: row.project,
                  paymentId: row.payment.id,
                })
              }
            />
          </div>
        </section>
      </div>

      {activePayment ? (
        <ClientManualPaymentModal
          project={activePayment.project}
          paymentId={activePayment.paymentId}
          onClose={() => setActivePayment(null)}
        />
      ) : null}
    </main>
  );
}
