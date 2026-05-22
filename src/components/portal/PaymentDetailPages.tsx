"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Landmark,
  ReceiptText,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import type { PaymentMethodOption, PaymentStatus, Project, ProjectPayment, User } from "@/lib/types";
import { api } from "@/lib/api";
import { resolvePaymentBankDetails } from "@/lib/payment-bank";
import { getPackageTitle } from "./packageCatalog";
import { useApp } from "./AppContext";
import { Button, Card, Textarea } from "./UI";

type AdminPaymentRow = {
  payment: ProjectPayment;
  project: Project;
  client: User | null;
};

type ClientPaymentRow = {
  payment: ProjectPayment;
  project: Project;
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PENDING_CONFIRMATION: "Pending Confirmation",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
};

const STATUS_CHIP_CLASSES: Record<PaymentStatus, string> = {
  UNPAID: "border-blue-200 bg-blue-50 text-[#0064E0]",
  PENDING_CONFIRMATION: "border-orange-200 bg-orange-50 text-orange-700",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
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

function canMarkPaymentForProject(project: Project, payment: ProjectPayment) {
  if (payment.status !== "UNPAID") return false;

  if (payment.type === "DEPOSIT") {
    return project.status === "APPROVED_AWAITING_DEPOSIT";
  }

  return project.status === "AWAITING_BALANCE";
}

function paymentTypeLabel(type: ProjectPayment["type"]) {
  return type === "DEPOSIT" ? "Deposit Payment" : "Balance Payment";
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

function DetailBlock({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </span>
          <div className="mt-1 text-sm font-semibold leading-6 text-slate-900">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyInlineValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-left text-sm font-bold text-slate-900 transition hover:border-blue-200 hover:text-[#0064E0]"
      title="Copy"
    >
      <span className="truncate">{value}</span>
      <small className={copied ? "shrink-0 text-emerald-600" : "shrink-0 text-slate-400"}>
        {copied ? "Copied" : "Copy"}
      </small>
    </button>
  );
}
function PaymentHero({
  payment,
  project,
  backHref,
}: {
  payment: ProjectPayment;
  project: Project;
  backHref: string;
}) {
  return (
    <>
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0064E0]"
      >
        <ArrowLeft size={17} />
        Back to Payments
      </Link>

      <section className="mt-5 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={payment.status} />
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                  {getPackageTitle(project.packageType)}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-5xl">
                {paymentTypeLabel(payment.type)}
              </h1>

              <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-white/70 sm:text-[15px]">
                {project.title} • {project.projectCode} • {payment.reference}
              </p>
            </div>

            <div className="grid h-20 min-w-20 place-items-center rounded-3xl bg-white/10 px-5 text-right ring-1 ring-white/15">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                Amount
              </span>
              <strong className="text-xl font-semibold tracking-[-0.04em]">
                {formatMoney(payment.amount)}
              </strong>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function NotFound({ backHref }: { backHref: string }) {
  return (
    <div className="mx-auto w-full max-w-295 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0064E0]"
      >
        <ArrowLeft size={17} />
        Back to Payments
      </Link>

      <Card className="mt-6 border-slate-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <XCircle size={24} />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tighter text-slate-950">
          Payment not found
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          This payment may have been deleted, or you may not have access to it.
        </p>
      </Card>
    </div>
  );
}

function PaymentDetailsGrid({
  payment,
  project,
  client,
}: {
  payment: ProjectPayment;
  project: Project;
  client?: User | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DetailBlock
        label="Project"
        value={
          <>
            <span className="block">{project.title}</span>
            <span className="block text-xs font-medium text-slate-500">
              {project.businessName}
            </span>
          </>
        }
        icon={<BriefcaseBusiness size={17} />}
      />

      <DetailBlock
        label="Client"
        value={
          <>
            <span className="block">{client?.name ?? project.businessName}</span>
            <span className="block text-xs font-medium text-slate-500">
              {client?.email ?? project.clientEmail}
            </span>
          </>
        }
        icon={<UserRound size={17} />}
      />

      <DetailBlock
        label="Payment Type"
        value={paymentTypeLabel(payment.type)}
        icon={<ReceiptText size={17} />}
      />

      <DetailBlock
        label="Status"
        value={<StatusChip status={payment.status} />}
        icon={<Clock3 size={17} />}
      />

      <DetailBlock
        label="Reference"
        value={payment.reference}
        icon={<FileText size={17} />}
      />

      <DetailBlock
        label="Confirmed Date"
        value={formatDate(payment.confirmedAt)}
        icon={<CheckCircle2 size={17} />}
      />
    </div>
  );
}

function BankDetails({ payment }: { payment: ProjectPayment }) {
  const bank = resolvePaymentBankDetails(payment);

  return (
    <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          <Landmark size={20} />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
            Bank transfer details
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Use these official Octalve account details for manual transfer and include the payment reference.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <DetailBlock label="Bank Name" value={<CopyInlineValue value={bank.bankName} />} icon={<Landmark size={17} />} />
        <DetailBlock label="Account Name" value={<CopyInlineValue value={bank.accountName} />} icon={<UserRound size={17} />} />
        <DetailBlock label="Account Number" value={<CopyInlineValue value={bank.accountNumber} />} icon={<Banknote size={17} />} />
        <DetailBlock label="Payment Reference" value={<CopyInlineValue value={payment.reference} />} icon={<FileText size={17} />} />
      </div>
    </Card>
  );
}

function ClientPaymentMethodsCard({ payment }: { payment: ProjectPayment }) {
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializingProvider, setInitializingProvider] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMethods() {
      if (payment.status !== "UNPAID") return;

      setLoading(true);
      setError("");

      try {
        const data = await api.payments.methods(payment.id);
        if (mounted) setMethods(data);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to load payment methods.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadMethods();

    return () => {
      mounted = false;
    };
  }, [payment.id, payment.status]);

  async function handleInitialize(provider: string) {
    if (provider === "MANUAL_BANK") return;

    setInitializingProvider(provider);
    setError("");

    try {
      const response = await api.payments.initialize(payment.id, provider);

      if (response.authorizationUrl) {
        window.location.assign(response.authorizationUrl);
        return;
      }

      setError(response.message || "We could not open the checkout page. Please try again or use bank transfer.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start online payment. Please try again or use bank transfer.");
    } finally {
      setInitializingProvider("");
    }
  }

  if (payment.status !== "UNPAID") return null;

  return (
    <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          <CreditCard size={20} />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
            Complete your payment
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Choose how you want to pay for this project record. Use bank transfer for manual confirmation, or continue with an available online checkout option for secure processing.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            Loading payment options...
          </div>
        ) : methods.length ? (
          methods.map((method) => {
            const isManual = method.provider === "MANUAL_BANK";
            const available = method.isReady || isManual;
            const canStartOnline =
              available &&
              (method.provider === "PAYSTACK" || method.provider === "FLUTTERWAVE");
            const isInitializing = initializingProvider === method.provider;

            return (
              <div
                key={method.provider}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong className="block text-sm text-slate-950">
                      {method.displayName}
                    </strong>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">
                      {available
                        ? isManual
                          ? "Available now. Use the bank details below."
                          : "Available now. Continue to secure checkout."
                        : method.unavailableReason ?? "Currently unavailable."}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                        available
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500",
                      ].join(" ")}
                    >
                      {available ? "Available" : "Not Ready"}
                    </span>

                    {canStartOnline ? (
                      <Button
                        onClick={() => handleInitialize(method.provider)}
                        loading={isInitializing}
                        disabled={Boolean(initializingProvider)}
                      >
                        Continue
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            No payment options are available right now.
          </div>
        )}
      </div>
    </Card>
  );
}
export function AdminPaymentDetailPage({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const { state, confirmPayment, rejectPayment } = useApp();

  const row = state.projects
    .flatMap((project) =>
      project.payments.map((payment) => ({
        payment,
        project,
        client: state.users.find((user) => user.id === project.clientId) ?? null,
      })),
    )
    .find((item) => item.payment.id === paymentId) as AdminPaymentRow | undefined;

  const [loadingAction, setLoadingAction] = useState<"confirm" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  if (!row) return <NotFound backHref="/admin/payments" />;

  const { payment, project, client } = row;
  const canReview = payment.status === "PENDING_CONFIRMATION";

  async function handleConfirm() {
    if (!canReview) return;

    setError("");
    setLoadingAction("confirm");

    try {
      await confirmPayment(payment.id);
      router.push("/admin/payments");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to confirm payment.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleReject() {
    if (!canReview) return;

    const ok = window.confirm("Reject this payment confirmation?");

    if (!ok) return;

    setError("");
    setLoadingAction("reject");

    try {
      await rejectPayment(payment.id, rejectNote || undefined);
      router.push("/admin/payments");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reject payment.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-330 px-4 py-6 sm:px-6 lg:px-8">
      <PaymentHero payment={payment} project={project} backHref="/admin/payments" />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(380px,0.88fr)]">
        <main className="space-y-5">
          <PaymentDetailsGrid payment={payment} project={project} client={client} />

          <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-6">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
              Payment Summary
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <DetailBlock label="Amount" value={formatMoney(payment.amount)} icon={<CreditCard size={17} />} />
              <DetailBlock label="Project Total" value={formatMoney(project.totalAmount)} icon={<WalletCards size={17} />} />
              <DetailBlock label="Package" value={getPackageTitle(project.packageType)} icon={<BriefcaseBusiness size={17} />} />
            </div>

            {payment.note ? (
              <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold leading-6 text-orange-800">
                Admin note: {payment.note}
              </div>
            ) : null}
          </Card>
        </main>

        <aside className="space-y-5">
          <BankDetails payment={payment} />

          <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
                <CheckCircle2 size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
                  Admin action
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  Confirm only after the transfer is verified.
                </p>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-bold text-slate-800">Rejection note</span>
              <Textarea
                value={rejectNote}
                disabled={!canReview}
                onChange={(event) => setRejectNote(event.target.value)}
                placeholder="Optional reason shown to the client when payment is rejected."
                className="mt-2 min-h-27.5 rounded-2xl border-slate-200 text-sm placeholder:text-slate-400"
              />
            </label>

            {error ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            {canReview ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleConfirm}
                  loading={loadingAction === "confirm"}
                  disabled={Boolean(loadingAction)}
                >
                  <CheckCircle2 size={16} />
                  Confirm
                </Button>

                <Button
                  variant="danger"
                  onClick={handleReject}
                  loading={loadingAction === "reject"}
                  disabled={Boolean(loadingAction)}
                >
                  <XCircle size={16} />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                No admin action is required for this payment status.
              </div>
            )}

            <Link
              href={`/admin/projects/${project.id}`}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-[#0064E0]"
            >
              Open Project
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export function ClientPaymentDetailPage({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const { clientProjects, markPaymentPaid } = useApp();

  const row = clientProjects
    .flatMap((project) =>
      project.payments.map((payment) => ({
        payment,
        project,
      })),
    )
    .find((item) => item.payment.id === paymentId) as ClientPaymentRow | undefined;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!row) return <NotFound backHref="/client/payments" />;

  const { payment, project } = row;
  const canMarkPaid = canMarkPaymentForProject(project, payment);

  async function handleMarkPaid() {
    if (!canMarkPaid) return;

    const ok = window.confirm("Confirm that you have made this transfer?");

    if (!ok) return;

    setError("");
    setLoading(true);

    try {
      await markPaymentPaid(payment.id);
      router.push("/client/payments");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to mark payment as paid.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-330 px-4 py-6 sm:px-6 lg:px-8">
      <PaymentHero payment={payment} project={project} backHref="/client/payments" />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(380px,0.88fr)]">
        <main className="space-y-5">
          <PaymentDetailsGrid payment={payment} project={project} />

          <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-6">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
              Payment Instructions
            </h2>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-7 text-slate-700">
              Make your transfer with the bank details provided. Use the payment reference shown on this page, then click “I have paid” so Octalve can verify the transfer.
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <DetailBlock label="Amount" value={formatMoney(payment.amount)} icon={<CreditCard size={17} />} />
              <DetailBlock label="Project Total" value={formatMoney(project.totalAmount)} icon={<WalletCards size={17} />} />
              <DetailBlock label="Package" value={getPackageTitle(project.packageType)} icon={<BriefcaseBusiness size={17} />} />
            </div>

            {payment.note ? (
              <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold leading-6 text-orange-800">
                Note: {payment.note}
              </div>
            ) : null}
          </Card>
        </main>

        <aside className="space-y-5">
          <ClientPaymentMethodsCard payment={payment} />
          <BankDetails payment={payment} />

          <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
                <WalletCards size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
                  Payment action
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  Notify Octalve after completing your bank transfer.
                </p>
              </div>
            </div>

            {error ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            {canMarkPaid ? (
              <Button
                className="mt-5 w-full"
                onClick={handleMarkPaid}
                loading={loading}
                disabled={loading}
              >
                <CheckCircle2 size={16} />
                I have paid
              </Button>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                {payment.status === "PENDING_CONFIRMATION"
                  ? "Your payment has been submitted and is awaiting admin confirmation."
                  : payment.status === "CONFIRMED"
                    ? "This payment has been confirmed."
                    : "No payment action is currently available."}
              </div>
            )}

            <Link
              href={`/client/projects/${project.id}`}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-[#0064E0]"
            >
              Open Project
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}