"use client";

import {
  CheckCircle2,
  CircleDot,
  ClipboardList,
  StickyNote,
  UserRound,
} from "lucide-react";
import { Badge, Card, ProgressBar, statusClass, statusLabel } from "./UI";

function phaseProgress(phase: any) {
  if (!phase.deliverables?.length) {
    return phase.status === "APPROVED" ? 100 : 0;
  }

  return Math.round(
    (phase.deliverables.filter((d: any) => d.status === "APPROVED").length /
      phase.deliverables.length) *
      100,
  );
}

export function ProjectTeamNotes({
  project,
  users,
}: {
  project: any;
  users: any[];
}) {
  const pm = users.find((user) => user.id === project.projectManagerId);
  const assignedPhases = project.phases.filter((phase: any) => phase.assignedStaffId);

  return (
    <div id="project-team" className="stack" style={{ marginTop: 24 }}>
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
                  <ProgressBar value={progress} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card id="project-notes">
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
                  "No team note has been added yet. Use this section as the internal brief for the project team before handing over work."}
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
    </div>
  );
}
