"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { useApp } from "../../AppContext";
import { ClientManualPaymentModal } from "../shared/ClientManualPaymentModal";
import { ClientReviewModal } from "../shared/ClientReviewModal";
import { ClientActivePhaseCard, ClientNextActionCard } from "./ClientActivePhaseCard";
import { ClientDashboardHero } from "./ClientDashboardHero";
import { ClientDashboardStats } from "./ClientDashboardStats";
import { ClientDeliverablesPanel } from "./ClientDeliverablesPanel";
import { ClientEmptyDashboard } from "./ClientEmptyDashboard";
import { ClientPaymentNotice } from "./ClientPaymentNotice";
import { ClientPhaseTimeline } from "./ClientPhaseTimeline";
import { ClientRecentActivity } from "./ClientRecentActivity";
import {
  getActivePhase,
  getPaymentBlock,
  projectProgress,
} from "./client-dashboard-utils";

export function ClientDashboard() {
  const { currentUser, clientProjects, selectedProject } = useApp();

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [reviewProjectId, setReviewProjectId] = useState<string | null>(null);

  if (!clientProjects.length) {
    return (
      <ClientEmptyDashboard
        title={currentUser?.company ?? currentUser?.name ?? "Your Octalve project workspace is ready."}
      />
    );
  }

  const project = selectedProject ?? clientProjects[0];
  const block = getPaymentBlock(project);
  const activePhase = getActivePhase(project);
  const progress = projectProgress(project);

  const approvedPhases = project.phases.filter(
    (phase) => phase.status === "APPROVED",
  ).length;

  const pendingApprovals = project.phases.filter(
    (phase) => phase.status === "AWAITING_APPROVAL",
  ).length;

  const links = project.phases.flatMap((phase) =>
    phase.deliverables.filter(
      (deliverable) => deliverable.visibleToClient && deliverable.link,
    ),
  );

  const recentMessages = project.phases
    .flatMap((phase) => phase.messages)
    .slice(-4)
    .reverse();

  const nextHref = block
    ? "/client/payments"
    : pendingApprovals
      ? "/client/approvals"
      : "/client/phases";

  const nextLabel = block
    ? "Open Payments"
    : pendingApprovals
      ? "Review Now"
      : "View Phases";

  const nextTitle = block
    ? block.title
    : pendingApprovals
      ? `Review and approve ${
          project.phases.find((phase) => phase.status === "AWAITING_APPROVAL")
            ?.title ?? "pending phase"
        }`
      : "No urgent action needed right now";

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6">
        <ClientDashboardHero
          project={project}
          userName={
            currentUser?.name ||
            currentUser?.email?.split("@")[0] ||
            "there"
          }
        />

        {block ? (
          <ClientPaymentNotice
            block={block}
            onPay={(selectedPaymentId) => setPaymentId(selectedPaymentId)}
          />
        ) : null}

        <ClientDashboardStats
          progress={progress}
          approvedPhases={approvedPhases}
          totalPhases={project.phases.length}
          pendingApprovals={pendingApprovals}
          linksCount={links.length}
        />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)]">
          <ClientActivePhaseCard phase={activePhase} progress={progress} />
          <ClientNextActionCard
            title={nextTitle}
            href={nextHref}
            label={nextLabel}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <ClientPhaseTimeline phases={project.phases} />
          <ClientDeliverablesPanel links={links} />
        </section>

        <ClientRecentActivity messages={recentMessages} />

        {project.status === "COMPLETED" ? (
          <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <strong className="block text-sm font-semibold text-emerald-800">
                  Leave a project review
                </strong>
                <p className="mt-1 text-sm font-medium leading-6 text-emerald-700">
                  This project is completed. Share your feedback and help us improve future delivery.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReviewProjectId(project.id)}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Leave Review
              </button>
            </div>
          </section>
        ) : null}
      </div>

      {reviewProjectId ? (
        <ClientReviewModal
          project={project as Project}
          onClose={() => setReviewProjectId(null)}
        />
      ) : null}

      {paymentId ? (
        <ClientManualPaymentModal
          project={project}
          paymentId={paymentId}
          onClose={() => setPaymentId(null)}
        />
      ) : null}
    </main>
  );
}
