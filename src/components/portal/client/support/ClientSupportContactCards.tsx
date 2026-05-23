import {
  Mail,
  MessageSquareText,
  ShieldCheck,
  Timer,
  UserRound,
} from "lucide-react";

import type { Project, ProjectPhase, User } from "@/lib/types";
import { SUPPORT_EMAIL } from "./client-support-utils";

function ContactMetric({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          {icon}
        </span>

        <div className="min-w-0">
          <strong className="block text-base font-semibold tracking-[-0.035em] text-slate-950">
            {title}
          </strong>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            {body}
          </p>
        </div>
      </div>
    </article>
  );
}

export function ClientSupportContactCards({
  project,
  activePhase,
  projectManager,
}: {
  project?: Project;
  activePhase?: ProjectPhase;
  projectManager?: User;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ContactMetric
        icon={<Timer size={20} />}
        title="Response Time"
        body="We aim to respond within 24 business hours."
      />

      <ContactMetric
        icon={<UserRound size={20} />}
        title="Project Contact"
        body={
          projectManager?.name
            ? `${projectManager.name} is assigned to this project.`
            : "Octalve support team is available for this workspace."
        }
      />

      <ContactMetric
        icon={<MessageSquareText size={20} />}
        title="Active Thread"
        body={
          activePhase
            ? `${activePhase.title} is the best phase thread to continue from.`
            : "No active phase thread is available yet."
        }
      />

      <ContactMetric
        icon={<Mail size={20} />}
        title="Support Email"
        body={projectManager?.email || SUPPORT_EMAIL}
      />
    </section>
  );
}
