"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Inbox,
  Search,
  XCircle,
} from "lucide-react";

import type { PackageType, ProjectRequest } from "@/lib/types";
import { getPackageTitle, PACKAGE_CATALOG } from "./packageCatalog";
import { useApp } from "./AppContext";
import { Card, Input, Select } from "./UI";

type RequestWithClient = ProjectRequest & {
  client?: {
    id: string;
    name: string;
    email: string;
    company?: string | null;
  };
};

type RequestStatusFilter = "ALL" | ProjectRequest["status"];

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

function getPackageIconClass(packageType: PackageType) {
  return PACKAGE_ICON_CLASSES[packageType] ?? PACKAGE_ICON_CLASSES.Custom;
}

function getInitials(value: string) {
  return (
    value
      .split(" ")
      .map((part) => part.trim()[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "O"
  );
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

export function AdminProjectRequestsManager() {
  const { state } = useApp();

  const requests = (state.requests ?? []) as RequestWithClient[];

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("ALL");
  const [packageFilter, setPackageFilter] = useState<"ALL" | PackageType>("ALL");

  const pending = requests.filter((request) => request.status === "PENDING_REVIEW");
  const approved = requests.filter((request) => request.status === "APPROVED");
  const rejected = requests.filter((request) => request.status === "REJECTED");
  const infoRequested = requests.filter((request) => request.status === "INFO_REQUESTED");

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
                Open a request on a dedicated review page to inspect details and convert it.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[760px]">
              <label className="block">
                <span className="sr-only">Search requests</span>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={17}
                  />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search requests..."
                    className="h-12 rounded-2xl border-slate-200 pl-11 text-sm placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block">
                <span className="sr-only">Filter by status</span>
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as RequestStatusFilter)}
                  className="h-12 rounded-2xl border-slate-200 px-4 text-sm"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="INFO_REQUESTED">Info Requested</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </Select>
              </label>

              <label className="block">
                <span className="sr-only">Filter by package</span>
                <Select
                  value={packageFilter}
                  onChange={(event) => setPackageFilter(event.target.value as "ALL" | PackageType)}
                  className="h-12 rounded-2xl border-slate-200 px-4 text-sm"
                >
                  <option value="ALL">All Packages</option>
                  {PACKAGE_CATALOG.map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {filteredRequests.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/admin/project-requests/${request.id}`}
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
                </Link>
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
    </div>
  );
}