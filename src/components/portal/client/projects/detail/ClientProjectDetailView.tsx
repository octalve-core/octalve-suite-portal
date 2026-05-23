"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { useApp } from "../../../AppContext";
import { ClientProjectDetailSummary } from "./ClientProjectDetailSummary";
import { ClientProjectDetailTabs } from "./ClientProjectDetailTabs";
import { ClientProjectNotesPanel } from "./ClientProjectNotesPanel";
import { ClientProjectPhaseAccordion } from "./ClientProjectPhaseAccordion";
import { ClientProjectTeamPanel } from "./ClientProjectTeamPanel";
import type { ProjectDetailTab } from "./client-project-detail-utils";
import { getManager } from "./client-project-detail-utils";

function ProjectNotFound() {
  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid min-h-80 place-items-center rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
            Project not found
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            This project may have been removed or may not belong to your client workspace.
          </p>

          <Link
            href="/client/projects"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white"
          >
            Back to Projects
          </Link>
        </div>
      </section>
    </main>
  );
}

export function ClientProjectDetailView({ projectId }: { projectId: string }) {
  const { clientProjects, currentUser, setSelectedProjectId, state } = useApp();

  const project = useMemo(
    () => clientProjects.find((item) => item.id === projectId),
    [clientProjects, projectId],
  );

  const [activeTab, setActiveTab] = useState<ProjectDetailTab>("phases");
  const [activePhaseId, setActivePhaseId] = useState<string | undefined>(
    project?.phases[0]?.id,
  );

  useEffect(() => {
    if (project?.id) {
      setSelectedProjectId(project.id);
    }
  }, [project?.id, setSelectedProjectId]);

  useEffect(() => {
    if (project?.phases.length && !project.phases.some((phase) => phase.id === activePhaseId)) {
      setActivePhaseId(project.phases[0].id);
    }
  }, [activePhaseId, project?.phases]);

  if (!project) {
    return <ProjectNotFound />;
  }

  const manager = getManager(project, state.users);

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6">
        <div>
          <Link
            href="/client/projects"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 transition hover:text-[#0064E0]"
          >
            <ArrowLeft size={17} />
            Back to Projects
          </Link>

          <h1 className="mt-6 text-[34px] font-semibold leading-tight tracking-[-0.065em] text-slate-950 sm:text-[42px]">
            Project Phases
          </h1>

          <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-slate-500 sm:text-[15px]">
            Track and manage project progress through structured phases and deliverables.
          </p>
        </div>

        <ClientProjectDetailSummary project={project} manager={manager} />

        <ClientProjectDetailTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {activeTab === "phases" ? (
          <ClientProjectPhaseAccordion
            project={project}
            activePhaseId={activePhaseId}
            setActivePhaseId={setActivePhaseId}
          />
        ) : null}

        {activeTab === "team" ? (
          <ClientProjectTeamPanel
            project={project}
            users={state.users}
            currentUser={currentUser}
          />
        ) : null}

        {activeTab === "notes" ? (
          <ClientProjectNotesPanel project={project} />
        ) : null}
      </div>
    </main>
  );
}
