"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoreVertical,
  WalletCards,
  X,
} from "lucide-react";

import type { PaymentStatus } from "@/lib/types";
import type { PaymentRow } from "./client-payments-utils";
import {
  formatPaymentDate,
  formatPaymentMoney,
  formatPaymentTime,
  getPaymentDateValue,
  paymentActionLabel,
  paymentTypeLabel,
  STATUS_ICON_CLASSES,
} from "./client-payments-utils";
import { ClientPaymentCard } from "./ClientPaymentCard";
import { ClientPaymentStatusChip } from "./ClientPaymentStatusChip";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function PaymentStatusIcon({ status }: { status: PaymentStatus }) {
  const icon =
    status === "UNPAID" ? (
      <ArrowDown size={16} />
    ) : status === "PENDING_CONFIRMATION" ? (
      <Clock3 size={16} />
    ) : status === "CONFIRMED" ? (
      <Check size={16} />
    ) : (
      <X size={16} />
    );

  return (
    <span
      className={[
        "grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1",
        STATUS_ICON_CLASSES[status],
      ].join(" ")}
    >
      {icon}
    </span>
  );
}

function actionButtonClass(status: PaymentStatus) {
  if (status === "UNPAID") {
    return "border-blue-300 text-[#0064E0] hover:bg-blue-50";
  }

  if (status === "CONFIRMED") {
    return "border-slate-200 text-[#0064E0] hover:border-blue-200 hover:bg-blue-50";
  }

  if (status === "REJECTED") {
    return "border-red-100 text-[#0064E0] hover:border-blue-200 hover:bg-blue-50";
  }

  return "border-slate-200 text-[#0064E0] hover:border-blue-200 hover:bg-blue-50";
}

export function ClientPaymentList({
  rows,
  onOpenPayment,
}: {
  rows: PaymentRow[];
  onOpenPayment: (row: PaymentRow) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows, pageSize]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, rows.length);

  const pagedRows = useMemo(() => {
    return rows.slice(startIndex, endIndex);
  }, [endIndex, rows, startIndex]);

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
          <WalletCards size={24} />
        </div>
        <h3 className="mt-4 text-lg font-medium tracking-[-0.035em] text-slate-900">
          No matching payments
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Adjust your filters or search term. Payment details will appear once a project has a payment structure.
        </p>
      </div>
    );
  }

  function goPrevious() {
    setCurrentPage((page) => Math.max(1, page - 1));
  }

  function goNext() {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1040px] border-collapse text-left">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50/60 text-[11px] font-medium uppercase tracking-[0.09em] text-slate-400">
              <th className="px-4 py-4">Payment Type</th>
              <th className="px-4 py-4">Project</th>
              <th className="px-4 py-4">Amount</th>
              <th className="px-4 py-4">Reference</th>
              <th className="px-4 py-4">Created Date</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4 text-center">Action</th>
              <th className="w-10 px-2 py-4" />
            </tr>
          </thead>

          <tbody>
            {pagedRows.map((row) => {
              const { payment, project } = row;
              const dateValue = getPaymentDateValue(row);

              return (
                <tr
                  key={payment.id}
                  className="border-b border-slate-200 bg-white text-sm transition hover:bg-slate-50/70"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <PaymentStatusIcon status={payment.status} />
                      <span className="font-semibold text-slate-800">
                        {paymentTypeLabel(payment.type)}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <strong className="block max-w-[220px] truncate text-sm font-medium text-slate-700">
                      {project.title}
                    </strong>
                    <span className="mt-1 block text-xs font-medium text-slate-500">
                      {project.projectCode}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-medium text-slate-700">
                    {formatPaymentMoney(payment.amount)}
                  </td>

                  <td className="px-4 py-4">
                    <span className="block max-w-[180px] truncate font-medium text-slate-600">
                      {payment.reference}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <strong className="block text-sm font-medium text-slate-700">
                      {formatPaymentDate(dateValue)}
                    </strong>
                    <span className="mt-1 block text-xs font-medium text-slate-500">
                      {formatPaymentTime(dateValue)}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <ClientPaymentStatusChip status={payment.status} />
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => onOpenPayment(row)}
                      className={[
                        "inline-flex min-h-10 items-center justify-center rounded-xl border bg-white px-4 text-sm font-semibold transition",
                        actionButtonClass(payment.status),
                      ].join(" ")}
                    >
                      {paymentActionLabel(payment.status)}
                    </button>
                  </td>

                  <td className="px-2 py-4">
                    <Link
                      href={`/client/payments/${payment.id}`}
                      className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-[#0064E0]"
                      aria-label={`Open payment details for ${payment.reference}`}
                      title="Open payment details"
                    >
                      <MoreVertical size={17} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {startIndex + 1} to {endIndex} of {rows.length} payments
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={goPrevious}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0] disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:border-slate-200 disabled:hover:bg-white"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="grid h-9 min-w-9 place-items-center rounded-xl bg-[#0064E0] px-3 text-white">
              {safeCurrentPage}
            </span>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={goNext}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0] disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:border-slate-200 disabled:hover:bg-white"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>

            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="ml-3 h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-500 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
              aria-label="Payments per page"
            >
              {PAGE_SIZE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value} / page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:hidden">
        {pagedRows.map((row) => (
          <ClientPaymentCard
            key={row.payment.id}
            row={row}
            onOpenPayment={onOpenPayment}
          />
        ))}

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-500">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={goPrevious}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:text-slate-300"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          <span>
            Page {safeCurrentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={goNext}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:text-slate-300"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
