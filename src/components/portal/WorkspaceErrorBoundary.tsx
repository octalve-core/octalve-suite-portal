"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Home,
  LogIn,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

type WorkspaceErrorRole = "client" | "admin" | "staff" | "general";

const configs: Record<
  WorkspaceErrorRole,
  {
    eyebrow: string;
    title: string;
    body: string;
    dashboardHref: string;
    dashboardLabel: string;
  }
> = {
  client: {
    eyebrow: "Client Workspace",
    title: "We could not load this client workspace view.",
    body:
      "The workspace protected itself from showing a broken page. Try reloading the view, or return to your dashboard.",
    dashboardHref: "/client",
    dashboardLabel: "Go to client dashboard",
  },
  admin: {
    eyebrow: "Admin Console",
    title: "We could not load this admin console view.",
    body:
      "The console protected itself from showing a broken page. Try reloading the view, or return to the admin overview.",
    dashboardHref: "/admin",
    dashboardLabel: "Go to admin overview",
  },
  staff: {
    eyebrow: "Staff Workspace",
    title: "We could not load this staff workspace view.",
    body:
      "The workspace protected itself from showing a broken page. Try reloading the view, or return to your staff dashboard.",
    dashboardHref: "/staff",
    dashboardLabel: "Go to staff dashboard",
  },
  general: {
    eyebrow: "Octalve Workspace",
    title: "We could not load this page.",
    body:
      "The app protected itself from showing a broken page. Try reloading, or return to a safe workspace entry point.",
    dashboardHref: "/login",
    dashboardLabel: "Go to login",
  },
};

export function WorkspaceErrorBoundary({
  role,
  reset,
}: {
  role: WorkspaceErrorRole;
  reset?: () => void;
}) {
  const router = useRouter();
  const config = configs[role];

  function handleRetry() {
    reset?.();
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative overflow-hidden bg-[#000A16] p-8 text-white sm:p-10">
              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#0064E0]/28 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#0064E0]/18 blur-3xl" />

              <div className="relative">
                <Link
                  href={config.dashboardHref}
                  className="inline-flex items-center"
                  aria-label="Octalve Workspace"
                >
                  <img
                    src="/octalvedash.png"
                    alt="Octalve Workspace"
                    className="h-12 w-auto object-contain"
                  />
                </Link>

                <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                  <ShieldCheck size={15} />
                  Safe recovery mode
                </div>

                <h1 className="mt-6 text-[36px] font-semibold leading-[1.02] tracking-[-0.065em] text-white sm:text-[46px]">
                  Workspace protected.
                </h1>

                <p className="mt-5 max-w-md text-sm font-medium leading-7 text-white/70 sm:text-base">
                  Error details, stack traces, tokens, provider references and private system data are not displayed on this screen.
                </p>
              </div>
            </div>

            <div className="p-7 sm:p-10">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
                <AlertTriangle size={24} />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#0064E0]">
                {config.eyebrow}
              </p>

              <h2 className="mt-3 max-w-2xl text-[30px] font-semibold leading-tight tracking-[-0.055em] text-slate-950 sm:text-[38px]">
                {config.title}
              </h2>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-[15px]">
                {config.body}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:bg-[#0052B8]"
                >
                  <RefreshCw size={17} />
                  Try again
                </button>

                <Link
                  href={config.dashboardHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0]"
                >
                  <Home size={17} />
                  {config.dashboardLabel}
                </Link>

                <Link
                  href="/login"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0] sm:col-span-2"
                >
                  <LogIn size={17} />
                  Return to login
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-[#334a7d]">
                For security, this page shows a safe recovery state only. Technical details should remain in controlled server logs, not in the client interface.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}