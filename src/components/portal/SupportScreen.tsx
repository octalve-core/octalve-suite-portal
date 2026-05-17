"use client";

import Link from "next/link";
import {
  ArrowRight,
  Headphones,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { useApp } from "./AppContext";
import { Badge, Button, Card, EmptyState, PageHeader, statusLabel } from "./UI";

const SUPPORT_EMAIL = "support@octalve.com";

export function SupportScreen() {
  const { selectedProject, state } = useApp();

  const activePhase =
    selectedProject?.phases.find((phase) =>
      ["IN_PROGRESS", "AWAITING_APPROVAL", "CHANGES_REQUESTED"].includes(
        phase.status,
      ),
    ) ?? selectedProject?.phases.find((phase) => phase.status !== "LOCKED");

  const pm = selectedProject?.projectManagerId
    ? state.users.find((user) => user.id === selectedProject.projectManagerId)
    : undefined;

  const email = pm?.email || SUPPORT_EMAIL;
  const subject = selectedProject
    ? `Support request for ${selectedProject.title}`
    : "Octalve Workspace support request";

  const body = selectedProject
    ? `Hello Octalve Team,%0D%0A%0D%0AI need help with ${selectedProject.title}.%0D%0A%0D%0AProject Code: ${selectedProject.projectCode}%0D%0A%0D%0A`
    : "Hello Octalve Team,%0D%0A%0D%0AI need help with my workspace.%0D%0A%0D%0A";

  return (
    <div className="content narrow">
      <PageHeader
        title="Help & Support"
        subtitle="Get assistance from your project manager or the Octalve support team"
      />

      <Card className="card-body" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, 0.8fr)",
            gap: 28,
            alignItems: "center",
          }}
        >
          <div>
            <Badge className="badge-purple">Support Desk</Badge>
            <h2 style={{ margin: "16px 0 10px", fontSize: 28 }}>
              Need help with your project?
            </h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
              Reach your project manager by email or continue the conversation
              inside the active phase thread.
            </p>
          </div>

          <div className="stack" style={{ gap: 12 }}>
            <a
              className="btn btn-primary"
              href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`}
            >
              <Mail size={17} /> Email {pm ? "Project Manager" : "Support"}
            </a>

            {activePhase ? (
              <Link className="btn btn-secondary" href={`/client/phases/${activePhase.id}`}>
                <MessageSquareText size={17} /> Send Phase Message
              </Link>
            ) : (
              <Link className="btn btn-secondary" href="/client/phases">
                <MessageSquareText size={17} /> Open Phase Messages
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="grid-2-even" style={{ marginBottom: 24 }}>
        <Card className="card-body">
          <div className="deliverable-main">
            <div className="deliverable-icon" style={{ color: "var(--primary)" }}>
              <Timer size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Typical response time</h3>
              <p style={{ color: "var(--muted)", margin: "6px 0 0" }}>
                We aim to respond within 24 business hours.
              </p>
            </div>
          </div>
        </Card>

        <Card className="card-body">
          <div className="deliverable-main">
            <div className="deliverable-icon" style={{ color: "var(--success)" }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Current project</h3>
              <p style={{ color: "var(--muted)", margin: "6px 0 0" }}>
                {selectedProject
                  ? `${selectedProject.title} — ${statusLabel(selectedProject.status as any)}`
                  : "No active project selected"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="card-title">
          <h2>Helpful answers</h2>
        </div>
        <div className="card-body stack">
          {[
            ["How do I approve a phase?", "Open Approvals, review the deliverables, then approve or request changes."],
            ["Where do I send feedback?", "Use the message box inside the relevant phase detail page."],
            ["How do I make payment?", "Open Payments, copy the bank details, transfer, then click “I have paid”."],
            ["Where are my deliverable links?", "Open a phase detail page or check Key Links on your dashboard."],
          ].map(([question, answer]) => (
            <div
              key={question}
              className="deliverable-row"
              style={{ alignItems: "flex-start" }}
            >
              <div className="deliverable-main">
                <div className="deliverable-icon">
                  <Headphones size={18} />
                </div>
                <div>
                  <strong>{question}</strong>
                  <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                    {answer}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: "var(--muted)" }} />
            </div>
          ))}
        </div>
      </Card>

      {!selectedProject && (
        <div style={{ marginTop: 24 }}>
          <EmptyState
            title="No active project yet"
            body="Once your project is active, your project manager and phase messages will appear here."
          />
        </div>
      )}
    </div>
  );
}
