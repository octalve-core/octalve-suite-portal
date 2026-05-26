"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { useApp } from "../../AppContext";
import { ClientManualPaymentModal } from "../shared/ClientManualPaymentModal";
import { ClientPaymentFilters } from "./ClientPaymentFilters";
import { ClientPaymentList } from "./ClientPaymentList";
import { ClientPaymentStats } from "./ClientPaymentStats";
import { ClientPaymentsHeader } from "./ClientPaymentsHeader";
import type {
  PaymentRow,
  PaymentSortOption,
  PaymentStatusFilter,
} from "./client-payments-utils";
import {
  rowMatchesSearch,
  sortPaymentRows,
  STATUS_ORDER,
} from "./client-payments-utils";

export function ClientPaymentsView({
  initialPaymentId,
}: {
  initialPaymentId?: string;
} = {}) {
  const { clientProjects, selectedProject } = useApp();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("ALL");
  const [projectFilter, setProjectFilter] = useState(selectedProject?.id ?? "ALL");
  const [sortBy, setSortBy] = useState<PaymentSortOption>("NEWEST");
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
    setActivePayment({
      project: row.project,
      paymentId: row.payment.id,
    });
  }, [initialPaymentId, rows]);

  const filteredRows = useMemo(() => {
    const filtered = rows
      .filter((row) =>
        statusFilter === "ALL" ? true : row.payment.status === statusFilter,
      )
      .filter((row) =>
        projectFilter === "ALL" ? true : row.project.id === projectFilter,
      )
      .filter((row) => rowMatchesSearch(row, query));

    return sortPaymentRows(filtered, sortBy);
  }, [projectFilter, query, rows, sortBy, statusFilter]);

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-5">
        <ClientPaymentsHeader />

        <ClientPaymentStats rows={rows} />

        <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
          <div className="p-4 sm:p-5">
            <ClientPaymentFilters
              query={query}
              setQuery={setQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              projectFilter={projectFilter}
              setProjectFilter={setProjectFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              projects={clientProjects}
            />
          </div>

          <ClientPaymentList
            rows={filteredRows}
            onOpenPayment={(row) =>
              setActivePayment({
                project: row.project,
                paymentId: row.payment.id,
              })
            }
          />
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
