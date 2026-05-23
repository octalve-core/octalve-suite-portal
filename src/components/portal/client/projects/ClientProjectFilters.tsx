import { Search, SlidersHorizontal } from "lucide-react";
import type { PackageType } from "@/lib/types";
import { getPackageTitle } from "../../packageCatalog";
import type {
  ProjectPackageFilter,
  ProjectSortOption,
  ProjectStatusFilter,
} from "./client-projects-utils";

export function ClientProjectFilters({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  packageFilter,
  setPackageFilter,
  sortBy,
  setSortBy,
  packageOptions,
}: {
  query: string;
  setQuery: (value: string) => void;
  statusFilter: ProjectStatusFilter;
  setStatusFilter: (value: ProjectStatusFilter) => void;
  packageFilter: ProjectPackageFilter;
  setPackageFilter: (value: ProjectPackageFilter) => void;
  sortBy: ProjectSortOption;
  setSortBy: (value: ProjectSortOption) => void;
  packageOptions: PackageType[];
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(300px,1fr)_220px_240px_180px]">
      <label className="block">
        <span className="sr-only">Search projects</span>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </label>

      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value as ProjectStatusFilter)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      >
        <option value="ALL">All Status</option>
        <option value="APPROVED_AWAITING_DEPOSIT">Awaiting Deposit</option>
        <option value="DEPOSIT_PENDING_CONFIRMATION">Deposit Pending</option>
        <option value="ACTIVE">Active</option>
        <option value="AWAITING_BALANCE">Awaiting Balance</option>
        <option value="BALANCE_PENDING_CONFIRMATION">Balance Pending</option>
        <option value="COMPLETED">Completed</option>
        <option value="REJECTED">Rejected</option>
      </select>

      <select
        value={packageFilter}
        onChange={(event) => setPackageFilter(event.target.value as ProjectPackageFilter)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      >
        <option value="ALL">All Packages</option>
        {packageOptions.map((item) => (
          <option key={item} value={item}>
            {getPackageTitle(item)}
          </option>
        ))}
      </select>

      <select
        value={sortBy}
        onChange={(event) => setSortBy(event.target.value as ProjectSortOption)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      >
        <option value="NEWEST">Sort: Newest</option>
        <option value="OLDEST">Sort: Oldest</option>
        <option value="PROGRESS_HIGH">Progress: High</option>
        <option value="PROGRESS_LOW">Progress: Low</option>
        <option value="TITLE">Sort: Title</option>
      </select>

      <button
        type="button"
        className="hidden min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-[#0064E0] lg:hidden"
        title="Filters apply automatically"
      >
        <SlidersHorizontal size={16} />
        Filter
      </button>
    </div>
  );
}
