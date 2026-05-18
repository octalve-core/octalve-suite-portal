"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, CreditCard, XCircle } from "lucide-react";
import { useApp } from "./AppContext";
import { Badge, Button, Card, statusClass, statusLabel } from "./UI";
import {
  WorkspaceActionCard,
  WorkspaceEmptyPanel,
  WorkspaceListIcons,
  WorkspaceListPanel,
  WorkspaceSectionHero,
  WorkspaceStatStrip,
} from "./WorkspaceLists";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function normalizeStatus(status: unknown) {
  return String(status ?? "UNPAID");
}

function isConfirmedStatus(status: unknown) {
  return normalizeStatus(status) === "CONFIRMED";
}

function paymentTone(status: unknown) {
  const value = normalizeStatus(status);

  if (value === "CONFIRMED") return "green";
  if (value === "REJECTED") return "red";
  if (value === "PENDING_CONFIRMATION") return "orange";

  return "slate";
}

function paymentPriority(status: unknown) {
  const value = normalizeStatus(status);

  if (value === "PENDING_CONFIRMATION") return 0;
  if (value === "UNPAID") return 1;
  if (value === "CONFIRMED") return 2;
  if (value === "REJECTED") return 3;

  return 9;
}

export function AdminPaymentsManager() {
  const { state, refresh } = useApp();

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const payments = useMemo(() => {
    return state.projects
      .flatMap((project) =>
        project.payments.map((payment) => ({
          payment: payment as any,
          project,
          client: state.users.find((user) => user.id === project.clientId) ?? null,
        })),
      )
      .sort((a, b) => paymentPriority(a.payment.status) - paymentPriority(b.payment.status));
  }, [state.projects, state.users]);

  const pending = payments.filter(
    ({ payment }) => normalizeStatus(payment.status) === "PENDING_CONFIRMATION",
  );

  const unpaid = payments.filter(
    ({ payment }) => normalizeStatus(payment.status) === "UNPAID",
  );

  const confirmed = payments.filter(({ payment }) =>
    isConfirmedStatus(payment.status),
  );

  const rejected = payments.filter(
    ({ payment }) => normalizeStatus(payment.status) === "REJECTED",
  );

  async function updatePayment(paymentId: string, action: "confirm" | "reject") {
    setError("");
    setLoadingId(`${paymentId}-${action}`);

    try {
      const response = await fetch(`/api/payments/${paymentId}/${action}`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? `Failed to ${action} payment.`);
      }

      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to ${action} payment.`);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="content">
      <WorkspaceSectionHero
        eyebrow="Finance Control"
        title="Payments"
        subtitle="Review client payment confirmations, approve valid payments, and reject invalid submissions."
        meta={
          <>
            <Badge className="badge-orange">{pending.length} Pending Confirmation</Badge>
            <Badge className="badge-green">{confirmed.length} Confirmed</Badge>
            <Badge className="badge-red">{rejected.length} Rejected</Badge>
          </>
        }
      />

      <WorkspaceStatStrip
        items={[
          {
            label: "Pending Confirmation",
            value: pending.length,
            tone: pending.length ? "orange" : "slate",
            icon: <Clock3 size={18} />,
          },
          {
            label: "Unpaid",
            value: unpaid.length,
            tone: unpaid.length ? "red" : "slate",
            icon: <CreditCard size={18} />,
          },
          {
            label: "Confirmed",
            value: confirmed.length,
            tone: "green",
            icon: <CheckCircle2 size={18} />,
          },
          {
            label: "Rejected",
            value: rejected.length,
            tone: rejected.length ? "red" : "slate",
            icon: <XCircle size={18} />,
          },
        ]}
      />

      {error && (
        <Card className="card-body" style={{ marginBottom: 18 }}>
          <p className="form-error">{error}</p>
        </Card>
      )}

      <WorkspaceListPanel
        title="Payment Queue"
        subtitle="Newest payment records across all client projects."
      >
        {payments.length ? (
          payments.map(({ payment, project, client }) => {
            const status = normalizeStatus(payment.status);
            const canReview = status === "PENDING_CONFIRMATION";

            return (
              <WorkspaceActionCard
                key={payment.id}
                title={`${payment.label ?? "Project Payment"} • ${formatMoney(Number(payment.amount ?? 0))}`}
                subtitle={`${project.title} • ${client?.name ?? project.businessName}`}
                icon={WorkspaceListIcons.document}
                tone={paymentTone(status) as any}
                badge={
                  <Badge className={statusClass(payment.status)}>
                    {statusLabel(payment.status)}
                  </Badge>
                }
                meta={
                  <>
                    <span>{project.projectCode}</span>
                    <span>
                      Due{" "}
                      {payment.dueDate
                        ? new Date(payment.dueDate).toLocaleDateString("en-NG")
                        : "not set"}
                    </span>
                    {payment.confirmedAt && (
                      <span>
                        Confirmed {new Date(payment.confirmedAt).toLocaleDateString("en-NG")}
                      </span>
                    )}
                  </>
                }
                action={
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {canReview && (
                      <>
                        <Button
                          loading={loadingId === `${payment.id}-confirm`}
                          onClick={() => updatePayment(payment.id, "confirm")}
                        >
                          Confirm
                        </Button>

                        <Button
                          variant="secondary"
                          loading={loadingId === `${payment.id}-reject`}
                          onClick={() => updatePayment(payment.id, "reject")}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    <Link href={`/admin/projects/${project.id}`} className="btn btn-secondary">
                      Open Project
                    </Link>
                  </div>
                }
              />
            );
          })
        ) : (
          <WorkspaceEmptyPanel
            title="No payment records yet"
            body="Project payment schedules will appear here when projects are created."
            icon={WorkspaceListIcons.document}
          />
        )}
      </WorkspaceListPanel>
    </div>
  );
}
