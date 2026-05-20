"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  Inbox,
  Layers3,
  Search,
  UserRound,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

import type { PackageType, ProjectRequest, Role } from "@/lib/types";
import { useApp } from "./AppContext";
import { getPackageTitle, PACKAGE_CATALOG } from "./packageCatalog";
import { Button, Card, Input, Select, Textarea } from "./UI";

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
  projectManagerId: string;
  targetDate: string;
  internalNotes: string;
};

type RequestStatusFilter = "ALL" | ProjectRequest["status"];

const DEFAULT_APPROVAL_FORM: ApprovalForm = {
  totalAmount: 750000,
  depositAmount: 350000,
  projectManagerId: "",
  targetDate: "",
  internalNotes: "",
};

const STATUS_LABELS: Record<ProjectRequest["status"], string> = {
  PENDING_REVIEW: "Pending Review",
  INFO_REQUESTED: "Info Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_ORDER: Record<ProjectRequest["status"], number> = {
  PENDING_REVIEW: 0,
  INFO_REQUESTED: 1,
  APPROVED: 2,
  REJECTED: 3,
};

const STATUS_CHIP_CLASSES: Record<ProjectRequest["status"], string> = {
  PENDING_REVIEW: "border-orange-200 bg-orange-50 text-orange-700",
  INFO_REQUESTED: "border-blue-200 bg-blue-50 text-[#0064E0]",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

const STATUS_ICON_CLASSES: Record<ProjectRequest["status"], string> = {
  PENDING_REVIEW: "bg-orange-50 text-orange-600 ring-orange-100",
  INFO_REQUESTED: "bg-blue-50 text-[#0064E0] ring-blue-100",
  APPROVED: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  REJECTED: "bg-red-50 text-red-600 ring-red-100",
};

const PACKAGE_ICON_CLASSES: Record<string, string> = {
  Launch: "bg-blue-50 text-[#0064E0] ring-blue-100",
  Impact: "bg-red-50 text-[#E61525] ring-red-100",
  Growth: "bg-emerald-50 text-[#29BE3E] ring-emerald-100",
  Partner: "bg-violet-50 text-[#5300D9] ring-violet-100",
  WebsiteStarter: "bg-blue-50 text-[#0064E0] ring-blue-100",
  WebsiteProBiz: "bg-orange-50 text-[#FC7E24] ring-orange-100",
  WebsiteAdvance: "bg-indigo-50 text-[#2A006D] ring-indigo-100",
  BrandingStarter: "bg-pink-50 text-[#E61525] ring-pink-100",
  BrandingProBiz: "bg-purple-50 text-[#5300D9] ring-purple-100",
  BrandingAdvance: "bg-fuchsia-50 text-[#2A006D] ring-fuchsia-100",
  LeapRegistration: "bg-orange-50 text-[#FC7E24] ring-orange-100",
  Custom: "bg-slate-100 text-slate-700 ring-slate-200",
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

function getPackageIconClass(packageType: PackageType) {
  return PACKAGE_ICON_CLASSES[packageType] ?? PACKAGE_ICON_CLASSES.Custom;
}

function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "O";
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

function requestMatchesSearch(request: RequestWithClient, query: string) {
  const value = query.trim().toLowerCase();

  if (!value) return true;

  const content = [
    request.projectName,
    request.businessName,
    request.projectGoal,
    request.projectDescription,
    request.preferredTimeline,
    request.additionalNotes,
    getPackageTitle(request.packageType),
    request.client?.name,
    request.client?.email,
    request.client?.company,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return content.includes(value);
}

function StatusChip({ status }: { status: ProjectRequest["status"] }) {
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

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-4">
        <span className={["grid h-12 w-12 place-items-center rounded-2xl ring-1", tone].join(" ")}>
          {icon}
        </span>
        <div>
          <strong className="block text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {value}
          </strong>
          <span className="text-sm font-medium text-slate-500">{label}</span>
        </div>
      </div>
    </Card>
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

function ReviewRequestModal({
  request,
  form,
  setForm,
  balanceAmount,
  managers,
  loadingAction,
  error,
  onClose,
  onApprove,
  onReject,
}: {
  request: RequestWithClient;
  form: ApprovalForm;
  setForm: React.Dispatch<React.SetStateAction<ApprovalForm>>;
  balanceAmount: number;
  managers: { id: string; name: string; email: string; role: Role }[];
  loadingAction: "approve" | "reject" | null;
  error: string;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isPending = request.status === "PENDING_REVIEW";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-[1120px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={request.status} />
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                {getPackageTitle(request.packageType)}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-3xl">
              Review project request
            </h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              Inspect the client brief, set the payment structure, then convert the request into an active project.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Close review modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-92px)] overflow-y-auto">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <section className="space-y-5">
              <Card className="overflow-hidden border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                <div className="border-b border-slate-200 bg-slate-950 p-5 text-white">
                  <div className="flex items-start gap-4">
                    <span className={["grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15"].join(" ")}>
                      <BriefcaseBusiness size={22} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold tracking-[-0.04em]">
                        {request.projectName}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-white/70">
                        {request.businessName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5">
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
                  label="Submitted"
                  value={formatDate(request.createdAt)}
                  icon={<Clock3 size={17} />}
                />
                <DetailBlock
                  label="Package / Suite"
                  value={getPackageTitle(request.packageType)}
                  icon={<BriefcaseBusiness size={17} />}
                />
              </div>
            </section>

            <aside className="space-y-5">
              <Card className="border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
                    <WalletCards size={20} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
                      Convert to project
                    </h3>
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
                        setForm((current) => ({
                          ...current,
                          totalAmount: Number(event.target.value),
                        }))
                      }
                      className="mt-2 h-12 rounded-2xl border-slate-200 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-800">Deposit Amount</span>
                    <Input
                      type="number"
                      min={0}
                      value={form.depositAmount}
                      disabled={!isPending}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          depositAmount: Number(event.target.value),
                        }))
                      }
                      className="mt-2 h-12 rounded-2xl border-slate-200 text-sm"
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
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Button
                      onClick={onApprove}
                      loading={loadingAction === "approve"}
                      disabled={Boolean(loadingAction)}
                    >
                      Approve & Create
                    </Button>

                    <Button
                      variant="danger"
                      onClick={onReject}
                      loading={loadingAction === "reject"}
                      disabled={Boolean(loadingAction)}
                    >
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
      </div>
    </div>
  );
}

