"use client";

import { useMemo, useState } from "react";

import { useApp } from "../../AppContext";
import { ClientApprovalFilters } from "./ClientApprovalFilters";
import { ClientApprovalList } from "./ClientApprovalList";
import { ClientApprovalStats } from "./ClientApprovalStats";
import { ClientApprovalsHeader } from "./ClientApprovalsHeader";
import type {
  ApprovalRow,
  ApprovalSortOption,
  ApprovalStatusFilter,
} from "./client-approvals-utils";
import {
  approvalMatchesSearch,
  filterApprovalStatus,
  sortApprovalRows,
} from "./client-approvals-utils";

export function ClientApprovalsView() {
  const { clientProjects, selectedProject } = useApp();

  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<ApprovalStatusFilter>("all");
  const [sortBy, setSortBy] = useState<ApprovalSortOption>("NEWEST");

  const rows = useMemo<ApprovalRow[]>(() => {
    return clientProjects.flatMap((project) =>
      project.phases
        .filter((phase) =>
          ["AWAITING_APPROVAL", "APPROVED", "CHANGES_REQUESTED"].includes(
            phase.status,
          ),
        )
        .map((phase) => ({
          project,
          phase,
        })),
    );
  }, [clientProjects]);

  const awaiting = rows.filter((row) => row.phase.status === "AWAITING_APPROVAL");
  const approved = rows.filter((row) => row.phase.status === "APPROVED");
  const changes = rows.filter((row) => row.phase.status === "CHANGES_REQUESTED");

  const filteredRows = useMemo(() => {
    const filtered = rows
      .filter((row) =>
        projectFilter === "all"
          ? true
          : projectFilter === "active"
            ? selectedProject
              ? row.project.id === selectedProject.id
              : true
            : row.project.id === projectFilter,
      )
      .filter((row) => filterApprovalStatus(row, statusFilter))
      .filter((row) => approvalMatchesSearch(row, query));

    return sortApprovalRows(filtered, sortBy);
  }, [projectFilter, query, rows, selectedProject, sortBy, statusFilter]);

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-5">
        <ClientApprovalsHeader />

        <ClientApprovalStats
          awaiting={awaiting.length}
          approved={approved.length}
          changes={changes.length}
        />

        <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.055)]">
          <div className="p-4 sm:p-5">
            <ClientApprovalFilters
              query={query}
              setQuery={setQuery}
              projectFilter={projectFilter}
              setProjectFilter={setProjectFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              projects={clientProjects}
            />
          </div>

          <ClientApprovalList rows={filteredRows} />
        </section>
      </div>
    </main>
  );
}
