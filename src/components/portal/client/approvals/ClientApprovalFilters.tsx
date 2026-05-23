import { Search, SlidersHorizontal } from "lucide-react";
import type { Project } from "@/lib/types";
import type {
  ApprovalSortOption,
  ApprovalStatusFilter,
} from "./client-approvals-utils";

export function ClientApprovalFilters({
  query,
  setQuery,
  projectFilter,
  setProjectFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  projects,
}: {
  query: string;
  setQuery: (value: string) => void;
  projectFilter: string;
  setProjectFilter: (value: string) => void;
  statusFilter: ApprovalStatusFilter;
  setStatusFilter: (value: ApprovalStatusFilter) => void;
  sortBy: ApprovalSortOption;
  setSortBy: (value: ApprovalSortOption) => void;
  projects: Project[];
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(300px,1fr)_240px_240px_110px_170px]">
      <label className="block">
        <span className="sr-only">Search approvals</span>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search approvals by phase, project or reference..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </label>

      <select
        value={projectFilter}
        onChange={(event) => setProjectFilter(event.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      >
        <option value="all">All Projects</option>
        <option value="active">Current active project</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title}
          </option>
        ))}
      </select>

      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value as ApprovalStatusFilter)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      >
        <option value="all">All Statuses</option>
        <option value="awaiting">Awaiting Review</option>
        <option value="approved">Approved</option>
        <option value="changes">Changes Requested</option>
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
        onChange={(event) => setSortBy(event.target.value as ApprovalSortOption)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      >
        <option value="NEWEST">Sort: Newest</option>
        <option value="OLDEST">Sort: Oldest</option>
        <option value="PROJECT">Sort: Project</option>
        <option value="STATUS">Sort: Status</option>
      </select>
    </div>
  );
}
