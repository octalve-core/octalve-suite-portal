import Link from "next/link";
import {
  ArrowRight,
  Headphones,
  Mail,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";

import type { Project, ProjectPhase, User } from "@/lib/types";
import {
  buildSupportMailto,
  getProjectStatusLabel,
  getProjectStatusTone,
  SUPPORT_EMAIL,
} from "./client-support-utils";

export function ClientSupportHero({
  project,
  activePhase,
  projectManager,
}: {
  project?: Project;
  activePhase?: ProjectPhase;
  projectManager?: User;
}) {
  const email = projectManager?.email || SUPPORT_EMAIL;
  const mailto = buildSupportMailto({
    email,
    project,
    phase: activePhase,
  });

  return (
    <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#000A16] via-[#001F4F] to-[#0064E0] p-6 text-white sm:p-8">
        <div className="absolute right-[-90px] top-[-110px] h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-[-120px] left-[-120px] h-72 w-72 rounded-full bg-white/10 blur-2xl" />

        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-white/80">
              Support Desk
            </span>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.03] tracking-[-0.065em] sm:text-5xl">
              Help & Support
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/75 sm:text-[15px]">
              Reach the Octalve support team, contact your project manager, or continue directly from your active phase thread.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span
                className={[
                  "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                  project
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/15 bg-white/5 text-white/70",
                ].join(" ")}
              >
                {project?.title ?? "No active project"}
              </span>

              <span
                className={[
                  "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                  project
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/15 bg-white/5 text-white/70",
                ].join(" ")}
              >
                {getProjectStatusLabel(project?.status)}
              </span>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#0064E0]">
                <Headphones size={22} />
              </span>
              <div>
                <strong className="block text-base font-semibold text-white">
                  Need support now?
                </strong>
                <span className="mt-1 block text-sm font-medium text-white/65">
                  Use the safest project-linked channel.
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <a
                href={mailto}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-[#0064E0] shadow-[0_16px_34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                <Mail size={17} />
                Email {projectManager ? "Project Manager" : "Support"}
              </a>

              <Link
                href={activePhase ? `/client/phases/${activePhase.id}` : "/client/phases"}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15"
              >
                <MessageSquareText size={17} />
                {activePhase ? "Send Phase Message" : "Open Phase Messages"}
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/15 bg-white/8 p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-white" />
              <p className="m-0 text-sm font-medium leading-6 text-white/70">
                We do not ask clients to share passwords, OTPs, secret keys, or private payment credentials through support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
