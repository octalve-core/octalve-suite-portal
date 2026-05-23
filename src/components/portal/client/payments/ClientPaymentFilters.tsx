import { Search, SlidersHorizontal } from "lucide-react";
import type { Project } from "@/lib/types";
import type {
  PaymentSortOption,
  PaymentStatusFilter,
} from "./client-payments-utils";

export function ClientPaymentFilters({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  projectFilter,
  setProjectFilter,
  sortBy,
  setSortBy,
  projects,
}: {
  query: string;
  setQuery: (value: string) => void;
  statusFilter: PaymentStatusFilter;
  setStatusFilter: (value: PaymentStatusFilter) => void;
  projectFilter: string;
  setProjectFilter: (value: string) => void;
  sortBy: PaymentSortOption;
  setSortBy: (value: PaymentSortOption) => void;
  projects: Project[];
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(300px,1fr)_220px_220px_110px_170px]">
      <label className="block">
        <span className="sr-only">Search payments</span>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search payments by project, reference or type..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </label>

      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value as PaymentStatusFilter)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      >
        <option value="ALL">All Statuses</option>
        <option value="UNPAID">Unpaid</option>
        <option value="PENDING_CONFIRMATION">Awaiting Confirmation</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="REJECTED">Rejected</option>
      </select>

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

      <button
        type="button"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-[#0064E0]"
        title="Filters apply automatically"
      >
        <SlidersHorizontal size={16} />
        Filter
      </button>

      <select
        value={sortBy}
        onChange={(event) => setSortBy(event.target.value as PaymentSortOption)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      >
        <option value="NEWEST">Sort: Newest</option>
        <option value="OLDEST">Sort: Oldest</option>
        <option value="AMOUNT_HIGH">Amount: High</option>
        <option value="AMOUNT_LOW">Amount: Low</option>
        <option value="STATUS">Sort: Status</option>
      </select>
    </div>
  );
}
