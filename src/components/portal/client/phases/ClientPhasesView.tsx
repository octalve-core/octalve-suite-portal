"use client";

import { useMemo } from "react";
import { CreditCard } from "lucide-react";
import Link from "next/link";

import { useApp } from "../../AppContext";
import { ClientPhaseList } from "./ClientPhaseList";
import { ClientPhaseStats } from "./ClientPhaseStats";
import { ClientPhasesHeader } from "./ClientPhasesHeader";
import type { ClientPhaseRow } from "./client-phases-utils";
import {
  PROJECT_STATUS_LABELS,
  isProjectPhaseLocked,
  projectStatusTone,
} from "./client-phases-utils";

export function ClientPhasesView() {
  const {
    clientProjects,
    selectedProject,
    setSelectedProjectId,
  } = useApp();

  const activeProject = selectedProject ?? clientProjects[0];

  const rows = useMemo<ClientPhaseRow[]>(() => {
    if (!activeProject) return [];

    return activeProject.phases
      .map((phase) => ({
        project: activeProject,
        phase,
      }))
      .sort((a, b) => a.phase.phaseNumber - b.phase.phaseNumber);
  }, [activeProject]);

  const activeProjectLocked = activeProject
    ? isProjectPhaseLocked(activeProject)
    : false;

  if (!clientProjects.length) {
    return (
      <main className="mx-auto w-full max-w-[1500px] px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:py-6">
        <section className="grid min-h-80 place-items-center rounded-[30px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
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
    <main className="mx-auto w-full max-w-[1500px] px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:py-6">
      <div className="grid gap-5">
        <ClientPhasesHeader
          projects={clientProjects}
          selectedProjectId={activeProject?.id}
          onSelectProject={setSelectedProjectId}
        />

        {activeProjectLocked && activeProject ? (
          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.02)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span
                  className={[
                    "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                    projectStatusTone(activeProject.status),
                  ].join(" ")}
                >
                  {PROJECT_STATUS_LABELS[activeProject.status]}
                </span>

                <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                  <strong className="font-semibold text-slate-950">
                    Project tracking is locked
                  </strong>{" "}
                  until the required approval/payment step is completed.
                </p>
              </div>

              <Link
                href="/client/payments"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:bg-[#0052B8]"
              >
                <CreditCard size={17} />
                Open Payments
              </Link>
            </div>
          </section>
        ) : null}

        <ClientPhaseStats rows={rows} />

        <ClientPhaseList rows={rows} />
      </div>
    </main>
  );
}
