import { Search } from "lucide-react";
import type { Project } from "@/lib/types";
import type { PhaseStatusFilter } from "./client-phases-utils";

export function ClientPhaseFilters({
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
  statusFilter: PhaseStatusFilter;
  setStatusFilter: (value: PhaseStatusFilter) => void;
  projectFilter: string;
  setProjectFilter: (value: string) => void;
  projects: Project[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_240px]">
      <label className="block">
        <span className="sr-only">Search phases</span>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={17}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search phase, project, description..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </label>

      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value as PhaseStatusFilter)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      >
        <option value="ALL">All Status</option>
        <option value="AWAITING_APPROVAL">Awaiting Approval</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="CHANGES_REQUESTED">Changes Requested</option>
        <option value="APPROVED">Approved</option>
        <option value="NOT_STARTED">Not Started</option>
        <option value="LOCKED">Locked</option>
      </select>

      <select
        value={projectFilter}
        onChange={(event) => setProjectFilter(event.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
      >
        <option value="ACTIVE">Current active project</option>
        <option value="ALL">All Projects</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title}
          </option>
        ))}
      </select>
    </div>
  );
}
