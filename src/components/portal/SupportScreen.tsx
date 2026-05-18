"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Headphones,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { useApp } from "./AppContext";
import { Badge, Card, EmptyState, PageHeader, statusLabel } from "./UI";

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
        subtitle="Reach the Octalve support team or continue from your active project phase."
      />

      <Card className="overflow-hidden">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="min-w-0">
            <Badge className="badge-purple">Support Desk</Badge>

            <h2 className="mt-5 max-w-[560px] text-[30px] font-medium leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-[40px]">
              Need help with your project?
            </h2>

            <p className="mt-4 max-w-[620px] text-[16px] font-medium leading-7 text-slate-500">
              Send an email to your project manager or continue the conversation
              inside the phase message thread.
            </p>

            {selectedProject && (
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge className="badge-blue">{selectedProject.title}</Badge>
                <Badge className="badge-slate">
                  {statusLabel(selectedProject.status as any)}
                </Badge>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <a
              className="btn btn-primary min-h-[52px] w-full"
              href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${body}`}
            >
              <Mail size={18} /> Email {pm ? "Project Manager" : "Support"}
            </a>

            {activePhase ? (
              <Link
                className="btn btn-secondary min-h-[52px] w-full"
                href={`/client/phases/${activePhase.id}`}
              >
                <MessageSquareText size={18} /> Send Phase Message
              </Link>
            ) : (
              <Link
                className="btn btn-secondary min-h-[52px] w-full"
                href="/client/phases"
              >
                <MessageSquareText size={18} /> Open Phase Messages
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="card-body">
          <div className="deliverable-main">
            <div className="deliverable-icon text-[#0064E0]">
              <Timer size={20} />
            </div>
            <div>
              <h3 className="m-0 text-lg font-medium text-slate-950">
                Typical response time
              </h3>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                We aim to respond within 24 business hours.
              </p>
            </div>
          </div>
        </Card>

        <Card className="card-body">
          <div className="deliverable-main">
            <div className="deliverable-icon text-emerald-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="m-0 text-lg font-medium text-slate-950">
                Project contact
              </h3>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                {pm?.name
                  ? `${pm.name} is assigned as project manager.`
                  : "Octalve support team is available for this workspace."}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="card-title">
          <h2>Helpful answers</h2>
        </div>

        <div className="card-body grid gap-3">
          {[
            ["How do I approve a phase?", "Open Approvals, review the deliverables, then approve or request changes."],
            ["Where do I send feedback?", "Use the message box inside the relevant phase detail page."],
            ["How do I make payment?", "Open Payments, copy the bank details, transfer, then click “I have paid”."],
            ["Where are my deliverable links?", "Open a phase detail page and click the link provided by the delivery team."],
          ].map(([question, answer]) => (
            <div
              key={question}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#EAF3FF] text-[#0064E0]">
                  <Headphones size={18} />
                </span>
                <div className="min-w-0">
                  <strong className="block font-medium text-slate-950">
                    {question}
                  </strong>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    {answer}
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  className="ml-auto mt-1 shrink-0 text-slate-400"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {!selectedProject && (
        <div className="mt-6">
          <EmptyState
            title="No active project yet"
            body="Once your project is active, support actions and phase messages will appear here."
            icon={<CheckCircle2 size={28} />}
          />
        </div>
      )}
    </div>
  );
}
