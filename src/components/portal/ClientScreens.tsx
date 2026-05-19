"use client";



import { ClientCreateProjectExpanded as SyncedClientCreateProject } from "./ClientCreateProjectExpanded";
import { getPackageTitle } from "./packageCatalog";
import {
  WorkspaceActionCard,
  WorkspaceEmptyPanel,
  WorkspaceListIcons,
  WorkspaceListPanel,
  WorkspaceSectionHero,
  WorkspaceStatStrip
} from "./WorkspaceLists";

import {
  DetailIcons,
  DetailMetricGrid,
  DetailPanel,
  MessagePreviewList,
  PhaseDetailHero
} from "./WorkspaceDetailUI";

import {
  PaymentSummaryCard,
  PhaseSummaryCard,
  ProjectSummaryCard,
  WorkspaceEmptyCard
} from "./WorkspaceCards";

import Link from "next/link";
import { useMemo, useState } from "react";
import { improveBrief, recommendPackage } from "@/lib/ai";
import { PackageType, Project, ProjectPhase } from "@/lib/types";
import { useApp } from "./AppContext";
import { ProjectDateCountdown } from "./ProjectDateCountdown";
import { PhaseMessageThread } from "./PhaseMessageThread";
import {
  DashboardHero,
  DashboardIcons,
  DashboardListItem,
  DashboardPanel,
  DashboardProgressCard,
  DashboardStats,
} from "./DashboardUI";
import {
  BackLink,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  formatNaira,
  Icons,
  Input,
  Modal,
  packageClass,
  PageHeader,
  ProgressBar,
  ProgressCircle,
  projectProgress,
  Select,
  statusClass,
  statusLabel,
  Textarea,
} from "./UI";

