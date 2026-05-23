"use client";

import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/lib/types";
import { api } from "@/lib/api";
import { useApp } from "../../AppContext";
import { ClientManualPaymentModal } from "../shared/ClientManualPaymentModal";
import { ClientReviewModal } from "../shared/ClientReviewModal";
import { ClientActivePhaseCard } from "./ClientActivePhaseCard";
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

  const outstandingPayments = project.payments.filter(
    (payment) => payment.status === "UNPAID",
  ).length;

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-5">
        <ClientDashboardHero
          project={project}
          walletAvailable={walletAvailable}
          userName={
            currentUser?.name ||
            currentUser?.email?.split("@")[0] ||
            "there"
          }
        />

        <ClientDashboardStats
          progress={progress}
          approvedPhases={approvedPhases}
          totalPhases={project.phases.length}
          pendingApprovals={pendingApprovals}
          linksCount={links.length}
          outstandingPayments={outstandingPayments}
        />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          {block ? (
            <ClientPaymentNotice
              block={block}
              onPay={(selectedPaymentId) => setPaymentId(selectedPaymentId)}
            />
          ) : (
            <section className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-emerald-900">
                No payment required
              </h2>
              <p className="mt-1 text-sm font-medium leading-6 text-emerald-700">
                There is no immediate payment action required for this project.
              </p>
            </section>
          )}

          <ClientActivePhaseCard phase={activePhase} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <ClientPhaseTimeline phases={project.phases} />
          <ClientDeliverablesPanel links={links} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <ClientRecentActivity messages={recentMessages} />

          {project.status === "COMPLETED" ? (
            <section className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-5">
              <strong className="block text-sm font-semibold text-emerald-800">
                Leave a project review
              </strong>
              <p className="mt-1 text-sm font-medium leading-6 text-emerald-700">
                This project is completed. Share your feedback and help us improve future delivery.
              </p>

              <button
                type="button"
                onClick={() => setReviewProjectId(project.id)}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Leave Review
              </button>
            </section>
          ) : (
            <div className="hidden xl:block" />
          )}
        </section>
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
