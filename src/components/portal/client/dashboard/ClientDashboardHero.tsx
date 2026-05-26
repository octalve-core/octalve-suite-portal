"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlarmClock,
  CalendarDays,
  ChevronDown,
  Eye,
  FolderKanban,
  WalletCards,
} from "lucide-react";

import type { Project } from "@/lib/types";
import { getPackageTitle } from "../../packageCatalog";
import { useApp } from "../../AppContext";
import {
  formatCountdown,
  formatNaira,
  formatProjectDate,
  getBadgeClasses,
  getToneForStatus,
  statusLabel,
} from "./client-dashboard-utils";

function Greeting({ userName }: { userName: string }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <p className="text-sm font-semibold text-white/85">
      {greeting}, {userName}.
    </p>
  );
}

function HeroMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/14 text-white ring-1 ring-white/15">
          {icon}
        </span>
        <div className="min-w-0">
          <span className="block truncate text-[11px] font-black uppercase tracking-[0.13em] text-white/62">
            {label}
          </span>
          <strong className="mt-1 block truncate text-sm font-semibold text-white">
            {value}
          </strong>
        </div>
      </div>
    </div>
  );
}

export function ClientDashboardHero({
  project,
  userName,
  walletAvailable,
}: {
  project: Project;
  userName: string;
  walletAvailable: number | null;
}) {
  const router = useRouter();
  const { clientProjects, setSelectedProjectId } = useApp();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const statusTone = getToneForStatus(project.status);
  const countdownText = formatCountdown(project.targetDate, now);
  const dateText = formatProjectDate(project.targetDate);

  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[#0064E0] p-5 text-white shadow-[0_24px_70px_rgba(0,100,224,0.22)] sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.20),transparent_28%),radial-gradient(circle_at_8%_112%,rgba(0,10,22,0.22),transparent_42%)]" />
      <div className="pointer-events-none absolute -right-14 top-6 hidden h-56 w-56 rotate-12 rounded-[50px] border border-white/10 bg-white/5 lg:block" />
      <div className="pointer-events-none absolute right-24 top-28 hidden h-24 w-24 rounded-full bg-white/10 blur-2xl lg:block" />

      <div className="relative z-10 grid gap-7 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-stretch">
        <div className="min-w-0">
          <Greeting userName={userName} />

          <h1 className="mt-4 max-w-4xl text-[34px] font-semibold leading-[1.03] tracking-[-0.065em] sm:text-[44px] lg:text-[56px]">
            Work with Octalve better through your workspace.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-white/82 sm:text-base">
            Track your active project, approvals, payments, deliverable links and team updates from one secure client portal.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span
              className={[
                "inline-flex rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em]",
                getBadgeClasses(statusTone),
              ].join(" ")}
            >
              {statusLabel(project.status)}
            </span>

            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-white">
              {getPackageTitle(project.packageType)}
            </span>

            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-white">
              {project.projectCode}
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <HeroMetric
              label="Target Date"
              value={dateText}
              icon={<CalendarDays size={17} />}
            />

            <HeroMetric
              label="Countdown"
              value={countdownText}
              icon={<AlarmClock size={17} />}
            />

            <HeroMetric
              label="Active Project"
              value={project.title}
              icon={<FolderKanban size={17} />}
            />
          </div>
        </div>

        <div className="rounded-[26px] border border-white/16 bg-white/12 p-4 backdrop-blur-md sm:p-5">
          <div className="rounded-[22px] border border-white/14 bg-white p-4 text-slate-950 shadow-[0_18px_42px_rgba(0,10,22,0.12)]">
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
              Wallet Balance
            </span>

            <strong className="mt-3 block text-[34px] font-semibold leading-none tracking-[-0.055em] text-slate-950">
              {walletAvailable === null ? "—" : formatNaira(walletAvailable)}
            </strong>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Available for project payments when wallet payment is enabled.
            </p>

            <button
              type="button"
              onClick={() => router.push("/client/wallet")}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-bold text-white shadow-[0_16px_34px_rgba(0,100,224,0.20)] transition hover:bg-[#0052B8]"
            >
              <WalletCards size={17} />
              Open Wallet
            </button>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
              Switch Project
            </label>

            <div className="relative">
              <select
                value={project.id}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                aria-label="Select active project"
                className="h-13 w-full appearance-none rounded-2xl border border-white/20 bg-white px-4 pr-11 text-sm font-semibold text-slate-950 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.03)] outline-none transition focus:ring-4 focus:ring-white/25"
              >
                {clientProjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={() => router.push(`/client/projects/${project.id}`)}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/16"
            >
              <Eye size={16} />
              View Project Workspace
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}