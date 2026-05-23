import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import type { ProjectPhase } from "@/lib/types";
import { getToneForProgress } from "./client-dashboard-utils";

export function ClientActivePhaseCard({
  phase,
  progress,
}: {
  phase?: ProjectPhase;
  progress: number;
}) {
  const tone = getToneForProgress(progress);

  const fill =
    tone === "green"
      ? "#10b981"
      : tone === "orange"
        ? "#f59e0b"
        : tone === "slate"
          ? "#64748b"
          : "#0064E0";

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_38px_rgba(15,23,42,0.055)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-slate-500">Active Phase</span>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
            {phase?.title ?? "No active phase"}
          </h2>
        </div>

        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          <Clock3 size={21} />
        </span>
      </div>

      <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
        {phase?.description ?? "Your active project movement appears here."}
      </p>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-500">Overall Progress</span>
          <strong className="text-slate-950">{progress}%</strong>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <span
            className="block h-full rounded-full"
            style={{ width: `${Math.max(0, Math.min(progress, 100))}%`, background: fill }}
          />
        </div>
      </div>
    </article>
  );
}

export function ClientNextActionCard({
  title,
  href,
  label,
}: {
  title: string;
  href: string;
  label: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-[28px] bg-[#000A16] p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#0064E0]/35 blur-2xl" />

      <div className="relative z-10">
        <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white/60">
          Recommended action
        </span>

        <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.05em]">
          {title}
        </h2>

        <Link
          href={href}
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-[#0064E0] transition hover:-translate-y-0.5"
        >
          {label}
          <ArrowRight size={17} />
        </Link>
      </div>
    </article>
  );
}
