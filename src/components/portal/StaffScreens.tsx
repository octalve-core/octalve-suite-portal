"use client";



import { ProjectWorkspaceList, PhaseWorkspaceDetail } from "./ProjectWorkspace";
import { PhaseMessageThread } from "./PhaseMessageThread";
import {
  WorkspaceActionCard,
  WorkspaceEmptyPanel,
  WorkspaceListIcons,
  WorkspaceListPanel,
  WorkspaceMessageCard,
  WorkspaceSectionHero,
  WorkspaceStatStrip
} from "./WorkspaceLists";

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
  return <ProjectWorkspaceList role="staff" />;
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
  return <PhaseWorkspaceDetail role="staff" phaseId={phaseId} />;
}


export function StaffMessages() {
  const { state, currentUser } = useApp();

  const assigned = state.projects.flatMap((project) =>
    project.phases
      .filter(
        (phase) =>
          phase.assignedStaffId === currentUser?.id ||
          project.projectManagerId === currentUser?.id ||
          currentUser?.role === "SUPER_ADMIN",
      )
      .map((phase) => ({ project, phase })),
  );

  const messages = assigned.flatMap(({ project, phase }) =>
    phase.messages.map((message) => ({
      ...message,
      project,
      phase,
      author: state.users.find((user) => user.id === message.senderId),
    })),
  );

  const recentMessages = messages
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  return (
    <div className="content">
      <WorkspaceSectionHero
        eyebrow="Team Communication"
        title="Messages"
        subtitle="Track recent communication across assigned phases and managed project work."
        meta={
          <>
            <Badge className="badge-blue">{messages.length} Messages</Badge>
            <Badge className="badge-purple">{assigned.length} Phase Threads</Badge>
          </>
        }
      />

      <WorkspaceStatStrip
        items={[
          {
            label: "Messages",
            value: messages.length,
            tone: "purple",
            icon: WorkspaceListIcons.message,
          },
          {
            label: "Phase Threads",
            value: assigned.length,
            tone: "blue",
            icon: WorkspaceListIcons.template,
          },
          {
            label: "Assigned Projects",
            value: new Set(assigned.map(({ project }) => project.id)).size,
            tone: "green",
            icon: WorkspaceListIcons.check,
          },
          {
            label: "Latest Activity",
            value: recentMessages[0]
              ? new Date(recentMessages[0].createdAt).toLocaleDateString("en-NG")
              : "None",
            tone: "orange",
            icon: WorkspaceListIcons.clock,
          },
        ]}
      />

      <WorkspaceListPanel
        title="Recent Messages"
        subtitle="Open the phase to continue the conversation."
      >
        {recentMessages.length ? (
          recentMessages.map((message) => (
            <WorkspaceMessageCard
              key={message.id}
              href={`/staff/phases/${message.phase.id}`}
              title={`${message.author?.name ?? "Workspace User"} • ${message.phase.title}`}
              message={message.message}
              meta={`${message.project.title} • ${new Date(message.createdAt).toLocaleString("en-NG")}`}
              badge={<Badge className={statusClass(message.phase.status)}>{statusLabel(message.phase.status)}</Badge>}
            />
          ))
        ) : (
          <WorkspaceEmptyPanel
            title="No messages yet"
            body="Messages from assigned phase threads will appear here."
            icon={WorkspaceListIcons.message}
          />
        )}
      </WorkspaceListPanel>
    </div>
  );
}


export function StaffWorkload() {
  const { state } = useApp();

  const team = state.users.filter(
    (user) => user.role === "STAFF" || user.role === "PROJECT_MANAGER",
  );

  const allPhases = state.projects.flatMap((project) => project.phases);
  const assignedPhases = allPhases.filter((phase) => phase.assignedStaffId);
  const unassignedPhases = allPhases.filter(
    (phase) => !phase.assignedStaffId && phase.status !== "LOCKED",
  );

  return (
    <div className="content">
      <WorkspaceSectionHero
        eyebrow="Delivery Capacity"
        title="Workload"
        subtitle="Review team assignments, current delivery load, and unassigned work across project phases."
        meta={
          <>
            <Badge className="badge-blue">{team.length} Team Members</Badge>
            <Badge className="badge-green">{assignedPhases.length} Assigned</Badge>
            <Badge className="badge-orange">{unassignedPhases.length} Unassigned</Badge>
          </>
        }
      />

      <WorkspaceStatStrip
        items={[
          {
            label: "Team Members",
            value: team.length,
            tone: "blue",
            icon: WorkspaceListIcons.client,
          },
          {
            label: "Assigned Phases",
            value: assignedPhases.length,
            tone: "green",
            icon: WorkspaceListIcons.check,
          },
          {
            label: "Unassigned Phases",
            value: unassignedPhases.length,
            tone: unassignedPhases.length ? "orange" : "slate",
            icon: WorkspaceListIcons.clock,
          },
          {
            label: "Total Phases",
            value: allPhases.length,
            tone: "purple",
            icon: WorkspaceListIcons.template,
          },
        ]}
      />

      <WorkspaceListPanel
        title="Team Load"
        subtitle="Current assignments by staff member."
      >
        {team.length ? (
          team.map((member) => {
            const phases = allPhases.filter(
              (phase) => phase.assignedStaffId === member.id,
            );

            const managedProjects = state.projects.filter(
              (project) => project.projectManagerId === member.id,
            );

            const load = phases.length + managedProjects.length;

            return (
              <WorkspaceActionCard
                key={member.id}
                title={member.name}
                subtitle={member.specialty ?? statusLabel(member.role)}
                icon={WorkspaceListIcons.client}
                tone={load > 7 ? "red" : load > 4 ? "orange" : "blue"}
                badge={
                  <Badge className={load > 7 ? "badge-red" : load > 4 ? "badge-orange" : "badge-blue"}>
                    {load > 7 ? "High Load" : load > 4 ? "Busy" : "Optimal"}
                  </Badge>
                }
                meta={
                  <>
                    <span>{phases.length} assigned phases</span>
                    <span>{managedProjects.length} managed projects</span>
                    <span>{member.email}</span>
                  </>
                }
                href="/staff/phases"
              />
            );
          })
        ) : (
          <WorkspaceEmptyPanel
            title="No team workload yet"
            body="Staff workload will appear when phases are assigned."
            icon={WorkspaceListIcons.client}
          />
        )}
      </WorkspaceListPanel>
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










