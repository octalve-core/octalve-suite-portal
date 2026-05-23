"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Layers3 } from "lucide-react";

import { useApp } from "../../../AppContext";
import { ClientPhaseApprovalHistory } from "./ClientPhaseApprovalHistory";
import { ClientPhaseDeliverablesPanel } from "./ClientPhaseDeliverablesPanel";
import { ClientPhaseDetailHeader } from "./ClientPhaseDetailHeader";
import { ClientPhaseMetricStrip } from "./ClientPhaseMetricStrip";
import { ClientPhaseThreadPanel } from "./ClientPhaseThreadPanel";
import {
  canClientApprovePhase,
  getAssignee,
  getBackHref,
} from "./client-phase-detail-utils";

function PhaseNotFound() {
  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid min-h-80 place-items-center rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
            <Layers3 size={24} />
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
            Phase not found
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            This phase may have been removed or may not belong to your client workspace.
          </p>

          <Link
            href="/client/phases"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white"
          >
            Back to Phases
          </Link>
        </div>
      </section>
    </main>
  );
}

export function ClientPhaseDetailView({ phaseId }: { phaseId: string }) {
  const {
    approvePhase,
    clientProjects,
    currentUser,
    requestChanges,
    sendPhaseMessage,
    setSelectedProjectId,
    state,
  } = useApp();

  const project = useMemo(() => {
    return clientProjects.find((item) =>
      item.phases.some((phase) => phase.id === phaseId),
    );
  }, [clientProjects, phaseId]);

  const phase = useMemo(() => {
    return project?.phases.find((item) => item.id === phaseId);
  }, [phaseId, project?.phases]);

  const [loadingAction, setLoadingAction] = useState("");

  useEffect(() => {
    if (project?.id) {
      setSelectedProjectId(project.id);
    }
  }, [project?.id, setSelectedProjectId]);

  if (!project || !phase) {
    return <PhaseNotFound />;
  }

  const activeProject = project;
  const activePhase = phase;
  const assignee = getAssignee(activePhase, state.users);
  const backHref = getBackHref(activeProject);

  async function handleApprove() {
    setLoadingAction("approve");

    try {
      await approvePhase(activePhase.id);
    } finally {
      setLoadingAction("");
    }
  }

  async function handleSendMessage(message: string) {
    setLoadingAction("send");

    try {
      await sendPhaseMessage(activePhase.id, message);
    } finally {
      setLoadingAction("");
    }
  }

  async function handleRequestChanges(message: string) {
    setLoadingAction("changes");

    try {
      await requestChanges(activePhase.id, message);
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-5">
        <ClientPhaseDetailHeader
          phase={activePhase}
          project={activeProject}
          backHref={backHref}
          approveLoading={loadingAction === "approve"}
          onApprove={handleApprove}
        />

        <ClientPhaseMetricStrip
          project={activeProject}
          phase={activePhase}
          assignee={assignee}
        />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
          <div className="grid gap-5">
            <ClientPhaseDeliverablesPanel phase={activePhase} />
            <ClientPhaseApprovalHistory phase={activePhase} />
          </div>

          <ClientPhaseThreadPanel
            phase={activePhase}
            currentUserId={currentUser?.id}
            onSendMessage={handleSendMessage}
            onRequestChanges={handleRequestChanges}
            canRequestChanges={canClientApprovePhase(activePhase)}
            sending={loadingAction === "send"}
            requestingChanges={loadingAction === "changes"}
          />
        </section>
      </div>
    </main>
  );
}