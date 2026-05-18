"use client";

import {
  AssigneeBlock,
  DetailIcons,
  DetailMetricGrid,
  DetailPanel,
  MessagePreviewList,
  PhaseDetailHero
} from "./WorkspaceDetailUI";

import {
  PhaseSummaryCard,
  ProjectSummaryCard,
  WorkspaceEmptyCard
} from "./WorkspaceCards";

import Link from "next/link";
import { useState } from "react";
import { generateProjectSummary } from "@/lib/ai";
import { ProjectPhase } from "@/lib/types";
import { useApp } from "./AppContext";
import { DeliverableManager } from "./DeliverableManager";
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
  Icons,
  Input,
  MetricCard,
  Modal,
  PageHeader,
  ProgressBar,
  statusClass,
  statusLabel,
  Textarea,
} from "./UI";

function assignedPhases(userId?: string) {
  const { state } = useApp();
  return state.projects
    .flatMap((project) => project.phases.map((phase) => ({ project, phase })))
    .filter(
      ({ phase, project }) =>
        phase.assignedStaffId === userId || project.projectManagerId === userId,
    );
}

export function StaffDashboard() {
  const { currentUser, state } = useApp();

  const assigned = assignedPhases(currentUser?.id);

  const needsReview = assigned.filter(
    ({ phase }) =>
      phase.status === "IN_PROGRESS" || phase.status === "CHANGES_REQUESTED",
  ).length;

  const awaitingClient = assigned.filter(
    ({ phase }) => phase.status === "AWAITING_APPROVAL",
  ).length;

  const clientFeedback = assigned.filter(
    ({ phase }) => phase.status === "CHANGES_REQUESTED",
  ).length;

  const managedProjects = state.projects.filter(
    (project) => project.projectManagerId === currentUser?.id,
  );

  const completedAssigned = assigned.filter(
    ({ phase }) => phase.status === "APPROVED",
  ).length;

  const progress =
    assigned.length > 0 ? Math.round((completedAssigned / assigned.length) * 100) : 0;

  return (
    <div className="content">
      <DashboardHero
        eyebrow="Staff Workspace"
        title="Staff Dashboard"
        subtitle={`Welcome back, ${currentUser?.name ?? "Team"}. Track assigned phases, approvals, and delivery movement.`}
        meta={
          <>
            <Badge className="badge-blue">{assigned.length} Assigned</Badge>
            <Badge className="badge-orange">{needsReview} In Progress</Badge>
            <Badge className="badge-green">{completedAssigned} Approved</Badge>
          </>
        }
      />

      <DashboardStats
        items={[
          {
            label: "Assigned Phases",
            value: assigned.length,
            tone: "blue",
            icon: DashboardIcons.phase,
            helper: "Your active workload",
          },
          {
            label: "Due / In Progress",
            value: needsReview,
            tone: "orange",
            icon: DashboardIcons.clock,
            helper: "Requires delivery focus",
          },
          {
            label: "Awaiting Client",
            value: awaitingClient,
            tone: "purple",
            icon: Icons.approvals,
            helper: "Submitted for review",
          },
          {
            label: "Client Feedback",
            value: clientFeedback,
            tone: clientFeedback > 0 ? "red" : "green",
            icon: clientFeedback > 0 ? "!" : DashboardIcons.check,
            helper: "Changes requested",
          },
        ]}
      />

      <div className="grid-2">
        <DashboardPanel
          title="Assigned Work"
          action={
            <Link href="/staff/phases" className="btn btn-ghost">
              View All {Icons.arrow}
            </Link>
          }
        >
          <div className="stack" style={{ gap: 8 }}>
            {assigned.length ? (
              assigned.slice(0, 6).map(({ project, phase }) => (
                <DashboardListItem
                  key={phase.id}
                  href={`/staff/phases/${phase.id}`}
                  title={phase.title}
                  subtitle={`${project.title} • ${project.businessName}`}
                  icon={DashboardIcons.phase}
                  badge={
                    <Badge className={statusClass(phase.status)}>
                      {statusLabel(phase.status)}
                    </Badge>
                  }
                />
              ))
            ) : (
              <EmptyState
                title="No assigned work"
                body="Assigned phases will appear here."
              />
            )}
          </div>
        </DashboardPanel>

        <div className="stack">
          <DashboardProgressCard
            label="Your Delivery Progress"
            title={`${completedAssigned}/${assigned.length || 0} assignments approved`}
            value={progress}
            tone={progress >= 70 ? "green" : progress >= 35 ? "blue" : "orange"}
            helper="Based on phases currently connected to your account."
          />

          <DashboardPanel title="AI Project Briefs">
            <div className="stack">
              {managedProjects.length ? (
                managedProjects
                  .slice(0, 3)
                  .map((project) => (
                    <p key={project.id} style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
                      {generateProjectSummary(project)}
                    </p>
                  ))
              ) : (
                <p style={{ color: "var(--muted)", margin: 0 }}>
                  Project summaries will appear here when you manage projects.
                </p>
              )}
            </div>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
export function StaffProjects() {
  const { currentUser, state } = useApp();

  const projects = state.projects.filter(
    (project) =>
      project.projectManagerId === currentUser?.id ||
      project.phases.some((phase) => phase.assignedStaffId === currentUser?.id),
  );

  return (
    <div className="content">
      <PageHeader
        title="Projects"
        subtitle="Projects connected to your assigned phases"
      />

      {projects.length ? (
        <div className="grid-3">
          {projects.map((project) => (
            <ProjectSummaryCard
              key={project.id}
              project={project}
              href="/staff/phases"
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects assigned"
          body="Assigned projects will appear here."
        />
      )}
    </div>
  );
}
export function StaffPhases() {
  const { currentUser } = useApp();
  const assigned = assignedPhases(currentUser?.id);

  return (
    <div className="content">
      <PageHeader
        title="Assigned Phases"
        subtitle="Manage your assigned delivery work"
      />

      {assigned.length ? (
        <div className="grid-2-even">
          {assigned.map(({ project, phase }) => (
            <PhaseSummaryCard
              key={phase.id}
              phase={phase}
              href={`/staff/phases/${phase.id}`}
              projectTitle={project.title}
              businessName={project.businessName}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No assigned phases"
          body="Your project manager will assign phases to you."
        />
      )}
    </div>
  );
}
function AddDeliverableModal({
  phase,
  onClose,
}: {
  phase: ProjectPhase;
  onClose: () => void;
}) {
  const { addDeliverable } = useApp();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", link: "", description: "" });
  return (
    <Modal title={`Add Deliverable to ${phase.title}`} onClose={onClose}>
      <div className="stack">
        <Field label="Name">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={loading}
          />
        </Field>
        <Field label="Link">
          <Input
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="https://..."
            disabled={loading}
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={loading}
          />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={async () => {
              if (!form.name.trim()) return;
              setLoading(true);
              try {
                await addDeliverable(phase.id, {
                  name: form.name,
                  link: form.link,
                  linkType: "Other",
                  description: form.description,
                });
                onClose();
              } finally {
                setLoading(false);
              }
            }}
          >
            Add Deliverable
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function StaffPhaseDetail({ phaseId }: { phaseId: string }) {
  const { state, currentUser, requestPhaseApproval, sendPhaseMessage } = useApp();

  const [add, setAdd] = useState(false);
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

  const assignee = state.users.find((user) => user.id === phase.assignedStaffId);
  const isPM =
    currentUser?.role === "PROJECT_MANAGER" ||
    project.projectManagerId === currentUser?.id;

  const canManage =
    isPM || phase.assignedStaffId === currentUser?.id || currentUser?.role === "SUPER_ADMIN";

  const messages = phase.messages.map((message) => ({
    ...message,
    author: state.users.find((user) => user.id === message.senderId) ?? null,
  }));

  async function handleRequestApproval() {
    setPendingAction("request-approval");

    try {
      await requestPhaseApproval(phaseId);
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
    <div className="content">
      <PhaseDetailHero
        phase={phase}
        project={project}
        assignee={assignee}
        backHref="/staff/phases"
        backLabel="Back to assigned phases"
        action={
          canManage ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {phase.status !== "APPROVED" && (
                <Button variant="secondary" onClick={() => setAdd(true)}>
                  Add Deliverable
                </Button>
              )}

              {phase.status === "IN_PROGRESS" ||
              phase.status === "CHANGES_REQUESTED" ? (
                <Button
                  loading={pendingAction === "request-approval"}
                  onClick={handleRequestApproval}
                >
                  Request Approval
                </Button>
              ) : null}
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
            label: "Assigned Staff",
            value: assignee?.name ?? "Not assigned",
            icon: DetailIcons.user,
          },
          {
            label: "Deliverables",
            value: phase.deliverables.length,
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
          subtitle="Add, edit, or manage phase deliverables before approval."
          icon={DetailIcons.files}
          action={
            canManage && phase.status !== "APPROVED" ? (
              <Button variant="secondary" onClick={() => setAdd(true)}>
                Add Deliverable
              </Button>
            ) : null
          }
        >
          <DeliverableManager phase={phase} />
        </DetailPanel>

        <div className="stack">
          <DetailPanel
            title="Assigned Team"
            subtitle="Current phase assignee."
            icon={DetailIcons.user}
          >
            <AssigneeBlock user={assignee} />
          </DetailPanel>

          <DetailPanel
            title="Messages"
            subtitle="Send updates or notes for this phase."
            icon={DetailIcons.messages}
          >
            <div className="stack">
              <MessagePreviewList messages={messages} />

              <Textarea
                value={msg}
                onChange={(event) => setMsg(event.target.value)}
                placeholder="Write a phase update..."
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

      {add && <AddDeliverableModal phase={phase} onClose={() => setAdd(false)} />}
    </div>
  );
}


export function StaffMessages() {
  return (
    <div className="content narrow">
      <PageHeader
        title="Messages"
        subtitle="Client and internal project communication"
      />
      <EmptyState
        title="Messages are grouped inside phases"
        body="Open any assigned phase to view or send messages."
      />
    </div>
  );
}

export function StaffWorkload() {
  const { state } = useApp();
  const team = state.users.filter(
    (u) => u.role === "STAFF" || u.role === "PROJECT_MANAGER",
  );

  return (
    <div className="content">
      <PageHeader
        title="Workload"
        subtitle="Team capacity and assignment overview"
      />
      {team.length > 0 ? (
        <div className="grid-3">
          {team.map((member) => {
            const count = state.projects
              .flatMap((p) => p.phases)
              .filter(
                (phase) =>
                  phase.assignedStaffId === member.id ||
                  state.projects.find((p) => p.id === phase.projectId)
                    ?.projectManagerId === member.id,
              ).length;

            return (
              <Card key={member.id} className="card-body">
                <div className="deliverable-main">
                  <div
                    className="avatar"
                    style={{ width: 44, height: 44, fontSize: 18 }}
                  >
                    {member.name[0]}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{member.name}</h3>
                    <div style={{ marginTop: 6, display: "inline-block" }}>
                      <Badge className="badge-purple">
                        {member.specialty ?? statusLabel(member.role)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 24,
                    padding: "16px 0 0",
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <div className="timeline-row">
                    <span style={{ color: "var(--muted)" }}>
                      Active assignments
                    </span>
                    <strong>{count} phases</strong>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <ProgressBar value={Math.min(100, count * 16)} />
                  </div>
                  {count > 5 && (
                    <p
                      style={{
                        color: "var(--red)",
                        fontSize: 13,
                        margin: "12px 0 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          background: "#fee2e2",
                          color: "#ef4444",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: "bold",
                        }}
                      >
                        Overbooked
                      </span>
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Icons.team}
          title="Team workload is private"
          body="As a staff member, you cannot view the workload of other team members. Project managers and administrators can access full capacity planning."
        />
      )}
    </div>
  );
}

export function StaffSettings() {
  const { currentUser } = useApp();

  return (
    <div className="content narrow">
      <PageHeader title="Settings" subtitle="Manage your staff profile" />
      <div className="stack">
        <Card className="card-body">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: 0 }}>Profile</h2>
            <Button>Save Changes</Button>
          </div>
          <div className="form-grid">
            <Field label="Name">
              <Input defaultValue={currentUser?.name ?? ""} />
            </Field>
            <Field label="Email">
              <Input defaultValue={currentUser?.email ?? ""} />
            </Field>
            <Field label="Role">
              <Input
                defaultValue={
                  currentUser?.specialty ??
                  statusLabel(currentUser?.role ?? "STAFF")
                }
                disabled
              />
            </Field>
          </div>
        </Card>

        <Card className="card-body">
          <h2>Notifications</h2>
          {[
            "Email notifications",
            "Phase assignments",
            "New messages in thread",
            "Daily summary",
          ].map((item, index, arr) => (
            <div
              className="timeline-row"
              key={item}
              style={{
                padding: "16px 0",
                borderBottom:
                  index === arr.length - 1 ? "none" : "1px solid var(--line)",
              }}
            >
              <div>
                <strong>{item}</strong>
                <p style={{ margin: 4, color: "var(--muted)" }}>
                  Receive alerts for {item.toLowerCase()}
                </p>
              </div>
              <input type="checkbox" defaultChecked />
            </div>
          ))}
        </Card>

        <Card className="card-body">
          <h2>Security</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Button variant="secondary">Change Password</Button>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Last password change: Never
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}










