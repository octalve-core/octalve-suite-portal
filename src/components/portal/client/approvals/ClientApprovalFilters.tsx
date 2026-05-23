import { Search } from "lucide-react";
import type { Project } from "@/lib/types";
import type { ApprovalStatusFilter } from "./client-approvals-utils";

export function ClientApprovalFilters({
  query,
  setQuery,
  projectFilter,
  setProjectFilter,
  statusFilter,
  setStatusFilter,
  projects,
}: {
  query: string;
  setQuery: (value: string) => void;
  projectFilter: string;
  setProjectFilter: (value: string) => void;
  statusFilter: ApprovalStatusFilter;
  setStatusFilter: (value: ApprovalStatusFilter) => void;
  projects: Project[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px_220px]">
      <label className="block">
        <span className="sr-only">Search approvals</span>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={17}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search approval queue..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </label>

      <select
        value={projectFilter}
        onChange={(event) => setProjectFilter(event.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      >
        <option value="active">Current active project</option>
        <option value="all">All projects</option>
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
        <option value="awaiting">Awaiting Review</option>
        <option value="all">All Statuses</option>
        <option value="approved">Approved</option>
        <option value="changes">Changes Requested</option>
      </select>
    </div>
  );
}