function ProjectSwitcher() {
  const { clientProjects, selectedProject, setSelectedProjectId } = useApp();
  const [open, setOpen] = useState(false);
  if (clientProjects.length <= 1 || !selectedProject) return null;
  return (
    <div className="project-switcher">
      <button className="switcher-btn" onClick={() => setOpen(!open)}>
        Project: {selectedProject.title} <span>⌄</span>
      </button>
      {open && (
        <div className="switcher-menu">
          {clientProjects.map((project) => (
            <button
              className={`switcher-item ${project.id === selectedProject.id ? "active" : ""}`}
              key={project.id}
              onClick={() => {
                setSelectedProjectId(project.id);
                setOpen(false);
              }}
            >
              <div>
                <strong>{project.title}</strong>
                <span>{projectProgress(project)}% complete</span>
              </div>
              <Badge className={packageClass(project.packageType)}>
                {getPackageTitle(project.packageType)}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function paymentBlock(project: Project) {
  const deposit = project.payments.find(
    (payment) => payment.type === "DEPOSIT",
  );
  const balance = project.payments.find(
    (payment) => payment.type === "BALANCE",
  );
  if (project.status === "APPROVED_AWAITING_DEPOSIT" && deposit)
    return {
      payment: deposit,
      title: "Deposit payment required",
      body: "Complete your first deposit to unlock project tracking.",
    };
  if (project.status === "DEPOSIT_PENDING_CONFIRMATION" && deposit)
    return {
      payment: deposit,
      title: "Deposit submitted",
      body: "We are confirming your transfer. Your project opens once confirmed.",
    };
  if (project.status === "AWAITING_BALANCE" && balance)
    return {
      payment: balance,
      title: "Balance payment required",
      body: "Complete your balance payment to unlock final delivery.",
    };
  if (project.status === "BALANCE_PENDING_CONFIRMATION" && balance)
    return {
      payment: balance,
      title: "Balance submitted",
      body: "We are confirming your transfer. The final phase opens once confirmed.",
    };
  return null;
}

function ManualPaymentModal({
  project,
  paymentId,
  onClose,
}: {
  project: Project;
  paymentId: string;
  onClose: () => void;
}) {
  const { markPaymentPaid } = useApp();
  const [loading, setLoading] = useState(false);
  const payment = project.payments.find((item) => item.id === paymentId);
  if (!payment) return null;
  return (
    <Modal
      title={`${payment.type === "DEPOSIT" ? "Deposit" : "Balance"} Payment`}
      onClose={onClose}
    >
      <div className="stack">
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Please make a bank transfer using the details below. After payment,
          click <strong>I have paid</strong>.
        </p>
        <Card className="card-body" style={{ boxShadow: "none" }}>
          <div className="stack">
            <div className="timeline-row">
              <span>Amount</span>
              <strong>{formatNaira(payment.amount)}</strong>
            </div>
            <div className="timeline-row">
              <span>Bank Name</span>
              <strong>{payment.bankName}</strong>
            </div>
            <div className="timeline-row">
              <span>Account Name</span>
              <strong>{payment.accountName}</strong>
            </div>
            <div className="timeline-row">
              <span>Account Number</span>
              <strong>{payment.accountNumber}</strong>
            </div>
            <div className="timeline-row">
              <span>Reference</span>
              <strong>{payment.reference}</strong>
            </div>
          </div>
        </Card>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await markPaymentPaid(payment.id);
                onClose();
              } finally {
                setLoading(false);
              }
            }}
          >
            I have paid
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ClientDashboard() {
  const { currentUser, clientProjects, selectedProject } = useApp();
  const [paymentId, setPaymentId] = useState<string | null>(null);

  if (!clientProjects.length) {
    return (
      <div className="content narrow">
        <DashboardHero
          eyebrow="Client Workspace"
          title="Welcome back"
          subtitle={currentUser?.company ?? currentUser?.name ?? "Your Octalve project workspace is ready."}
          action={
            <Link href="/client/projects/new">
              <Button>{Icons.plus} Create Project</Button>
            </Link>
          }
        />

        <EmptyState
          title="No Active Project Yet"
          body="Create a project request and the Octalve team will review it."
          action={
            <Link href="/client/projects/new">
              <Button>{Icons.plus} Create Project</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const project = selectedProject ?? clientProjects[0];
  const block = paymentBlock(project);

  const active =
    project.phases.find((phase) =>
      ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED"].includes(
        phase.status,
      ),
    ) ??
    project.phases.find((phase) => phase.status !== "LOCKED") ??
    project.phases[0];

  const progress = projectProgress(project);
  const approvedPhases = project.phases.filter(
    (phase) => phase.status === "APPROVED",
  ).length;

  const pendingApprovals = project.phases.filter(
    (phase) => phase.status === "AWAITING_APPROVAL",
  ).length;

  const links = project.phases.flatMap((phase) =>
    phase.deliverables.filter((deliverable) => deliverable.visibleToClient && deliverable.link),
  );

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

  return (
    <div className="content narrow">
      <DashboardHero
        eyebrow="Client Workspace"
        title="Welcome back"
        subtitle={project.title}
        action={
          <Link href="/client/projects/new">
            <Button>{Icons.plus} Create Project</Button>
          </Link>
        }
        meta={
          <>
            <Badge className={packageClass(project.packageType)}>
              {getPackageTitle(project.packageType)}
            </Badge>
            <Badge className={statusClass(project.status)}>
              {statusLabel(project.status)}
            </Badge>
            <ProjectDateCountdown targetDate={project.targetDate} compact />
          </>
        }
      />

      <div className="mt-2">
        <ProjectSwitcher />
      </div>

      {block ? (
        <Card className="payment-card" style={{ marginBottom: 24 }}>
          <div>
            <Badge className={statusClass(block.payment.status)}>
              {statusLabel(block.payment.status)}
            </Badge>
            <h2>{block.title}</h2>
            <p style={{ color: "var(--muted)" }}>{block.body}</p>
          </div>

          {block.payment.status === "UNPAID" ? (
            <Button onClick={() => setPaymentId(block.payment.id)}>
              Make Payment
            </Button>
          ) : (
            <Badge className="badge-orange">Awaiting confirmation</Badge>
          )}
        </Card>
      ) : null}

      <DashboardStats
        items={[
          {
            label: "Project Progress",
            value: `${progress}%`,
            tone: progress >= 80 ? "green" : progress >= 40 ? "blue" : "orange",
            icon: DashboardIcons.project,
            helper: "Overall delivery movement",
          },
          {
            label: "Approved Phases",
            value: `${approvedPhases}/${project.phases.length}`,
            tone: "green",
            icon: DashboardIcons.check,
            helper: "Completed approvals",
          },
          {
            label: "Pending Approvals",
            value: pendingApprovals,
            tone: pendingApprovals > 0 ? "orange" : "slate",
            icon: DashboardIcons.clock,
            helper: "Needs your review",
          },
          {
            label: "Deliverable Links",
            value: links.length,
            tone: "purple",
            icon: Icons.doc,
            helper: "Visible resources",
          },
        ]}
      />

      <div className="grid-2">
        <DashboardProgressCard
          label="Active Phase"
          title={active?.title ?? "No active phase"}
          value={progress}
          tone={progress >= 80 ? "green" : progress >= 40 ? "blue" : "orange"}
          helper={active?.description ?? "Your active project movement appears here."}
        />

        <DashboardPanel title="Next Action">
          <div className="next-action clean-next-action">
            <span className="metric-icon tone-blue">{Icons.clock}</span>
            <div>
              <p>Recommended action</p>
              <h2>
                {block
                  ? block.title
                  : pendingApprovals
                    ? `Review and approve ${project.phases.find((phase) => phase.status === "AWAITING_APPROVAL")?.title}`
                    : "No urgent action needed right now"}
              </h2>
            </div>
            <Link href={nextHref} className="btn btn-secondary">
              {nextLabel} {Icons.arrow}
            </Link>
          </div>
        </DashboardPanel>
      </div>

      <div className="grid-2" style={{ marginTop: 24 }}>
        <DashboardPanel
          title="Phase Timeline"
          action={
            <Link className="btn btn-ghost" href="/client/phases">
              View All {Icons.arrow}
            </Link>
          }
        >
          <div className="stack" style={{ gap: 8 }}>
            {project.phases.map((phase) => (
              <DashboardListItem
                key={phase.id}
                href={`/client/phases/${phase.id}`}
                title={phase.title}
                subtitle={
                  phase.status === "LOCKED"
                    ? "Complete previous phase first to unlock"
                    : phase.description
                }
                icon={DashboardIcons.phase}
                badge={
                  <Badge className={statusClass(phase.status)}>
                    {statusLabel(phase.status)}
                  </Badge>
                }
              />
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Key Links">
          {links.length ? (
            <div className="stack" style={{ gap: 8 }}>
              {links.map((link) => (
                <DashboardListItem
                  key={link.id}
                  href={link.link}
                  title={link.name}
                  subtitle="Client-visible deliverable"
                  icon={Icons.doc}
                  badge={<Badge className="badge-purple">{link.linkType}</Badge>}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No links yet"
              body="Deliverable links will appear here when the delivery team makes them visible."
              icon={Icons.phases}
            />
          )}
        </DashboardPanel>
      </div>

      <DashboardPanel title="Recent Activity" className="mt-24">
        <div className="stack" style={{ gap: 8 }}>
          {project.phases.flatMap((phase) => phase.messages).slice(-4).length ? (
            project.phases
              .flatMap((phase) => phase.messages)
              .slice(-4)
              .map((message) => (
                <DashboardListItem
                  key={message.id}
                  title={message.message}
                  subtitle={new Date(message.createdAt).toLocaleString()}
                  icon={Icons.bell}
                />
              ))
          ) : (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              No recent project activity yet.
            </p>
          )}
        </div>
      </DashboardPanel>

      {paymentId && (
        <ManualPaymentModal
          project={project}
          paymentId={paymentId}
          onClose={() => setPaymentId(null)}
        />
      )}
    </div>
  );
}
export function ClientProjects() {
  const { clientProjects } = useApp();

  return (
    <div className="content narrow">
      <PageHeader
        title="Projects"
        subtitle="Manage all your Octalve projects"
        action={
          <Link href="/client/projects/new">
            <Button>{Icons.plus} Create Project</Button>
          </Link>
        }
      />

      {clientProjects.length ? (
        <div className="grid-2-even">
          {clientProjects.map((project) => (
            <ProjectSummaryCard
              key={project.id}
              project={project}
              href={`/client/projects/${project.id}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Active Project"
          body="Create your first project request to get started."
          action={
            <Link href="/client/projects/new">
              <Button>Create Project</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
export function ClientProjectDetail({ projectId }: { projectId: string }) {
  const { state, setSelectedProjectId } = useApp();
  const project = state.projects.find((p) => p.id === projectId);
  if (!project)
    return (
      <div className="content">
        <EmptyState
          title="Project not found"
          body="This project could not be found."
        />
      </div>
    );
  return (
    <div className="content narrow">
      <BackLink href="/client/projects" />
      <Button variant="ghost" onClick={() => setSelectedProjectId(project.id)}>
        Set as active project
      </Button>
      <Card className="project-hero">
        <div
          className="project-hero-top"
          style={{ background: "#0064E0" }}
        >
          <div>
            <Badge className={packageClass(project.packageType)}>
              {getPackageTitle(project.packageType)}
            </Badge>
            <h1>{project.title}</h1>
            <p>{project.businessName}</p>
          </div>
          <ProgressCircle value={projectProgress(project)} />
        </div>
        <div className="project-hero-bottom">
          <div className="kv">
            <span>Status</span>
            <Badge className={statusClass(project.status)}>
              {statusLabel(project.status)}
            </Badge>
          </div>
          <div className="kv">
            <span>Phases Completed</span>
            <strong>
              {project.phases.filter((p) => p.status === "APPROVED").length} /{" "}
              {project.phases.length}
            </strong>
          </div>
          <div className="kv">
            <span>Target Date</span>
            <ProjectDateCountdown targetDate={project.targetDate} compact />
          </div>
          <div className="kv">
            <span>Deliverables</span>
            <strong>
              {project.phases.flatMap((p) => p.deliverables).length} items
            </strong>
          </div>
        </div>
      </Card>
      <div className="grid-3" style={{ marginTop: 24 }}>
        <Link href="/client/phases">
          <Card className="payment-card">
            <div className="deliverable-main">
              <div className="package-icon">{Icons.phases}</div>
              <div>
                <h3>View Phases</h3>
                <p style={{ color: "var(--muted)" }}>
                  {project.phases.length} phases total
                </p>
              </div>
            </div>
            {Icons.arrow}
          </Card>
        </Link>
        <Link href="/client/approvals">
          <Card className="payment-card">
            <div className="deliverable-main">
              <div
                className="package-icon"
                style={{
                  background: "var(--success-soft)",
                  color: "var(--success)",
                }}
              >
                {Icons.check}
              </div>
              <div>
                <h3>Approvals</h3>
                <p style={{ color: "var(--muted)" }}>Review pending items</p>
              </div>
            </div>
            {Icons.arrow}
          </Card>
        </Link>
        <Link href="/client/payments">
          <Card className="payment-card">
            <div className="deliverable-main">
              <div
                className="package-icon"
                style={{
                  background: "var(--warning-soft)",
                  color: "var(--warning)",
                }}
              >
                {Icons.payments}
              </div>
              <div>
                <h3>Payments</h3>
                <p style={{ color: "var(--muted)" }}>Deposit and balance</p>
              </div>
            </div>
            {Icons.arrow}
          </Card>
        </Link>
      </div>
    </div>
  );
}

export function ClientCreateProject() {
  return <SyncedClientCreateProject />;
}

export function ClientPhases() {
  const { selectedProject } = useApp();

  if (!selectedProject) {
    return (
      <div className="content narrow">
        <PageHeader
          title="Project Phases"
          subtitle="Track your project progress through each phase"
        />
        <EmptyState
          title="No Phases Yet"
          body="Your project phases will appear here once set up by your PM."
        />
      </div>
    );
  }

  const locked =
    selectedProject.status !== "ACTIVE" &&
    selectedProject.status !== "AWAITING_BALANCE";

  return (
    <div className="content narrow">
      <PageHeader
        title="Project Phases"
        subtitle="Track your project progress through each phase"
      />

      <div className="mt-2">
        <ProjectSwitcher />
      </div>

      {locked && (
        <Card className="payment-card" style={{ marginBottom: 24 }}>
          <div>
            <Badge className={statusClass(selectedProject.status)}>
              {statusLabel(selectedProject.status)}
            </Badge>
            <h3>Project tracking is locked</h3>
            <p style={{ color: "var(--muted)" }}>
              Complete the required approval/payment step to unlock phases.
            </p>
          </div>
          <Link className="btn btn-primary" href="/client/payments">
            Open Payments
          </Link>
        </Card>
      )}

      <div className="grid-2-even">
        {selectedProject.phases.map((phase) => (
          <PhaseSummaryCard
            key={phase.id}
            phase={phase}
            href={`/client/phases/${phase.id}`}
            projectTitle={selectedProject.title}
            businessName={selectedProject.businessName}
          />
        ))}
      </div>
    </div>
  );
}
export function ClientPhaseDetail({ phaseId }: { phaseId: string }) {
  const { state, currentUser, approvePhase, requestChanges, sendPhaseMessage } = useApp();

  const [msg, setMsg] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const phase = state.projects
    .flatMap((project) => project.phases)
    .find((item) => item.id === phaseId);

  const project = state.projects.find((item) => item.id === phase?.projectId);

  if (!phase || !project) {
    return (
      <div className="content narrow">
        <WorkspaceEmptyCard
          title="Phase not found"
          body="This phase could not be found."
          icon={DetailIcons.layers}
        />
      </div>
    );
  }

  const messages = phase.messages.map((message) => ({
    ...message,
    author: state.users.find((user) => user.id === message.senderId) ?? null,
  }));

  const visibleDeliverables = phase.deliverables.filter(
    (deliverable) => deliverable.visibleToClient,
  );

  async function handleApprove() {
    if (!confirm("Approve this phase?")) return;

    setPendingAction("approve");

    try {
      await approvePhase(phaseId);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRequestChanges() {
    const note = msg.trim() || "Please review this phase and make the requested changes.";

    setPendingAction("changes");

    try {
      await requestChanges(phaseId, note);
      setMsg("");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSendMessage() {
    if (!msg.trim()) return;

    setPendingAction("message");

    try {
      await sendPhaseMessage(phaseId, msg.trim());
      setMsg("");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="content narrow">
      <PhaseDetailHero
        phase={phase}
        project={project}
        backHref="/client/phases"
        backLabel="Back to phases"
        action={
          phase.status === "AWAITING_APPROVAL" ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button
                variant="secondary"
                loading={pendingAction === "changes"}
                onClick={handleRequestChanges}
              >
                Request Changes
              </Button>

              <Button loading={pendingAction === "approve"} onClick={handleApprove}>
                Approve Phase
              </Button>
            </div>
          ) : null
        }
      />

      <DetailMetricGrid
        items={[
          {
            label: "Project",
            value: project.title,
            icon: DetailIcons.layers,
          },
          {
            label: "Status",
            value: statusLabel(phase.status),
            icon: DetailIcons.calendar,
          },
          {
            label: "Deliverables",
            value: visibleDeliverables.length,
            icon: DetailIcons.files,
          },
          {
            label: "Messages",
            value: phase.messages.length,
            icon: DetailIcons.messages,
          },
        ]}
      />

      <div className="grid-2" style={{ marginTop: 24 }}>
        <DetailPanel
          title="Deliverables"
          subtitle="Review approved links, previews, documents, and delivery assets shared by the Octalve team for this phase."
          icon={DetailIcons.files}
        >
          <div className="stack">
            {visibleDeliverables.length ? (
              visibleDeliverables.map((deliverable) => {
                const hasLink = Boolean(deliverable.link?.trim());

                return (
                  <a
                    key={deliverable.id}
                    href={hasLink ? deliverable.link! : "#deliverables"}
                    target={hasLink ? "_blank" : undefined}
                    rel={hasLink ? "noreferrer" : undefined}
                    aria-disabled={!hasLink}
                    onClick={(event) => {
                      if (!hasLink) event.preventDefault();
                    }}
                    className="deliverable-row"
                    style={{
                      cursor: hasLink ? "pointer" : "default",
                      opacity: hasLink ? 1 : 0.92,
                    }}
                  >
                    <div className="deliverable-main">
                      <div className="deliverable-icon">{Icons.doc}</div>
                      <div>
                        <strong>{deliverable.name}</strong>
                        {deliverable.description && (
                          <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
                            {deliverable.description}
                          </p>
                        )}
                        {!hasLink && (
                          <p style={{ color: "var(--muted)", margin: "6px 0 0" }}>
                            Link not available yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <Badge className={
                        deliverable.status === "DRAFT"
                          ? "badge-slate"
                          : deliverable.status === "READY_FOR_REVIEW"
                            ? "badge-purple"
                            : deliverable.status === "APPROVED"
                              ? "badge-green"
                              : "badge-red"
                      }>
                      {statusLabel(deliverable.status)}
                    </Badge>
                  </a>
                );
              })
            ) : (
              <div className="workspace-empty-soft">
                <strong>No deliverables yet</strong>
                <p>Client-visible deliverables will appear here.</p>
              </div>
            )}
          </div>
        </DetailPanel>

        <DetailPanel
          title="Messages"
          subtitle="Send feedback or ask questions about this phase."
          icon={DetailIcons.messages}
        >
          <div className="stack">
            <PhaseMessageThread messages={messages} currentUserId={currentUser?.id} />

            <Textarea
              value={msg}
              onChange={(event) => setMsg(event.target.value)}
              placeholder="Write a message or approval feedback..."
              disabled={pendingAction === "message"}
            />

            <Button
              loading={pendingAction === "message"}
              onClick={handleSendMessage}
              disabled={!msg.trim()}
            >
              Send Message
            </Button>
          </div>
        </DetailPanel>
      </div>
    </div>
  );
}


function RequestChangeModal({
  phase,
  onClose,
  onSubmit,
}: {
  phase: ProjectPhase;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Modal title={`Request Changes: ${phase.title}`} onClose={onClose}>
      <div className="stack">
        <Field label="What should be changed?">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Explain what needs to be corrected before approval..."
            disabled={loading}
          />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={loading}
            onClick={async () => {
              if (text.trim()) {
                setLoading(true);
                try {
                  await onSubmit(text);
                } finally {
                  setLoading(false);
                }
              }
            }}
          >
            Submit Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function ClientApprovals() {
  const { clientProjects, selectedProject } = useApp();
  const [projectFilter, setProjectFilter] = useState(selectedProject?.id ?? "active");
  const [statusFilter, setStatusFilter] = useState<"all" | "awaiting" | "approved" | "changes">("awaiting");

  const allPhases = clientProjects.flatMap((project) =>
    project.phases.map((phase) => ({ project, phase })),
  );

  const awaiting = allPhases.filter(({ phase }) => phase.status === "AWAITING_APPROVAL");
  const approved = allPhases.filter(({ phase }) => phase.status === "APPROVED");
  const changes = allPhases.filter(({ phase }) => phase.status === "CHANGES_REQUESTED");

  const filtered = allPhases.filter(({ project, phase }) => {
    const matchesProject =
      projectFilter === "all"
        ? true
        : projectFilter === "active"
          ? !selectedProject || project.id === selectedProject.id
          : project.id === projectFilter;

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "awaiting"
          ? phase.status === "AWAITING_APPROVAL"
          : statusFilter === "approved"
            ? phase.status === "APPROVED"
            : phase.status === "CHANGES_REQUESTED";

    return matchesProject && matchesStatus;
  });

  return (
    <div className="content narrow">
      <WorkspaceSectionHero
        eyebrow="Approvals"
        title="Approvals"
        subtitle="Review submitted phases by project, approve completed work, or request changes from the delivery team."
        meta={
          <>
            <Badge className="badge-orange">{awaiting.length} Awaiting Review</Badge>
            <Badge className="badge-green">{approved.length} Approved</Badge>
            <Badge className="badge-red">{changes.length} Changes Requested</Badge>
          </>
        }
      />

      <WorkspaceStatStrip
        items={[
          {
            label: "Awaiting Review",
            value: awaiting.length,
            tone: awaiting.length ? "orange" : "slate",
            icon: WorkspaceListIcons.clock,
          },
          {
            label: "Approved",
            value: approved.length,
            tone: "green",
            icon: WorkspaceListIcons.check,
          },
          {
            label: "Changes Requested",
            value: changes.length,
            tone: changes.length ? "red" : "slate",
            icon: WorkspaceListIcons.document,
          },
        ]}
      />

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
          <span>Status</span>
          <select
            className="input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          >
            <option value="awaiting">Awaiting review</option>
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="changes">Changes requested</option>
          </select>
        </label>
      </div>

      <WorkspaceListPanel
        title="Approval Queue"
        subtitle="Filtered by project and approval status so each phase is easy to understand."
      >
        {filtered.length ? (
          filtered.map(({ project, phase }) => (
            <WorkspaceActionCard
              key={phase.id}
              title={phase.title}
              subtitle={`${project.title} • ${phase.description || "Delivery phase awaiting review activity."}`}
              href={`/client/phases/${phase.id}`}
              icon={WorkspaceListIcons.check}
              tone={
                phase.status === "APPROVED"
                  ? "green"
                  : phase.status === "CHANGES_REQUESTED"
                    ? "red"
                    : phase.status === "AWAITING_APPROVAL"
                      ? "orange"
                      : "slate"
              }
              badge={
                <Badge className={statusClass(phase.status)}>
                  {statusLabel(phase.status)}
                </Badge>
              }
              meta={
                <>
                  <span>{project.projectCode}</span>
                  <span>{phase.deliverables.length} deliverables</span>
                  <span>{phase.messages.length} messages</span>
                </>
              }
            />
          ))
        ) : (
          <WorkspaceEmptyPanel
            title="No approvals match this filter"
            body="Switch project or status filter to review other project phases."
            icon={WorkspaceListIcons.check}
          />
        )}
      </WorkspaceListPanel>
    </div>
  );
}



export function ClientPayments() {
  const { selectedProject } = useApp();
  const [paymentId, setPaymentId] = useState<string | null>(null);

  if (!selectedProject) {
    return (
      <div className="content narrow">
        <PageHeader title="Payments" />
        <EmptyState
          title="No payments yet"
          body="Payment details will appear once your project is approved."
        />
      </div>
    );
  }

  return (
    <div className="content narrow">
      <PageHeader title="Payments" subtitle="View deposit and balance status" />

      <div className="mt-2">
        <ProjectSwitcher />
      </div>

      <div className="grid-2-even">
        {selectedProject.payments.map((payment) => (
          <PaymentSummaryCard
            key={payment.id}
            payment={payment}
            projectTitle={selectedProject.title}
            onAction={() => setPaymentId(payment.id)}
          />
        ))}
      </div>

      {paymentId && (
        <ManualPaymentModal
          project={selectedProject}
          paymentId={paymentId}
          onClose={() => setPaymentId(null)}
        />
      )}
    </div>
  );
}
export function ClientSupport() {
  return (
    <div className="content narrow">
      <PageHeader
        title="Help & Support"
        subtitle="Get answers and assistance"
      />
      <Card className="next-action" style={{ marginBottom: 24 }}>
        <div>
          <h2>Need help with your project?</h2>
          <p style={{ textTransform: "none", letterSpacing: 0 }}>
            Your Project Manager is here to assist you.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="secondary">âœ‰ Email PM</Button>
          <Button variant="secondary">â–± Send Message</Button>
        </div>
      </Card>
      <Card className="payment-card" style={{ marginBottom: 24 }}>
        <div className="deliverable-main">
          <div className="metric-icon tone-green">{Icons.clock}</div>
          <div>
            <h3>Typical Response Time</h3>
            <p style={{ color: "var(--muted)" }}>
              We aim to respond within 24 hours on business days
            </p>
          </div>
        </div>
      </Card>
      <Card>
        <div className="card-title">
          <h2>Frequently Asked Questions</h2>
        </div>
        <div className="card-body stack">
          {[
            "How do I approve a phase?",
            "Can I request changes after approving?",
            "How do I view my deliverables?",
            "What if I can't access a deliverable link?",
            "How long does each phase typically take?",
            "Can I communicate with the team directly?",
          ].map((q) => (
            <div
              className="timeline-row"
              key={q}
              style={{
                borderBottom: "1px solid var(--line)",
                paddingBottom: 14,
              }}
            >
              <strong>{q}</strong>
              <span>âŒ„</span>
            </div>
          ))}
        </div>
      </Card>
      <Card style={{ marginTop: 24 }}>
        <div className="card-title">
          <h2>Helpful Resources</h2>
        </div>
        <div className="card-body grid-2-even">
          <Card className="payment-card" style={{ boxShadow: "none" }}>
            <div className="deliverable-main">
              <div className="deliverable-icon">â†—</div>
              <div>
                <strong>Getting Started Guide</strong>
                <p style={{ color: "var(--muted)" }}>
                  Learn how to navigate your project
                </p>
              </div>
            </div>
          </Card>
          <Card className="payment-card" style={{ boxShadow: "none" }}>
            <div className="deliverable-main">
              <div className="deliverable-icon">â†—</div>
              <div>
                <strong>Approval Best Practices</strong>
                <p style={{ color: "var(--muted)" }}>
                  Tips for reviewing deliverables
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}














