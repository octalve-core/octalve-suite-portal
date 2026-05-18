"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, CreditCard } from "lucide-react";
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

function paymentTone(status: unknown) {
  const value = normalizeStatus(status);

  if (value === "CONFIRMED") return "green";
  if (value === "PENDING_CONFIRMATION") return "orange";
  if (value === "REJECTED") return "red";

  return "blue";
}

function paymentPriority(status: unknown) {
  const value = normalizeStatus(status);

  if (value === "UNPAID") return 0;
  if (value === "REJECTED") return 1;
  if (value === "PENDING_CONFIRMATION") return 2;
  if (value === "CONFIRMED") return 3;

  return 9;
}

export function ClientPaymentsManager() {
  const { clientProjects, selectedProject, refresh } = useApp();

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [projectFilter, setProjectFilter] = useState(selectedProject?.id ?? "active");
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "pending" | "confirmed" | "rejected">("unpaid");

  const payments = useMemo(() => {
    return clientProjects
      .flatMap((project) =>
        project.payments.map((payment) => ({
          payment: payment as any,
          project,
        })),
      )
      .sort((a, b) => paymentPriority(a.payment.status) - paymentPriority(b.payment.status));
  }, [clientProjects]);

  const unpaid = payments.filter(({ payment }) => normalizeStatus(payment.status) === "UNPAID");
  const pending = payments.filter(({ payment }) => normalizeStatus(payment.status) === "PENDING_CONFIRMATION");
  const confirmed = payments.filter(({ payment }) => normalizeStatus(payment.status) === "CONFIRMED");
  const rejected = payments.filter(({ payment }) => normalizeStatus(payment.status) === "REJECTED");

  const filtered = payments.filter(({ payment, project }) => {
    const status = normalizeStatus(payment.status);

    const matchesProject =
      projectFilter === "all"
        ? true
        : projectFilter === "active"
          ? !selectedProject || project.id === selectedProject.id
          : project.id === projectFilter;

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "unpaid"
          ? status === "UNPAID"
          : statusFilter === "pending"
            ? status === "PENDING_CONFIRMATION"
            : statusFilter === "confirmed"
              ? status === "CONFIRMED"
              : status === "REJECTED";

    return matchesProject && matchesStatus;
  });

  async function markPaid(paymentId: string) {
    setError("");
    setLoadingId(paymentId);

    try {
      const response = await fetch(`/api/payments/${paymentId}/mark-paid`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to mark payment as paid.");
      }

      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to mark payment as paid.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="content">
      <WorkspaceSectionHero
        eyebrow="Client Billing"
        title="Payments"
        subtitle="Track project payments by project and status so every deposit, balance, and confirmation is clear."
        meta={
          <>
            <Badge className="badge-blue">{unpaid.length} Unpaid</Badge>
            <Badge className="badge-orange">{pending.length} Awaiting Confirmation</Badge>
            <Badge className="badge-green">{confirmed.length} Confirmed</Badge>
          </>
        }
      />

      <WorkspaceStatStrip
        items={[
          {
            label: "Unpaid",
            value: unpaid.length,
            tone: unpaid.length ? "blue" : "slate",
            icon: <CreditCard size={18} />,
          },
          {
            label: "Awaiting Confirmation",
            value: pending.length,
            tone: pending.length ? "orange" : "slate",
            icon: <Clock3 size={18} />,
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
            icon: WorkspaceListIcons.document,
          },
        ]}
      />

      {error && (
        <Card className="card-body" style={{ marginBottom: 18 }}>
          <p className="form-error">{error}</p>
        </Card>
      )}

      <div className="client-filter-bar">
        <label>
          <span>Project</span>
          <select
            className="input"
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
          >
            <option value="active">Current active project</option>
            <option value="all">All projects</option>
            {clientProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Payment Status</span>
          <select
            className="input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          >
            <option value="unpaid">Unpaid</option>
            <option value="all">All statuses</option>
            <option value="pending">Awaiting confirmation</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>

      <WorkspaceListPanel
        title="Payment Schedule"
        subtitle="Filtered by project and status to avoid mixing payment records across projects."
      >
        {filtered.length ? (
          filtered.map(({ payment, project }) => {
            const status = normalizeStatus(payment.status);
            const canMarkPaid = status === "UNPAID" || status === "REJECTED";

            return (
              <WorkspaceActionCard
                key={payment.id}
                title={`${payment.label ?? payment.type ?? "Project Payment"} • ${formatMoney(Number(payment.amount ?? 0))}`}
                subtitle={`${project.title} • ${project.projectCode}`}
                icon={WorkspaceListIcons.document}
                tone={paymentTone(status) as any}
                badge={
                  <Badge className={statusClass(payment.status)}>
                    {statusLabel(payment.status)}
                  </Badge>
                }
                meta={
                  <>
                    <span>{payment.type ?? "Payment"}</span>
                    <span>
                      Due{" "}
                      {payment.dueDate
                        ? new Date(payment.dueDate).toLocaleDateString("en-NG")
                        : "not set"}
                    </span>
                    {status === "PENDING_CONFIRMATION" && (
                      <span>Admin is reviewing your payment</span>
                    )}
                  </>
                }
                action={
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {canMarkPaid && (
                      <Button
                        loading={loadingId === payment.id}
                        onClick={() => markPaid(payment.id)}
                      >
                        I Have Paid
                      </Button>
                    )}

                    <Link href={`/client/projects/${project.id}`} className="btn btn-secondary">
                      Open Project
                    </Link>
                  </div>
                }
              />
            );
          })
        ) : (
          <WorkspaceEmptyPanel
            title="No payments match this filter"
            body="Switch project or payment status to see other records."
            icon={WorkspaceListIcons.document}
          />
        )}
      </WorkspaceListPanel>
    </div>
  );
}
