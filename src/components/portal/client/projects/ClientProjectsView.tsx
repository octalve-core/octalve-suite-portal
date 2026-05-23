"use client";

import { useMemo, useState } from "react";
import type { PackageType } from "@/lib/types";
import { useApp } from "../../AppContext";
import { ClientProjectFilters } from "./ClientProjectFilters";
import { ClientProjectList } from "./ClientProjectList";
import { ClientProjectsHeader } from "./ClientProjectsHeader";
import { ClientProjectsStats } from "./ClientProjectsStats";
import { ClientRecentProjectActivity } from "./ClientRecentProjectActivity";
import { ClientPendingRequestsPanel } from "./ClientPendingRequestsPanel";
import type {
  ProjectPackageFilter,
  ProjectSortOption,
  ProjectStatusFilter,
} from "./client-projects-utils";
import {
  rowMatchesProjectSearch,
  sortProjects,
} from "./client-projects-utils";

export function ClientProjectsView() {
  const { clientProjects, currentUser, setSelectedProjectId, state } = useApp();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("ALL");
  const [packageFilter, setPackageFilter] = useState<ProjectPackageFilter>("ALL");
  const [sortBy, setSortBy] = useState<ProjectSortOption>("NEWEST");

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
    const filtered = clientProjects
      .filter((project) =>
        statusFilter === "ALL" ? true : project.status === statusFilter,
      )
      .filter((project) =>
        packageFilter === "ALL" ? true : project.packageType === packageFilter,
      )
      .filter((project) => rowMatchesProjectSearch(project, query));

    return sortProjects(filtered, sortBy);
  }, [clientProjects, packageFilter, query, sortBy, statusFilter]);

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-5">
        <ClientProjectsHeader />

        <ClientProjectsStats projects={clientProjects} />

        <ClientPendingRequestsPanel requests={pendingRequests} />

        <section className="grid gap-5">
          <ClientProjectFilters
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            packageFilter={packageFilter}
            setPackageFilter={setPackageFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            packageOptions={packageOptions}
          />

          <ClientProjectList
            projects={filteredProjects}
            onSelect={setSelectedProjectId}
          />
        </section>

        <ClientRecentProjectActivity
          projects={clientProjects}
          onSelect={setSelectedProjectId}
        />
      </div>
    </main>
  );
}
