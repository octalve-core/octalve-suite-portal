import Link from "next/link";
import {
  FolderKanban,
  Headphones,
  Mail,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";

import type { Project, ProjectPhase, WorkspacePublicSettings } from "@/lib/types";
import {
  buildSupportMailto,
  getProjectStatusLabel,
  getProjectStatusTone,
  getSupportEmail,
  preferPhaseThreadSupport,
} from "./client-support-utils";

export function ClientSupportHero({
  project,
  activePhase,
  settings,
}: {
  project?: Project;
  activePhase?: ProjectPhase;
  settings?: WorkspacePublicSettings | null;
}) {
  const supportEmail = getSupportEmail(settings);
  const phaseSupportPreferred = preferPhaseThreadSupport(settings);

  const mailto = buildSupportMailto({
    email: supportEmail,
    project,
    phase: activePhase,
  });

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_520px]">
        <div className="p-6 sm:p-8">
          <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.065em] text-slate-950 sm:text-[46px]">
            Help & Support
          </h1>

          <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            We're here to help you succeed.
          </p>
          <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Get assistance or continue the conversation in your active phase thread.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.035)]">
              <FolderKanban size={17} className="text-[#0064E0]" />
              {project?.title ?? "No active project"}
            </span>

            <span
              className={[
                "inline-flex min-h-11 items-center rounded-2xl border px-4 text-sm font-bold shadow-[0_10px_24px_rgba(15,23,42,0.035)]",
                getProjectStatusTone(project?.status),
              ].join(" ")}
            >
              <span className="mr-2 h-2.5 w-2.5 rounded-full bg-current" />
              {getProjectStatusLabel(project?.status)}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-200 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
              <Headphones size={30} />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-medium tracking-[-0.035em] text-slate-900">
                Need support now?
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Use the safest project-linked channel.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <a
                  href={mailto}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:bg-[#0052B8]"
                >
                  <Mail size={17} />
                  Email Support
                </a>

                {activePhase && phaseSupportPreferred ? (
                  <Link
                    href={`/client/phases/${activePhase.id}`}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                  >
                    <MessageSquareText size={17} />
                    Send Phase Message
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-400"
                  >
                    <MessageSquareText size={17} />
                    {activePhase ? "Email Preferred" : "No Phase Thread"}
                  </button>
                )}
              </div>

              <div className="mt-5 flex items-start gap-3 text-sm font-semibold leading-6 text-slate-500">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-slate-500" />
                <span>We never ask for passwords, OTPs or payment details.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}