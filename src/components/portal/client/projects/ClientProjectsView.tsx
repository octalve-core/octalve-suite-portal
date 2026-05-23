"use client";

import { useMemo, useState } from "react";
import type { PackageType } from "@/lib/types";
import { useApp } from "../../AppContext";
import { ClientProjectFilters } from "./ClientProjectFilters";
import { ClientProjectList } from "./ClientProjectList";
import { ClientProjectsHeader } from "./ClientProjectsHeader";
import { ClientProjectsStats } from "./ClientProjectsStats";
import { ClientPendingRequestsPanel } from "./ClientPendingRequestsPanel";
import type {
  ProjectPackageFilter,
  ProjectStatusFilter,
} from "./client-projects-utils";
import { rowMatchesProjectSearch } from "./client-projects-utils";

export function ClientProjectsView() {
  const { clientProjects, currentUser, setSelectedProjectId, state } = useApp();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("ALL");
  const [packageFilter, setPackageFilter] = useState<ProjectPackageFilter>("ALL");

  const pendingRequests = useMemo(() => {
    return (state.requests ?? []).filter((request) => {
      const belongsToClient = currentUser?.id ? request.clientId === currentUser.id : true;

      return (
        belongsToClient &&
        ["PENDING_REVIEW", "INFO_REQUESTED"].includes(request.status)
      );
    });
  }, [currentUser?.id, state.requests]);

  const packageOptions = useMemo<PackageType[]>(() => {
    return Array.from(new Set(clientProjects.map((project) => project.packageType)));
  }, [clientProjects]);

  const filteredProjects = useMemo(() => {
    return clientProjects
      .filter((project) =>
        statusFilter === "ALL" ? true : project.status === statusFilter,
      )
      .filter((project) =>
        packageFilter === "ALL" ? true : project.packageType === packageFilter,
      )
      .filter((project) => rowMatchesProjectSearch(project, query));
  }, [clientProjects, packageFilter, query, statusFilter]);

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6">
        <ClientProjectsHeader
          totalProjects={clientProjects.length}
          pendingRequests={pendingRequests.length}
        />

        <ClientProjectsStats projects={clientProjects} />

        <ClientPendingRequestsPanel requests={pendingRequests} />

        <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                  Project Workspace
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Open a project to view its phases, deliverables, timeline, team and notes.
                </p>
              </div>

              <div className="xl:min-w-[780px]">
                <ClientProjectFilters
                  query={query}
                  setQuery={setQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  packageFilter={packageFilter}
                  setPackageFilter={setPackageFilter}
                  packageOptions={packageOptions}
                />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <ClientProjectList
              projects={filteredProjects}
              onSelect={setSelectedProjectId}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
