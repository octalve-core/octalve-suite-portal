"use client";

import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { useApp } from "../../AppContext";
import { ClientManualPaymentModal } from "../shared/ClientManualPaymentModal";
import { ClientReviewModal } from "../shared/ClientReviewModal";
import { ClientDashboardHero } from "./ClientDashboardHero";
import { ClientDashboardStats } from "./ClientDashboardStats";
import { ClientDeliverablesPanel } from "./ClientDeliverablesPanel";
import { ClientEmptyDashboard } from "./ClientEmptyDashboard";
import { ClientPhaseTimeline } from "./ClientPhaseTimeline";
import { ClientRecentActivity } from "./ClientRecentActivity";
import {
  getPaymentBlock,
  projectProgress,
} from "./client-dashboard-utils";

export function ClientDashboard() {
  const { currentUser, clientProjects, selectedProject } = useApp();

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [reviewProjectId, setReviewProjectId] = useState<string | null>(null);
  const [walletAvailable, setWalletAvailable] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadWallet() {
      try {
        const wallet = await api.wallet.get();

        if (mounted) {
          setWalletAvailable(wallet.availableBalance ?? 0);
        }
      } catch {
        if (mounted) {
          setWalletAvailable(null);
        }
      }
    }

    void loadWallet();

    return () => {
      mounted = false;
    };
  }, [currentUser?.id]);

  if (!clientProjects.length) {
    return (
      <ClientEmptyDashboard
        title={
          currentUser?.company ??
          currentUser?.name ??
          "Your Octalve project workspace is ready."
        }
      />
    );
  }

  const project = selectedProject ?? clientProjects[0];
  const paymentBlock = getPaymentBlock(project);
  const progress = projectProgress(project);

  const approvedPhases = project.phases.filter(
    (phase) => phase.status === "APPROVED",
  ).length;

  const pendingApprovals = project.phases.filter(
    (phase) => phase.status === "AWAITING_APPROVAL",
  ).length;

  const deliverableLinks = project.phases.flatMap((phase) =>
    phase.deliverables.filter(
      (deliverable) => deliverable.visibleToClient && deliverable.link,
    ),
  );

  const recentMessages = useMemo(
    () =>
      project.phases
        .flatMap((phase) => phase.messages)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 4),
    [project.phases],
  );

  const outstandingPayments = project.payments.filter(
    (payment) => payment.status === "UNPAID",
  ).length;

  const clientName =
    currentUser?.company ||
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "Client";

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-5">
        <ClientDashboardHero
          project={project}
          userName={clientName}
          walletAvailable={walletAvailable}
        />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <ClientDashboardStats
            progress={progress}
            approvedPhases={approvedPhases}
            totalPhases={project.phases.length}
            pendingApprovals={pendingApprovals}
            linksCount={deliverableLinks.length}
            outstandingPayments={outstandingPayments}
            paymentBlock={paymentBlock}
            onPay={(nextPaymentId) => setPaymentId(nextPaymentId)}
          />

          <ClientPhaseTimeline phases={project.phases} />
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <ClientDeliverablesPanel links={deliverableLinks} />
          <ClientRecentActivity messages={recentMessages} />
        </section>

        {project.status === "COMPLETED" ? (
          <section className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-emerald-950">
                  Project completed
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-emerald-800">
                  Share your feedback so we can improve future Octalve delivery experiences.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReviewProjectId(project.id)}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
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