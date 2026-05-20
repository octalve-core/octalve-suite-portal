"use client";

import Link from "next/link";
import type React from "react";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Search,
  WalletCards,
  XCircle,
} from "lucide-react";

import type { PaymentStatus, Project, ProjectPayment } from "@/lib/types";
import { getPackageTitle } from "./packageCatalog";
import { useApp } from "./AppContext";
import { Card, Input, Select } from "./UI";

type PaymentRow = {
  payment: ProjectPayment;
  project: Project;
};

type PaymentStatusFilter = "ALL" | PaymentStatus;

const STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PENDING_CONFIRMATION: "Awaiting Confirmation",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
};

const STATUS_ORDER: Record<PaymentStatus, number> = {
  UNPAID: 0,
  REJECTED: 1,
  PENDING_CONFIRMATION: 2,
  CONFIRMED: 3,
};

const STATUS_CHIP_CLASSES: Record<PaymentStatus, string> = {
  UNPAID: "border-blue-200 bg-blue-50 text-[#0064E0]",
  PENDING_CONFIRMATION: "border-orange-200 bg-orange-50 text-orange-700",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

const STATUS_ICON_CLASSES: Record<PaymentStatus, string> = {
  UNPAID: "bg-blue-50 text-[#0064E0] ring-blue-100",
  PENDING_CONFIRMATION: "bg-orange-50 text-orange-600 ring-orange-100",
  CONFIRMED: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  REJECTED: "bg-red-50 text-red-600 ring-red-100",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusChip({ status }: { status: PaymentStatus }) {
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

function paymentTypeLabel(type: ProjectPayment["type"]) {
  return type === "DEPOSIT" ? "Deposit Payment" : "Balance Payment";
}

function rowMatchesSearch(row: PaymentRow, query: string) {
  const value = query.trim().toLowerCase();

  if (!value) return true;

  const content = [
    row.payment.reference,
    row.payment.type,
    row.payment.status,
    row.project.title,
    row.project.businessName,
    row.project.projectCode,
    getPackageTitle(row.project.packageType),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return content.includes(value);
}

function StatCard({
  label,
  value,
  amount,
  icon,
  tone,
}: {
  label: string;
  value: number;
  amount?: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-4">
        <span className={["grid h-12 w-12 place-items-center rounded-2xl ring-1", tone].join(" ")}>
          {icon}
        </span>
        <div className="min-w-0">
          <strong className="block text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {value}
          </strong>
          <span className="block text-sm font-medium text-slate-500">{label}</span>
          {typeof amount === "number" ? (
            <span className="mt-1 block truncate text-xs font-bold text-slate-400">
              {formatMoney(amount)}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function ClientPaymentsManager() {
  const { clientProjects, selectedProject } = useApp();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("ALL");
  const [projectFilter, setProjectFilter] = useState(selectedProject?.id ?? "ALL");

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

  const unpaid = rows.filter((row) => row.payment.status === "UNPAID");
  const pending = rows.filter((row) => row.payment.status === "PENDING_CONFIRMATION");
  const confirmed = rows.filter((row) => row.payment.status === "CONFIRMED");
  const rejected = rows.filter((row) => row.payment.status === "REJECTED");

  const unpaidAmount = unpaid.reduce((total, row) => total + row.payment.amount, 0);
  const pendingAmount = pending.reduce((total, row) => total + row.payment.amount, 0);
  const confirmedAmount = confirmed.reduce((total, row) => total + row.payment.amount, 0);

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
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 sm:p-8">
          <div className="absolute right-[-80px] top-[-110px] h-64 w-64 rounded-full bg-[#0064E0]/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.34em] text-[#0064E0]">
                Billing
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Payments
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-[15px]">
                Track your project deposit, balance, bank transfer reference and confirmation status from one clear place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusChip status="UNPAID" />
              <StatusChip status="PENDING_CONFIRMATION" />
              <StatusChip status="CONFIRMED" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Unpaid"
          value={unpaid.length}
          amount={unpaidAmount}
          tone="bg-blue-50 text-[#0064E0] ring-blue-100"
          icon={<CreditCard size={19} />}
        />
        <StatCard
          label="Awaiting Confirmation"
          value={pending.length}
          amount={pendingAmount}
          tone="bg-orange-50 text-orange-600 ring-orange-100"
          icon={<Clock3 size={19} />}
        />
        <StatCard
          label="Confirmed"
          value={confirmed.length}
          amount={confirmedAmount}
          tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
          icon={<CheckCircle2 size={19} />}
        />
        <StatCard
          label="Rejected"
          value={rejected.length}
          tone="bg-red-50 text-red-600 ring-red-100"
          icon={<XCircle size={19} />}
        />
      </section>

      <section className="mt-6 rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                Payment Schedule
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Open a payment record to view bank details and mark transfer as paid.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[820px]">
              <label className="block">
                <span className="sr-only">Search payments</span>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={17}
                  />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search payments..."
                    className="h-12 rounded-2xl border-slate-200 pl-11 text-sm placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block">
                <span className="sr-only">Filter by status</span>
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as PaymentStatusFilter)}
                  className="h-12 rounded-2xl border-slate-200 px-4 text-sm"
                >
                  <option value="ALL">All Status</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PENDING_CONFIRMATION">Awaiting Confirmation</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="REJECTED">Rejected</option>
                </Select>
              </label>

              <label className="block">
                <span className="sr-only">Filter by project</span>
                <Select
                  value={projectFilter}
                  onChange={(event) => setProjectFilter(event.target.value)}
                  className="h-12 rounded-2xl border-slate-200 px-4 text-sm"
                >
                  <option value="ALL">All Projects</option>
                  {clientProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {filteredRows.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredRows.map(({ payment, project }) => (
                <Link
                  key={payment.id}
                  href={`/client/payments/${payment.id}`}
                  className="group rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(0,100,224,0.10)]"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={[
                        "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1",
                        STATUS_ICON_CLASSES[payment.status],
                      ].join(" ")}
                    >
                      <WalletCards size={21} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
                            {paymentTypeLabel(payment.type)}
                          </h3>
                          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                            {project.title} • {project.projectCode}
                          </p>
                        </div>

                        <StatusChip status={payment.status} />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        <div>
                          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            Amount
                          </span>
                          <strong className="mt-1 block truncate text-sm text-slate-800">
                            {formatMoney(payment.amount)}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            Package
                          </span>
                          <strong className="mt-1 block truncate text-sm text-slate-800">
                            {getPackageTitle(project.packageType)}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            Reference
                          </span>
                          <strong className="mt-1 block truncate text-sm text-slate-800">
                            {payment.reference}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            Confirmed
                          </span>
                          <strong className="mt-1 block truncate text-sm text-slate-800">
                            {formatDate(payment.confirmedAt)}
                          </strong>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-sm font-bold text-[#0064E0]">
                          {payment.status === "UNPAID" ? "Make payment" : "View payment"}
                        </span>
                        <ArrowRight
                          size={17}
                          className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#0064E0]"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
                <WalletCards size={24} />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950">
                No matching payments
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Adjust your filters or search term. Payment details will appear once a project has been approved or created with a payment structure.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}