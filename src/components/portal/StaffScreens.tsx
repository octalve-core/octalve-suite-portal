"use client";

import Link from "next/link";
import { useState } from "react";
import { generateProjectSummary } from "@/lib/ai";
import { ProjectPhase } from "@/lib/types";
import { useApp } from "./AppContext";
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
    (p) => p.projectManagerId === currentUser?.id,
  );

  return (
    <div className="content">
      <PageHeader
        title="Staff Dashboard"
        subtitle={`Welcome back, ${currentUser?.name ?? "Team"}`}
      />
      <div className="metric-grid">
        <MetricCard
          label="Assigned Phases"
          value={assigned.length}
          icon={Icons.phases}
        />
        <MetricCard
          label="Due This Week"
          value={needsReview}
          icon={Icons.clock}
          tone="orange"
        />
        <MetricCard
          label="Awaiting Client"
          value={awaitingClient}
          icon={Icons.approvals}
          tone="blue"
        />
        <MetricCard
          label="Client Feedback"
          value={clientFeedback}
          icon="!"
          tone="red"
        />
      </div>
      <div className="grid-2">
        <Card>
          <div className="card-title">
            <h2>Assigned Work</h2>
            <Link href="/staff/phases" className="btn btn-ghost">
              View All {Icons.arrow}
            </Link>
          </div>
          <div className="card-body stack">
            {assigned.slice(0, 5).map(({ project, phase }) => (
              <Link
                href={`/staff/phases/${phase.id}`}
                className="deliverable-row"
                key={phase.id}
              >
                <div>
                  <strong>{phase.title}</strong>
                  <p style={{ color: "var(--muted)", margin: 4 }}>
                    {project.title} • {project.businessName}
                  </p>
                </div>
                <Badge className={statusClass(phase.status)}>
                  {statusLabel(phase.status)}
                </Badge>
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <div className="card-title">
            <h2>{Icons.ai} AI Project Briefs</h2>
          </div>
          <div className="card-body stack">
            {managedProjects.length ? (
              managedProjects
                .slice(0, 3)
                .map((project) => (
                  <p key={project.id}>{generateProjectSummary(project)}</p>
                ))
            ) : (
              <p style={{ color: "var(--muted)" }}>
                Project summaries will appear here when you manage projects.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function StaffProjects() {
  const { currentUser, state } = useApp();
  const projects = state.projects.filter(
    (p) =>
      p.projectManagerId === currentUser?.id ||
      p.phases.some((phase) => phase.assignedStaffId === currentUser?.id),
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
            <Link href="/staff/phases" key={project.id}>
              <Card className="project-card">
                <Badge className={statusClass(project.status)}>
                  {statusLabel(project.status)}
                </Badge>
                <div>
                  <h3>{project.title}</h3>
                  <p>{project.businessName}</p>
                </div>
                <div className="project-card-footer">
                  <div className="timeline-row">
                    <span>Progress</span>
                    <strong>
                      {
                        project.phases.filter((p) => p.status === "APPROVED")
                          .length
                      }
                      /{project.phases.length}
                    </strong>
                  </div>
                  <ProgressBar
                    value={
                      (project.phases.filter((p) => p.status === "APPROVED")
                        .length /
                        project.phases.length) *
                      100
                    }
                  />
                </div>
              </Card>
            </Link>
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
            <Link href={`/staff/phases/${phase.id}`} key={phase.id}>
              <Card className="payment-card">
                <div>
                  <Badge className={statusClass(phase.status)}>
                    {statusLabel(phase.status)}
                  </Badge>
                  <h2>{phase.title}</h2>
                  <p style={{ color: "var(--muted)" }}>
                    {project.title} • {project.businessName}
                  </p>
                  <p style={{ color: "var(--muted)" }}>
                    {phase.deliverables.length} deliverables
                  </p>
                </div>
                {Icons.arrow}
              </Card>
            </Link>
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
  const [form, setForm] = useState({ name: "", link: "", description: "" });
  return (
    <Modal title={`Add Deliverable to ${phase.title}`} onClose={onClose}>
      <div className="stack">
        <Field label="Name">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Link">
          <Input
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="https://..."
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await addDeliverable(phase.id, {
                name: form.name,
                link: form.link,
                linkType: "Other",
                description: form.description,
              });
              onClose();
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
  const { state, currentUser, requestPhaseApproval, sendPhaseMessage } =
    useApp();
  const [add, setAdd] = useState(false);
  const [msg, setMsg] = useState("");
  const phase = state.projects
    .flatMap((p) => p.phases)
    .find((p) => p.id === phaseId);
  const project = state.projects.find((p) => p.id === phase?.projectId);
  const isPM =
    currentUser?.role === "PROJECT_MANAGER" ||
    project?.projectManagerId === currentUser?.id;
  if (!phase || !project)
    return (
      <div className="content">
        <EmptyState
          title="Phase not found"
          body="This phase could not be found."
        />
      </div>
    );
  return (
    <div className="content narrow">
      <BackLink href="/staff/phases" />
      <div className="page-header">
        <div>
          <h1>{phase.title}</h1>
          <p>
            {project.title} • {project.businessName}
          </p>
          <Badge className={statusClass(phase.status)}>
            {statusLabel(phase.status)}
          </Badge>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="secondary" onClick={() => setAdd(true)}>
            Add Deliverable
          </Button>
          {isPM ? (
            <Button onClick={async () => await requestPhaseApproval(phase.id)}>
              Request Client Approval
            </Button>
          ) : (
            <Button>Submit to PM</Button>
          )}
        </div>
      </div>
      <div className="grid-2">
        <div className="stack">
          <Card>
            <div className="card-title">
              <h2>Deliverables</h2>
            </div>
            <div className="card-body stack">
              {phase.deliverables.map((d) => (
                <div key={d.id} className="deliverable-row">
                  <div className="deliverable-main">
                    <div className="deliverable-icon">{Icons.doc}</div>
                    <div>
                      <strong>{d.name}</strong>
                      {d.link && (
                        <p style={{ color: "var(--primary)", margin: 4 }}>
                          {d.link}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    className={
                      d.status === "DRAFT"
                        ? "badge-slate"
                        : d.status === "READY_FOR_REVIEW"
                          ? "badge-purple"
                          : d.status === "APPROVED"
                            ? "badge-green"
                            : "badge-red"
                    }
                  >
                    {statusLabel(d.status as any)}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="card-title">
              <h2>Internal Notes</h2>
            </div>
            <div className="card-body">
              <Textarea placeholder="Add internal progress notes..." />
            </div>
          </Card>
        </div>
        <Card className="thread">
          <div className="thread-header">Phase Thread</div>
          <div className="thread-body">
            {phase.messages.length ? (
              phase.messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.senderRole === "SYSTEM" ? "system" : ""}`}
                >
                  <small>{message.senderName}</small>
                  {message.message}
                </div>
              ))
            ) : (
              <EmptyState
                title="No messages yet"
                body="Use the box below to update this phase."
              />
            )}
          </div>
          <div className="thread-input">
            <Input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type a message..."
            />
            <Button
              onClick={async () => {
                await sendPhaseMessage(phase.id, msg);
                setMsg("");
              }}
            >
              ➤
            </Button>
          </div>
        </Card>
      </div>
      {add && (
        <AddDeliverableModal phase={phase} onClose={() => setAdd(false)} />
      )}
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
