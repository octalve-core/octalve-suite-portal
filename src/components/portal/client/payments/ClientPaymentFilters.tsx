import { Search } from "lucide-react";
import type { PaymentStatus, Project } from "@/lib/types";
import type { PaymentStatusFilter } from "./client-payments-utils";

export function ClientPaymentFilters({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  projectFilter,
  setProjectFilter,
  projects,
}: {
  query: string;
  setQuery: (value: string) => void;
  statusFilter: PaymentStatusFilter;
  setStatusFilter: (value: PaymentStatusFilter) => void;
  projectFilter: string;
  setProjectFilter: (value: string) => void;
  projects: Project[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[820px]">
      <label className="block">
        <span className="sr-only">Search payments</span>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={17}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search payments..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </label>

      <label className="block">
        <span className="sr-only">Filter by status</span>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as PaymentStatusFilter)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
        >
          <option value="ALL">All Status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PENDING_CONFIRMATION">Awaiting Confirmation</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </label>

      <label className="block">
        <span className="sr-only">Filter by project</span>
        <select
          value={projectFilter}
          onChange={(event) => setProjectFilter(event.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
        >
          <option value="ALL">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
