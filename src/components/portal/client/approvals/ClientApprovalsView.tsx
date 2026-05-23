"use client";

import { useMemo, useState } from "react";

import { useApp } from "../../AppContext";
import { ClientApprovalFilters } from "./ClientApprovalFilters";
import { ClientApprovalList } from "./ClientApprovalList";
import { ClientApprovalStats } from "./ClientApprovalStats";
import { ClientApprovalsHeader } from "./ClientApprovalsHeader";
import { ClientRequestChangeModal } from "./ClientRequestChangeModal";
import type { ApprovalRow, ApprovalStatusFilter } from "./client-approvals-utils";
import {
  approvalMatchesSearch,
  filterApprovalStatus,
} from "./client-approvals-utils";

export function ClientApprovalsView() {
  const { approvePhase, clientProjects, requestChanges, selectedProject } = useApp();

  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState(selectedProject?.id ? "active" : "all");
  const [statusFilter, setStatusFilter] = useState<ApprovalStatusFilter>("awaiting");
  const [changeRow, setChangeRow] = useState<ApprovalRow | null>(null);
  const [loadingAction, setLoadingAction] = useState("");

  const rows = useMemo<ApprovalRow[]>(() => {
    return clientProjects.flatMap((project) =>
      project.phases.map((phase) => ({
        project,
        phase,
      })),
    );
  }, [clientProjects]);

  const awaiting = rows.filter((row) => row.phase.status === "AWAITING_APPROVAL");
  const approved = rows.filter((row) => row.phase.status === "APPROVED");
  const changes = rows.filter((row) => row.phase.status === "CHANGES_REQUESTED");

  const filteredRows = useMemo(() => {
    return rows
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
  }, [projectFilter, query, rows, selectedProject, statusFilter]);

  async function handleApprove(row: ApprovalRow) {
    setLoadingAction(`approve-${row.phase.id}`);

    try {
      await approvePhase(row.phase.id);
    } finally {
      setLoadingAction("");
    }
  }

  async function submitChanges(text: string) {
    if (!changeRow) return;

    await requestChanges(changeRow.phase.id, text);
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6">
        <ClientApprovalsHeader
          awaiting={awaiting.length}
          approved={approved.length}
          changes={changes.length}
        />

        <ClientApprovalStats
          awaiting={awaiting.length}
          approved={approved.length}
          changes={changes.length}
        />

        <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                  Approval Queue
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Review phase submissions by project and approval status.
                </p>
              </div>

              <div className="xl:min-w-[820px]">
                <ClientApprovalFilters
                  query={query}
                  setQuery={setQuery}
                  projectFilter={projectFilter}
                  setProjectFilter={setProjectFilter}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  projects={clientProjects}
                />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <ClientApprovalList
              rows={filteredRows}
              loadingAction={loadingAction}
              onApprove={(row) => void handleApprove(row)}
              onRequestChanges={setChangeRow}
            />
          </div>
        </section>
      </div>

      {changeRow ? (
        <ClientRequestChangeModal
          row={changeRow}
          onClose={() => setChangeRow(null)}
          onSubmit={submitChanges}
        />
      ) : null}
    </main>
  );
}
