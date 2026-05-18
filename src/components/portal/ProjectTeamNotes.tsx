"use client";

import type React from "react";
import { useState } from "react";
import {
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Layers3,
  StickyNote,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Badge, Card, ProgressBar, statusClass, statusLabel } from "./UI";

type WorkspaceTab = "phases" | "team" | "notes";

function phaseProgress(phase: any) {
  if (!phase.deliverables?.length) {
    return phase.status === "APPROVED" ? 100 : 0;
  }

  return Math.round(
    (phase.deliverables.filter((deliverable: any) => deliverable.status === "APPROVED").length /
      phase.deliverables.length) *
      100,
  );
}

function TeamPanel({ project, users }: { project: any; users: any[] }) {
  const pm = users.find((user) => user.id === project.projectManagerId);
  const assignedPhases = project.phases.filter((phase: any) => phase.assignedStaffId);

  return (
    <Card>
      <div className="card-title">
        <h2>Team & Phase Progress</h2>
      </div>

      <div className="card-body stack">
        <div className="deliverable-row">
          <div className="deliverable-main">
            <div className="deliverable-icon">
              <UserRound size={18} />
            </div>
            <div>
              <strong>{pm?.name ?? "Project Manager not assigned"}</strong>
              <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
                Project Manager
              </p>
            </div>
          </div>
          <Badge className={pm ? "badge-green" : "badge-orange"}>
            {pm ? "Assigned" : "Pending"}
          </Badge>
        </div>

        {assignedPhases.length === 0 && (
          <div
            style={{
              border: "1px dashed var(--line)",
              borderRadius: 14,
              padding: 18,
              color: "var(--muted)",
              textAlign: "center",
            }}
          >
            No staff has been assigned to a phase yet.
          </div>
        )}

        {assignedPhases.map((phase: any) => {
          const staff = users.find((user) => user.id === phase.assignedStaffId);
          const progress = phaseProgress(phase);

          return (
            <div className="deliverable-row" key={phase.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    alignItems: "flex-start",
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div className="deliverable-main">
                    <div className="deliverable-icon">
                      <CircleDot size={18} />
                    </div>
                    <div>
                      <strong>{staff?.name ?? "Assigned staff"}</strong>
                      <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
                        {phase.title}
                      </p>
                    </div>
                  </div>

                  <Badge className={statusClass(phase.status)}>
                    {statusLabel(phase.status)}
                  </Badge>
                </div>

                <div className="workload-stat">
                  <span>{staff?.specialty ?? staff?.role ?? "Staff"}</span>
                  <span>{progress}%</span>
                </div>
                <ProgressBar
                  value={progress}
                  style={{
                    "--progress-fill":
                      progress >= 100
                        ? "#10b981"
                        : progress > 0
                          ? "#0064E0"
                          : "#cbd5e1",
                  } as React.CSSProperties}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function NotesPanel({ project }: { project: any }) {
  return (
    <Card>
      <div className="card-title">
        <h2>Team Notes / Brief</h2>
      </div>

      <div className="card-body stack">
        <div className="deliverable-row" style={{ alignItems: "flex-start" }}>
          <div className="deliverable-icon">
            <StickyNote size={18} />
          </div>
          <div>
            <strong>Project brief for the delivery team</strong>
            <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: "8px 0 0" }}>
              {project.internalNotes ||
                project.clientBrief ||
                project.description ||
                "No team note has been added yet. This section is reserved for internal project handover notes."}
            </p>
          </div>
        </div>

        {project.phases.map((phase: any) => (
          <div className="deliverable-row" key={`note-${phase.id}`}>
            <div className="deliverable-main">
              <div className="deliverable-icon">
                {phase.status === "APPROVED" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <ClipboardList size={18} />
                )}
              </div>
              <div>
                <strong>{phase.title}</strong>
                <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
                  {phase.description ||
                    "No phase-specific handover note has been added yet."}
                </p>
              </div>
            </div>
            <Badge className={statusClass(phase.status)}>
              {statusLabel(phase.status)}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ProjectWorkspaceTabs({
  project,
  users,
  children,
}: {
  project: any;
  users: any[];
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("phases");

  const tabs: Array<{
    id: WorkspaceTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: "phases", label: "Phases", icon: <Layers3 size={16} /> },
    { id: "team", label: "Team", icon: <UsersRound size={16} /> },
    { id: "notes", label: "Notes", icon: <StickyNote size={16} /> },
  ];

  return (
    <section className="project-workspace-tabs">
      <div className="tabs project-tabs" role="tablist" aria-label="Project sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="project-tab-panel">
        {activeTab === "phases" && children}
        {activeTab === "team" && <TeamPanel project={project} users={users} />}
        {activeTab === "notes" && <NotesPanel project={project} />}
      </div>
    </section>
  );
}

export function ProjectTeamNotes({
  project,
  users,
}: {
  project: any;
  users: any[];
}) {
  return <TeamPanel project={project} users={users} />;
}
