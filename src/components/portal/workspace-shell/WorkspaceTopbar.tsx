"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  CreditCard,
  Search,
  Settings2,
  X,
} from "lucide-react";

import type { ProjectPayment, Role } from "@/lib/types";
import { NotificationBell } from "../NotificationBell";
import { paymentsHref, roleEyebrow, settingsHref } from "./workspace-shell-utils";
import { WorkspaceUserAvatar } from "./WorkspaceUserAvatar";

export type WorkspaceTopbarPaymentAlert = {
  id: string;
  projectTitle: string;
  businessName: string;
  type: ProjectPayment["type"];
  status: ProjectPayment["status"];
  amount: number;
  href: string;
};

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function formatNaira(value: number) {
  return currencyFormatter.format(value);
}

function paymentTypeLabel(type: ProjectPayment["type"]) {
  return type === "DEPOSIT" ? "Deposit" : "Balance";
}

function paymentStatusLabel(status: ProjectPayment["status"]) {
  if (status === "UNPAID") return "Unpaid";
  if (status === "PENDING_CONFIRMATION") return "Awaiting confirmation";
  if (status === "CONFIRMED") return "Confirmed";
  return "Rejected";
}

export function WorkspaceTopbar({
  role,
  userName,
  pendingTotal,
  paymentsCount,
  paymentAlerts,
}: {
  role: Role;
  userName: string;
  pendingTotal: number;
  paymentsCount: number;
  paymentAlerts: WorkspaceTopbarPaymentAlert[];
}) {
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const paymentsWrapRef = useRef<HTMLDivElement | null>(null);

  const paymentSummary = useMemo(() => {
    const unpaid = paymentAlerts.filter((item) => item.status === "UNPAID");
    const pending = paymentAlerts.filter(
      (item) => item.status === "PENDING_CONFIRMATION",
    );

    return {
      unpaidCount: unpaid.length,
      pendingCount: pending.length,
      totalAmount: paymentAlerts.reduce((total, item) => total + item.amount, 0),
    };
  }, [paymentAlerts]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!paymentsWrapRef.current) return;

      if (!paymentsWrapRef.current.contains(event.target as Node)) {
        setPaymentsOpen(false);
      }
    }

    document.addEventListener("mousedown", onClick);

    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
      <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden h-12 w-full max-w-[360px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:flex">
            <Search size={19} className="text-[#334a7d]" />
            <input
              type="search"
              placeholder="Search workspace..."
              className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-[#526899]"
            />
            <kbd className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500 md:inline-flex">
              ? K
            </kbd>
          </div>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-[#334a7d] shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:hidden"
            aria-label="Search workspace"
          >
            <Search size={19} />
          </button>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          <div className="relative">
            <NotificationBell />
          </div>

          <div className="relative hidden md:inline-flex" ref={paymentsWrapRef}>
            <button
              type="button"
              onClick={() => setPaymentsOpen((value) => !value)}
              aria-expanded={paymentsOpen}
              aria-label={`${paymentsCount} pending payment records`}
              className={[
                "min-h-12 items-center gap-2 rounded-2xl border px-4 text-sm font-medium shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition md:inline-flex",
                paymentsCount > 0
                  ? "border-blue-200 bg-blue-50 text-[#0064E0]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-[#0064E0]",
              ].join(" ")}
            >
              <CreditCard size={18} className="text-[#0064E0]" />
              <span>Payments</span>
              {paymentsCount > 0 ? (
                <em className="grid min-w-5 place-items-center rounded-full bg-[#0064E0] px-1.5 py-0.5 text-[10px] font-bold not-italic text-white">
                  {paymentsCount > 9 ? "9+" : paymentsCount}
                </em>
              ) : null}
              <ChevronDown
                size={15}
                className={[
                  "transition",
                  paymentsOpen ? "rotate-180" : "rotate-0",
                ].join(" ")}
              />
            </button>

            {paymentsOpen ? (
              <section
                aria-label="Pending payment summary"
                className="absolute right-0 top-[calc(100%+12px)] z-90 w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]"
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                  <div>
                    <strong className="block text-base font-medium tracking-[-0.03em] text-slate-900">
                      Pending payments
                    </strong>
                    <span className="mt-1 block text-xs font-medium text-slate-500">
                      {paymentsCount} record{paymentsCount === 1 ? "" : "s"} need attention
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPaymentsOpen(false)}
                    aria-label="Close pending payment summary"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-[#E61525]"
                  >
                    <X size={16} strokeWidth={2.25} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <span className="block text-[9px] font-medium uppercase tracking-[0.09em] text-slate-400">
                      Unpaid
                    </span>
                    <strong className="mt-1 block text-lg font-medium text-slate-800">
                      {paymentSummary.unpaidCount}
                    </strong>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <span className="block text-[9px] font-medium uppercase tracking-[0.09em] text-slate-400">
                      Pending
                    </span>
                    <strong className="mt-1 block text-lg font-medium text-slate-800">
                      {paymentSummary.pendingCount}
                    </strong>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <span className="block text-[9px] font-medium uppercase tracking-[0.09em] text-slate-400">
                      Value
                    </span>
                    <strong className="mt-1 block truncate text-lg font-medium text-slate-800">
                      {formatNaira(paymentSummary.totalAmount)}
                    </strong>
                  </div>
                </div>

                {paymentAlerts.length ? (
                  <div className="max-h-[min(440px,calc(100vh-250px))] overflow-auto">
                    {paymentAlerts.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setPaymentsOpen(false)}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-blue-50/55"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-800">
                            {item.projectTitle}
                          </span>
                          <span className="mt-1 block truncate text-xs font-medium text-slate-500">
                            {item.businessName} • {paymentTypeLabel(item.type)} • {paymentStatusLabel(item.status)}
                          </span>
                        </span>

                        <span className="text-right">
                          <strong className="block text-sm font-medium text-slate-800">
                            {formatNaira(item.amount)}
                          </strong>
                          <span className="mt-1 inline-flex rounded-full border border-blue-100 bg-white px-2 py-0.5 text-[10px] font-medium text-[#0064E0]">
                            Open
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="grid min-h-44 place-items-center px-6 py-8 text-center">
                    <div>
                      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-[#29BE3E] ring-1 ring-emerald-100">
                        <CreditCard size={22} />
                      </span>
                      <strong className="mt-4 block text-base font-medium tracking-[-0.03em] text-slate-900">
                        No pending payments
                      </strong>
                      <span className="mt-1 block text-sm font-medium leading-6 text-slate-500">
                        Unpaid and awaiting-confirmation records will appear here.
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                  <Link
                    href={paymentsHref(role)}
                    onClick={() => setPaymentsOpen(false)}
                    className="inline-flex min-h-10 w-full items-center justify-center rounded-2xl bg-[#0064E0] px-4 text-sm font-medium text-white transition hover:bg-[#0052B8]"
                  >
                    View all payments
                  </Link>
                </div>
              </section>
            ) : null}
          </div>

          <Link
            href={settingsHref(role)}
            className="hidden min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition hover:border-blue-200 hover:text-[#0064E0] md:inline-flex"
          >
            <Settings2 size={18} />
            <span>Settings</span>
          </Link>

          <Link
            href={
              pendingTotal > 0
                ? role === "SUPER_ADMIN"
                  ? "/admin/project-requests"
                  : role === "CLIENT"
                    ? "/client/approvals"
                    : "/staff/phases"
                : settingsHref(role)
            }
            className="relative grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.035)] md:hidden"
            aria-label="Alerts"
          >
            <Bell size={18} />
            {pendingTotal > 0 ? (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white ring-2 ring-white">
                {pendingTotal}
              </span>
            ) : null}
          </Link>

          <div className="flex min-w-0 items-center gap-3 pl-1">
            <WorkspaceUserAvatar
              name={userName}
              className="!bg-slate-100 !text-slate-900 !ring-slate-200"
            />
            <div className="hidden min-w-0 lg:block">
              <strong className="block max-w-[150px] truncate text-sm font-semibold text-slate-950">
                {userName}
              </strong>
              <span className="mt-0.5 block text-xs font-medium text-[#334a7d]">
                {roleEyebrow(role)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}