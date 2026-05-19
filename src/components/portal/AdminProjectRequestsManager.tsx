"use client";


import { getPackageTitle } from "./packageCatalog";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock3, FileText, XCircle } from "lucide-react";
import type { ProjectRequest } from "@/lib/types";
import { useApp } from "./AppContext";
import { Badge, Button, Card, Input, Textarea, packageClass, statusClass, statusLabel } from "./UI";
import {
  WorkspaceActionCard,
  WorkspaceEmptyPanel,
  WorkspaceListIcons,
  WorkspaceListPanel,
  WorkspaceSectionHero,
  WorkspaceStatStrip,
} from "./WorkspaceLists";

type ApprovalForm = {
  totalAmount: number;
  depositAmount: number;
  projectManagerId: string;
  targetDate: string;
  internalNotes: string;
};

const DEFAULT_APPROVAL_FORM: ApprovalForm = {
  totalAmount: 750000,
  depositAmount: 350000,
  projectManagerId: "",
  targetDate: "",
  internalNotes: "",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function AdminProjectRequestsManager() {
  const router = useRouter();
  const { state, approveProjectRequest, refresh } = useApp();

  const [activeId, setActiveId] = useState<string | null>(
    state.requests.find((request) => request.status === "PENDING_REVIEW")?.id ??
      state.requests[0]?.id ??
      null,
  );

  const [form, setForm] = useState<ApprovalForm>({
    ...DEFAULT_APPROVAL_FORM,
    projectManagerId:
      state.users.find((user) => user.role === "PROJECT_MANAGER")?.id ?? "",
  });

  const [loadingAction, setLoadingAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  const activeRequest = state.requests.find((request) => request.id === activeId) ?? null;

  const pending = state.requests.filter((request) => request.status === "PENDING_REVIEW");
  const approved = state.requests.filter((request) => request.status === "APPROVED");
  const rejected = state.requests.filter((request) => request.status === "REJECTED");

  const managers = state.users.filter(
    (user) => user.role === "PROJECT_MANAGER" || user.role === "SUPER_ADMIN",
  );

  const balanceAmount = Math.max(
    Number(form.totalAmount || 0) - Number(form.depositAmount || 0),
    0,
  );

  const sortedRequests = useMemo(() => {
    return [...state.requests].sort((a, b) => {
      const order = {
        PENDING_REVIEW: 0,
        INFO_REQUESTED: 1,
        APPROVED: 2,
        REJECTED: 3,
      } as Record<ProjectRequest["status"], number>;

      return order[a.status] - order[b.status];
    });
  }, [state.requests]);

  function selectRequest(request: ProjectRequest) {
    setActiveId(request.id);
    setError("");

    setForm({
      ...DEFAULT_APPROVAL_FORM,
      projectManagerId:
        state.users.find((user) => user.role === "PROJECT_MANAGER")?.id ?? "",
      internalNotes: request.additionalNotes ?? "",
    });
  }

  async function approveActiveRequest() {
    if (!activeRequest) return;

    if (form.totalAmount <= 0 || form.depositAmount <= 0) {
      setError("Enter a valid total amount and deposit amount.");
      return;
    }

    if (form.depositAmount > form.totalAmount) {
      setError("Deposit cannot be higher than total project amount.");
      return;
    }

    setError("");
    setLoadingAction("approve");

    try {
      const projectId = await approveProjectRequest(activeRequest.id, {
        totalAmount: Number(form.totalAmount),
        depositAmount: Number(form.depositAmount),
        balanceAmount,
        projectManagerId: form.projectManagerId || undefined,
        targetDate: form.targetDate || undefined,
        internalNotes: form.internalNotes || undefined,
      });

      await refresh();
      router.push(`/admin/projects/${projectId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to approve request.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function rejectActiveRequest() {
    if (!activeRequest) return;

    const ok = confirm(
      `Reject "${activeRequest.projectName}"? This will mark the request as rejected.`,
    );

    if (!ok) return;

    setError("");
    setLoadingAction("reject");

    try {
      const response = await fetch(`/api/project-requests/${activeRequest.id}/reject`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to reject request.");
      }

      await refresh();
      setActiveId(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reject request.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="content">
      <WorkspaceSectionHero
        eyebrow="Project Intake"
        title="Project Requests"
        subtitle="Review client-submitted requests, approve qualified work into active projects, or reject requests that are not ready."
        meta={
          <>
            <Badge className="badge-orange">{pending.length} Pending</Badge>
            <Badge className="badge-green">{approved.length} Approved</Badge>
            <Badge className="badge-red">{rejected.length} Rejected</Badge>
          </>
        }
      />

      <WorkspaceStatStrip
        items={[
          {
            label: "Total Requests",
            value: state.requests.length,
            tone: "blue",
            icon: WorkspaceListIcons.request,
          },
          {
            label: "Pending Review",
            value: pending.length,
            tone: pending.length ? "orange" : "slate",
            icon: <Clock3 size={18} />,
          },
          {
            label: "Approved",
            value: approved.length,
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

      <div className="grid-2">
        <WorkspaceListPanel
          title="Request Queue"
          subtitle="Select a request to inspect details and take action."
        >
          {sortedRequests.length ? (
            sortedRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => selectRequest(request)}
                className="workspace-action-card"
                style={{
                  textAlign: "left",
                  borderColor:
                    activeId === request.id ? "rgba(0,100,224,0.45)" : undefined,
                  background: activeId === request.id ? "#f8fbff" : undefined,
                }}
              >
                <div className="workspace-action-card-main">
                  <span className="workspace-action-card-icon workspace-list-tone-orange">
                    <FileText size={18} />
                  </span>

                  <div>
                    <div className="workspace-action-card-title">
                      <h3>{request.projectName}</h3>
                      <Badge className={statusClass(request.status)}>
                        {statusLabel(request.status)}
                      </Badge>
                    </div>
                    <p>
                      {request.businessName} • {request.projectGoal}
                    </p>
                    <div className="workspace-action-card-meta">
                      <span>{getPackageTitle(request.packageType)}</span>
                      <span>{new Date(request.createdAt).toLocaleDateString("en-NG")}</span>
                    </div>
                  </div>
                </div>

                <div className="workspace-action-card-side">
                  <ArrowRight size={17} />
                </div>
              </button>
            ))
          ) : (
            <WorkspaceEmptyPanel
              title="No project requests yet"
              body="Client-submitted project requests will appear here."
              icon={WorkspaceListIcons.request}
            />
          )}
        </WorkspaceListPanel>

        <Card className="workspace-list-panel">
          <div className="workspace-list-panel-head">
            <div>
              <h2>Review & Convert</h2>
              <p>Approve a request into a live project with payment structure.</p>
            </div>
          </div>

          <div className="workspace-list-panel-body">
            {activeRequest ? (
              <div className="stack">
                <div className="workspace-card-context">
                  <strong>{activeRequest.projectName}</strong>
                  <span>{activeRequest.projectDescription}</span>
                </div>

                <div className="grid-2">
                  <div className="kv">
                    <span>Business</span>
                    <strong>{activeRequest.businessName}</strong>
                  </div>
                  <div className="kv">
                    <span>Package</span>
                    <strong>{getPackageTitle(activeRequest.packageType)}</strong>
                  </div>
                  <div className="kv">
                    <span>Timeline</span>
                    <strong>{activeRequest.preferredTimeline || "Not specified"}</strong>
                  </div>
                  <div className="kv">
                    <span>Status</span>
                    <Badge className={statusClass(activeRequest.status)}>
                      {statusLabel(activeRequest.status)}
                    </Badge>
                  </div>
                </div>

                {activeRequest.additionalNotes && (
                  <div className="workspace-card-context">
                    <strong>Additional Notes</strong>
                    <span>{activeRequest.additionalNotes}</span>
                  </div>
                )}

                {activeRequest.status === "PENDING_REVIEW" ? (
                  <>
                    <div className="grid-2">
                      <label className="field">
                        <span>Total Amount</span>
                        <Input
                          type="number"
                          min={0}
                          value={form.totalAmount}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              totalAmount: Number(event.target.value),
                            })
                          }
                        />
                      </label>

                      <label className="field">
                        <span>Deposit Amount</span>
                        <Input
                          type="number"
                          min={0}
                          value={form.depositAmount}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              depositAmount: Number(event.target.value),
                            })
                          }
                        />
                      </label>

                      <label className="field">
                        <span>Balance Amount</span>
                        <Input value={formatMoney(balanceAmount)} disabled />
                      </label>

                      <label className="field">
                        <span>Target Date</span>
                        <Input
                          type="date"
                          value={form.targetDate}
                          onChange={(event) =>
                            setForm({ ...form, targetDate: event.target.value })
                          }
                        />
                      </label>
                    </div>

                    <label className="field">
                      <span>Project Manager</span>
                      <select
                        className="input"
                        value={form.projectManagerId}
                        onChange={(event) =>
                          setForm({ ...form, projectManagerId: event.target.value })
                        }
                      >
                        <option value="">Unassigned</option>
                        {managers.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name} • {manager.role}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span>Internal Notes</span>
                      <Textarea
                        value={form.internalNotes}
                        onChange={(event) =>
                          setForm({ ...form, internalNotes: event.target.value })
                        }
                        placeholder="Private delivery note for the project team..."
                      />
                    </label>

                    {error && <p className="form-error">{error}</p>}

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Button
                        loading={loadingAction === "approve"}
                        onClick={approveActiveRequest}
                      >
                        Approve & Create Project
                      </Button>

                      <Button
                        variant="secondary"
                        loading={loadingAction === "reject"}
                        onClick={rejectActiveRequest}
                      >
                        Reject Request
                      </Button>
                    </div>
                  </>
                ) : (
                  <WorkspaceActionCard
                    title="Request already processed"
                    subtitle="This request is no longer pending review."
                    icon={WorkspaceListIcons.check}
                    tone={activeRequest.status === "APPROVED" ? "green" : "red"}
                    badge={
                      <Badge className={statusClass(activeRequest.status)}>
                        {statusLabel(activeRequest.status)}
                      </Badge>
                    }
                  />
                )}
              </div>
            ) : (
              <WorkspaceEmptyPanel
                title="Select a request"
                body="Choose a request from the queue to review the brief and approve it into a project."
                icon={WorkspaceListIcons.request}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