export function AdminProjectRequestsManager() {
  const router = useRouter();
  const { state, approveProjectRequest, refresh } = useApp();

  const requests = (state.requests ?? []) as RequestWithClient[];
  const managers = state.users.filter(
    (user) =>
      user.role === "PROJECT_MANAGER" ||
      user.role === "SUPER_ADMIN" ||
      user.role === "STAFF",
  );

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("ALL");
  const [packageFilter, setPackageFilter] = useState<"ALL" | PackageType>("ALL");
  const [activeRequest, setActiveRequest] = useState<RequestWithClient | null>(null);
  const [form, setForm] = useState<ApprovalForm>(() =>
    createDefaultForm(state.users, undefined),
  );
  const [loadingAction, setLoadingAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  const pending = requests.filter((request) => request.status === "PENDING_REVIEW");
  const approved = requests.filter((request) => request.status === "APPROVED");
  const rejected = requests.filter((request) => request.status === "REJECTED");
  const infoRequested = requests.filter((request) => request.status === "INFO_REQUESTED");

  const balanceAmount = Math.max(
    Number(form.totalAmount || 0) - Number(form.depositAmount || 0),
    0,
  );

  const filteredRequests = useMemo(() => {
    return [...requests]
      .filter((request) =>
        statusFilter === "ALL" ? true : request.status === statusFilter,
      )
      .filter((request) =>
        packageFilter === "ALL" ? true : request.packageType === packageFilter,
      )
      .filter((request) => requestMatchesSearch(request, query))
      .sort((a, b) => {
        const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];

        if (statusDiff !== 0) return statusDiff;

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [packageFilter, query, requests, statusFilter]);

  function openRequest(request: RequestWithClient) {
    setActiveRequest(request);
    setForm(createDefaultForm(state.users, request));
    setError("");
  }

  async function approveActiveRequest() {
    if (!activeRequest) return;

    if (form.totalAmount <= 0 || form.depositAmount <= 0) {
      setError("Enter a valid total amount and deposit amount.");
      return;
    }

    if (form.depositAmount > form.totalAmount) {
      setError("Deposit cannot be higher than total project amount.");
      return;
    }

    setError("");
    setLoadingAction("approve");

    try {
      const projectId = await approveProjectRequest(activeRequest.id, {
        totalAmount: Number(form.totalAmount),
        depositAmount: Number(form.depositAmount),
        balanceAmount,
        projectManagerId: form.projectManagerId || undefined,
        targetDate: form.targetDate || undefined,
        internalNotes: form.internalNotes || undefined,
      });

      await refresh();
      setActiveRequest(null);
      router.push(`/admin/projects/${projectId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to approve request.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function rejectActiveRequest() {
    if (!activeRequest) return;

    const ok = window.confirm(
      `Reject "${activeRequest.projectName}"? This will mark the request as rejected.`,
    );

    if (!ok) return;

    setError("");
    setLoadingAction("reject");

    try {
      const response = await fetch(`/api/project-requests/${activeRequest.id}/reject`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to reject request.");
      }

      await refresh();
      setActiveRequest(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reject request.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 sm:p-8">
          <div className="absolute right-[-80px] top-[-110px] h-64 w-64 rounded-full bg-[#0064E0]/10 blur-2xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.34em] text-[#0064E0]">
                Project Intake
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Project Requests
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-[15px]">
                Review client-submitted briefs, validate scope, set payment structure and convert qualified requests into active projects.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusChip status="PENDING_REVIEW" />
              <StatusChip status="APPROVED" />
              <StatusChip status="REJECTED" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Requests"
          value={requests.length}
          tone="bg-blue-50 text-[#0064E0] ring-blue-100"
          icon={<Inbox size={19} />}
        />
        <StatCard
          label="Pending Review"
          value={pending.length}
          tone="bg-orange-50 text-orange-600 ring-orange-100"
          icon={<Clock3 size={19} />}
        />
        <StatCard
          label="Approved"
          value={approved.length}
          tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
          icon={<CheckCircle2 size={19} />}
        />
        <StatCard
          label="Rejected / Info"
          value={rejected.length + infoRequested.length}
          tone="bg-slate-100 text-slate-600 ring-slate-200"
          icon={<XCircle size={19} />}
        />
      </section>

      <section className="mt-6 rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                Request Queue
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Open a request to review details and convert it. No side panel is used here.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[760px]">
              <div className="relative sm:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search requests..."
                  className="h-12 rounded-2xl border-slate-200 pl-10 text-sm placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as RequestStatusFilter)}
                  className="h-12 rounded-2xl border-slate-200 pl-10 text-sm"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="INFO_REQUESTED">Info Requested</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </Select>
              </div>

              <div className="relative">
                <BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <Select
                  value={packageFilter}
                  onChange={(event) => setPackageFilter(event.target.value as "ALL" | PackageType)}
                  className="h-12 rounded-2xl border-slate-200 pl-10 text-sm"
                >
                  <option value="ALL">All Packages</option>
                  {PACKAGE_CATALOG.map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {filteredRequests.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredRequests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => openRequest(request)}
                  className="group rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(0,100,224,0.10)]"
                >
                  <div className="flex items-start gap-4">
                    <span className={["grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1", getPackageIconClass(request.packageType)].join(" ")}>
                      {getInitials(getPackageTitle(request.packageType))}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
                            {request.projectName}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-slate-500">
                            {request.businessName} • {request.projectGoal}
                          </p>
                        </div>
                        <StatusChip status={request.status} />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div>
                          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            Package
                          </span>
                          <strong className="mt-1 block truncate text-sm text-slate-800">
                            {getPackageTitle(request.packageType)}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            Client
                          </span>
                          <strong className="mt-1 block truncate text-sm text-slate-800">
                            {getClientName(request)}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            Submitted
                          </span>
                          <strong className="mt-1 block truncate text-sm text-slate-800">
                            {formatDate(request.createdAt)}
                          </strong>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-sm font-bold text-[#0064E0]">
                          {request.status === "PENDING_REVIEW" ? "Review request" : "View request"}
                        </span>
                        <ArrowRight
                          size={17}
                          className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#0064E0]"
                        />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
                <Inbox size={24} />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950">
                No matching requests
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Adjust your filters or search term. New client-submitted project requests will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      {activeRequest ? (
        <ReviewRequestModal
          request={activeRequest}
          form={form}
          setForm={setForm}
          balanceAmount={balanceAmount}
          managers={managers}
          loadingAction={loadingAction}
          error={error}
          onClose={() => {
            setActiveRequest(null);
            setError("");
          }}
          onApprove={approveActiveRequest}
          onReject={rejectActiveRequest}
        />
      ) : null}
    </div>
  );
}