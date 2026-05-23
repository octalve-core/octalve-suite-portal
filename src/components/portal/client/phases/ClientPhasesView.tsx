"use client";

import { useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import Link from "next/link";

import { useApp } from "../../AppContext";
import { ClientPhaseFilters } from "./ClientPhaseFilters";
import { ClientPhaseList } from "./ClientPhaseList";
import { ClientPhaseStats } from "./ClientPhaseStats";
import { ClientPhasesHeader } from "./ClientPhasesHeader";
import type { ClientPhaseRow, PhaseStatusFilter } from "./client-phases-utils";
import {
  PHASE_STATUS_ORDER,
  isProjectPhaseLocked,
  phaseMatchesSearch,
} from "./client-phases-utils";

export function ClientPhasesView() {
  const { clientProjects, selectedProject } = useApp();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PhaseStatusFilter>("ALL");
  const [projectFilter, setProjectFilter] = useState(selectedProject?.id ? "ACTIVE" : "ALL");

  const rows = useMemo<ClientPhaseRow[]>(() => {
    return clientProjects
      .flatMap((project) =>
        project.phases.map((phase) => ({
          project,
          phase,
        })),
      )
      .sort((a, b) => {
        const statusDiff =
          PHASE_STATUS_ORDER[a.phase.status] - PHASE_STATUS_ORDER[b.phase.status];

        if (statusDiff !== 0) return statusDiff;

        return a.phase.phaseNumber - b.phase.phaseNumber;
      });
  }, [clientProjects]);

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) =>
        projectFilter === "ALL"
          ? true
          : projectFilter === "ACTIVE"
            ? selectedProject
              ? row.project.id === selectedProject.id
              : true
            : row.project.id === projectFilter,
      )
      .filter((row) =>
        statusFilter === "ALL" ? true : row.phase.status === statusFilter,
      )
      .filter((row) => phaseMatchesSearch(row, query));
  }, [projectFilter, query, rows, selectedProject, statusFilter]);

  const activeProjectLocked = selectedProject
    ? isProjectPhaseLocked(selectedProject)
    : false;

  const awaitingApproval = rows.filter(
    (row) => row.phase.status === "AWAITING_APPROVAL",
  ).length;

  if (!clientProjects.length) {
    return (
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid min-h-80 place-items-center rounded-[30px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              No phases yet
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              Project phases will appear once Octalve approves and opens your project workspace.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6">
        <ClientPhasesHeader
          totalPhases={rows.length}
          awaitingApproval={awaitingApproval}
          locked={activeProjectLocked}
        />

        {activeProjectLocked ? (
          <section className="rounded-[24px] border border-orange-200 bg-orange-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                  Project tracking is locked
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-orange-700">
                  Complete the required approval or payment step to unlock full phase tracking.
                </p>
              </div>

              <Link
                href="/client/payments"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white"
              >
                <CreditCard size={17} />
                Open Payments
              </Link>
            </div>
          </section>
        ) : null}

        <ClientPhaseStats rows={rows} />

        <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                  Phase Workspace
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Filter by project and phase status to review each delivery stage.
                </p>
              </div>

              <div className="xl:min-w-[820px]">
                <ClientPhaseFilters
                  query={query}
                  setQuery={setQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  projectFilter={projectFilter}
                  setProjectFilter={setProjectFilter}
                  projects={clientProjects}
                />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <ClientPhaseList rows={filteredRows} />
          </div>
        </section>
      </div>
    </main>
  );
}
