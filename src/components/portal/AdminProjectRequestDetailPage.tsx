"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers3,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import type { ProjectRequest, Role } from "@/lib/types";
import { useApp } from "./AppContext";
import { getPackageTitle } from "./packageCatalog";
import { Badge, Button, Card, Input, Select, Textarea, statusClass, statusLabel } from "./UI";
import { calculateProjectPaymentSplit } from "@/lib/payment-policy";

type RequestWithClient = ProjectRequest & {
  client?: {
    id: string;
    name: string;
    email: string;
    company?: string | null;
  };
};

type ApprovalForm = {
  totalAmount: number;
  depositAmount: number;
  depositPercentage: number;
  projectManagerId: string;
  targetDate: string;
  internalNotes: string;
};

const DEFAULT_APPROVAL_AMOUNT = 750000;
const DEFAULT_APPROVAL_SPLIT = calculateProjectPaymentSplit(DEFAULT_APPROVAL_AMOUNT);

const DEFAULT_APPROVAL_FORM: ApprovalForm = {
  totalAmount: DEFAULT_APPROVAL_SPLIT.totalAmount,
  depositAmount: DEFAULT_APPROVAL_SPLIT.depositAmount,
  depositPercentage: DEFAULT_APPROVAL_SPLIT.depositPercentage,
  projectManagerId: "",
  targetDate: "",
  internalNotes: "",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not specified";

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getClientName(request: RequestWithClient) {
  return request.client?.name || request.businessName || "Client";
}

function getClientEmail(request: RequestWithClient) {
  return request.client?.email || "No email attached";
}

function roleTitle(role: Role) {
  const labels: Record<Role, string> = {
    CLIENT: "Client",
    STAFF: "Staff",
    PROJECT_MANAGER: "Project Manager",
    SUPER_ADMIN: "Admin",
  };

  return labels[role] ?? role;
}

function createDefaultForm(users: { id: string; role: Role }[], request?: RequestWithClient): ApprovalForm {
  const lead =
    users.find((user) => user.role === "PROJECT_MANAGER") ??
    users.find((user) => user.role === "SUPER_ADMIN") ??
    users.find((user) => user.role === "STAFF");

  return {
    ...DEFAULT_APPROVAL_FORM,
    projectManagerId: lead?.id ?? "",
    internalNotes: request?.additionalNotes ?? "",
  };
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

export function AdminProjectRequestDetailPage({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { state, approveProjectRequest, refresh } = useApp();

  const request = state.requests.find((item) => item.id === requestId) as RequestWithClient | undefined;

  const managers = state.users.filter(
    (user) =>
      user.role === "PROJECT_MANAGER" ||
      user.role === "SUPER_ADMIN" ||
      user.role === "STAFF",
  );

  const [form, setForm] = useState<ApprovalForm>(() =>
    createDefaultForm(state.users, request),
  );
  const [loadingAction, setLoadingAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  const paymentSplit = useMemo(
    () => calculateProjectPaymentSplit(form.totalAmount),
    [form.totalAmount],
  );

  const depositAmount = paymentSplit.depositAmount;
  const balanceAmount = paymentSplit.balanceAmount;

  if (!request) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/admin/project-requests" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0064E0]">
          <ArrowLeft size={17} />
          Back to Requests
        </Link>

        <Card className="mt-6 border-slate-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <XCircle size={24} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
            Request not found
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            This request may have been deleted, or the workspace has not finished loading it.
          </p>
        </Card>
      </div>
    );
  }

  const isPending = request.status === "PENDING_REVIEW";

  async function approveRequest() {
    if (!request) return;

    if (paymentSplit.totalAmount <= 0 || paymentSplit.depositAmount <= 0) {
      setError("Enter a valid total amount. Deposit and balance will be calculated automatically.");
      return;
    }

    setError("");
    setLoadingAction("approve");

    try {
      const projectId = await approveProjectRequest(request.id, {
        totalAmount: paymentSplit.totalAmount,
        depositAmount,
        balanceAmount,
        depositPercentage: paymentSplit.depositPercentage,
        projectManagerId: form.projectManagerId || undefined,
        targetDate: form.targetDate || undefined,
        internalNotes: form.internalNotes || undefined,
      });

      await refresh();
      router.push(`/admin/projects/${projectId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to approve request.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function rejectRequest() {
    if (!request) return;

    const ok = window.confirm(
      `Reject "${request.projectName}"? This will mark the request as rejected.`,
    );

    if (!ok) return;

    setError("");
    setLoadingAction("reject");

    try {
      const response = await fetch(`/api/project-requests/${request.id}/reject`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to reject request.");
      }

      await refresh();
      router.push("/admin/project-requests");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reject request.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/admin/project-requests" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0064E0]">
        <ArrowLeft size={17} />
        Back to Requests
      </Link>

      <section className="mt-5 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusClass(request.status)}>
                  {statusLabel(request.status)}
                </Badge>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                  {getPackageTitle(request.packageType)}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-5xl">
                {request.projectName}
              </h1>

              <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-white/70 sm:text-[15px]">
                {request.businessName} • Submitted {formatDate(request.createdAt)}
              </p>
            </div>

            <div className="grid h-20 w-20 place-items-center rounded-[24px] bg-white/10 text-white ring-1 ring-white/15">
              <BriefcaseBusiness size={30} />
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
        <main className="space-y-5">
          <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-6">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
              Client Brief
            </h2>

            <div className="mt-5 space-y-4">
              <DetailBlock
                label="Project Goal"
                value={request.projectGoal || "No goal provided."}
                icon={<Layers3 size={17} />}
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Scope / Context
                </span>
                <p className="mt-2 text-sm font-medium leading-7 text-slate-700">
                  {request.projectDescription || "No project description was provided."}
                </p>
              </div>

              {request.additionalNotes ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0064E0]">
                    Additional Notes
                  </span>
                  <p className="mt-2 text-sm font-medium leading-7 text-slate-700">
                    {request.additionalNotes}
                  </p>
                </div>
              ) : null}
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailBlock
              label="Client"
              value={
                <>
                  <span className="block">{getClientName(request)}</span>
                  <span className="block text-xs font-medium text-slate-500">
                    {getClientEmail(request)}
                  </span>
                </>
              }
              icon={<UserRound size={17} />}
            />
            <DetailBlock
              label="Preferred Timeline"
              value={request.preferredTimeline || "Not specified"}
              icon={<CalendarDays size={17} />}
            />
            <DetailBlock
              label="Package / Suite"
              value={getPackageTitle(request.packageType)}
              icon={<BriefcaseBusiness size={17} />}
            />
            <DetailBlock
              label="Submitted"
              value={formatDate(request.createdAt)}
              icon={<Clock3 size={17} />}
            />
          </div>
        </main>

        <aside>
          <Card className="sticky top-24 border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
                <WalletCards size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
                  Convert to project
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  Set payment and project control details.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-800">Total Amount</span>
                <Input
                  type="number"
                  min={0}
                  value={form.totalAmount}
                  disabled={!isPending}
                  onChange={(event) =>
                    setForm((current) => {
                      const split = calculateProjectPaymentSplit(Number(event.target.value), current.depositPercentage);

                      return {
                        ...current,
                        totalAmount: split.totalAmount,
                        depositAmount: split.depositAmount,
                      };
                    })
                  }
                  className="mt-2 h-12 rounded-2xl border-slate-200 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Deposit Percentage</span>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.depositPercentage}
                  disabled={!isPending}
                  onChange={(event) =>
                    setForm((current) => {
                      const split = calculateProjectPaymentSplit(current.totalAmount, Number(event.target.value));

                      return {
                        ...current,
                        depositPercentage: split.depositPercentage,
                        depositAmount: split.depositAmount,
                      };
                    })
                  }
                  className="mt-2 h-12 rounded-2xl border-slate-200 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Deposit Amount ({form.depositPercentage}%)</span>
                <Input
                  type="number"
                  min={0}
                  value={depositAmount}
                  readOnly
                  disabled={!isPending}
                  className="mt-2 h-12 rounded-2xl border-slate-200 bg-slate-50 text-sm"
                />
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Balance Amount
                </span>
                <strong className="mt-1 block text-xl tracking-[-0.04em] text-slate-950">
                  {formatMoney(balanceAmount)}
                </strong>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Target Date</span>
                <Input
                  type="date"
                  value={form.targetDate}
                  disabled={!isPending}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      targetDate: event.target.value,
                    }))
                  }
                  className="mt-2 h-12 rounded-2xl border-slate-200 text-sm"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Project Lead</span>
                <Select
                  value={form.projectManagerId}
                  disabled={!isPending}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      projectManagerId: event.target.value,
                    }))
                  }
                  className="mt-2 h-12 rounded-2xl border-slate-200 text-sm"
                >
                  <option value="">Assign later</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} — {roleTitle(manager.role)}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">Internal Notes</span>
                <Textarea
                  value={form.internalNotes}
                  disabled={!isPending}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      internalNotes: event.target.value,
                    }))
                  }
                  placeholder="Private admin note for this project conversion."
                  className="mt-2 min-h-[105px] rounded-2xl border-slate-200 text-sm placeholder:text-slate-400"
                />
              </label>
            </div>

            {error ? (
              <div className="mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            {isPending ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <Button
                  onClick={approveRequest}
                  loading={loadingAction === "approve"}
                  disabled={Boolean(loadingAction)}
                >
                  <CheckCircle2 size={16} />
                  Approve
                </Button>

                <Button
                  variant="danger"
                  onClick={rejectRequest}
                  loading={loadingAction === "reject"}
                  disabled={Boolean(loadingAction)}
                >
                  <XCircle size={16} />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                This request has already been processed.
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}