"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  FolderKanban,
  TimerReset,
  WalletCards,
} from "lucide-react";

import type { Project } from "@/lib/types";
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
    <p className="text-sm font-semibold text-slate-600">
      {greeting}, {userName} 👋
    </p>
  );
}

function SummaryMetric({
  icon,
  label,
  value,
  helper,
  tone = "blue",
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
  tone?: "blue" | "orange" | "green" | "purple" | "slate";
  action?: React.ReactNode;
}) {
  const toneClass = {
    blue: "bg-blue-50 text-[#0064E0] ring-blue-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    purple: "bg-violet-50 text-violet-700 ring-violet-100",
    slate: "bg-slate-50 text-slate-600 ring-slate-200",
  }[tone];

  return (
    <div className="flex min-w-0 items-center gap-4 border-slate-200 px-4 py-4 lg:border-r last:lg:border-r-0">
      <span className={["grid h-12 w-12 shrink-0 place-items-center rounded-full ring-1", toneClass].join(" ")}>
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <span className="block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
          {label}
        </span>
        <strong className="mt-1 block truncate text-base font-semibold text-slate-950">
          {value}
        </strong>
        {helper ? (
          <span className="mt-0.5 block truncate text-sm font-bold text-orange-600">
            {helper}
          </span>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
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
  const { clientProjects, setSelectedProjectId } = useApp();
  const [now, setNow] = useState(() => Date.now());
  const [showBalance, setShowBalance] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const statusTone = getToneForStatus(project.status);
  const countdownText = formatCountdown(project.targetDate, now);
  const dateText = formatProjectDate(project.targetDate);
  const walletValue = walletAvailable === null ? "—" : formatNaira(walletAvailable);
  const maskedWalletValue = walletAvailable === null ? "—" : "••••••";

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(project.projectCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.92fr)] xl:items-stretch">
        <div className="rounded-[24px] border border-transparent bg-white/0 px-0 py-2">
          <Greeting userName={userName} />

          <h1 className="mt-5 max-w-[560px] text-[34px] font-semibold leading-[1.08] tracking-[-0.065em] text-slate-950 sm:text-[42px] lg:text-[48px]">
            Welcome back to your workspace
          </h1>

          <p className="mt-4 max-w-[560px] text-sm font-medium leading-7 text-slate-600 sm:text-[15px]">
            Here's what's happening with your projects today. Track progress, review updates and take action where needed.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800">
              <FolderKanban size={15} className="text-[#0064E0]" />
              {userName}
            </span>

            <span className="inline-flex min-h-9 items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-700">
              <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
              Client
            </span>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
          <div className="grid gap-5 md:grid-cols-[minmax(0,0.9fr)_1px_minmax(0,1fr)] md:items-stretch">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-950">
                  Wallet Balance
                </span>

                <button
                  type="button"
                  onClick={() => setShowBalance((value) => !value)}
                  className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0]"
                  aria-label={showBalance ? "Hide wallet balance" : "Show wallet balance"}
                  title={showBalance ? "Hide balance" : "Show balance"}
                >
                  {showBalance ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <strong className="mt-4 block text-[32px] font-semibold leading-none tracking-[-0.055em] text-slate-950">
                {showBalance ? walletValue : maskedWalletValue}
              </strong>

              <p className="mt-3 max-w-[260px] text-sm font-medium leading-6 text-slate-600">
                Available for project payments when wallet payment is enabled.
              </p>

              <a
                href="/client/wallet"
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-bold text-white transition hover:bg-[#0052B8]"
              >
                <WalletCards size={17} />
                Open Wallet
              </a>
            </div>

            <div className="hidden bg-slate-200 md:block" />

            <div className="min-w-0">
              <label className="block text-sm font-semibold text-slate-950">
                Switch Project
              </label>

              <div className="relative mt-4">
                <select
                  value={project.id}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  aria-label="Select active project"
                  className="h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-11 text-sm font-semibold text-slate-950 outline-none transition focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100"
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

              <a
                href={`/client/projects/${project.id}`}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0064E0]"
              >
                <Eye size={16} />
                View Project Workspace
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="grid divide-y divide-slate-200 lg:grid-cols-[1fr_1fr_1.2fr_1.05fr_1.25fr] lg:divide-x lg:divide-y-0">
          <SummaryMetric
            icon={<CalendarDays size={18} />}
            label="Target Date"
            value={dateText}
            tone="blue"
          />

          <SummaryMetric
            icon={<TimerReset size={18} />}
            label="Countdown"
            value={countdownText}
            helper={countdownText.toLowerCase().includes("overdue") ? "Overdue" : undefined}
            tone="blue"
          />

          <SummaryMetric
            icon={<FolderKanban size={18} />}
            label="Active Project"
            value={project.title}
            tone="blue"
          />

          <SummaryMetric
            icon={<FolderKanban size={18} />}
            label="Project Status"
            value={statusLabel(project.status)}
            helper={statusLabel(project.status).includes("Deposit") ? "Awaiting Deposit" : undefined}
            tone={statusTone === "orange" ? "orange" : "blue"}
          />

          <SummaryMetric
            icon={<FolderKanban size={18} />}
            label="Project Reference"
            value={project.projectCode}
            tone="blue"
            action={
              <button
                type="button"
                onClick={() => void copyReference()}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-[#0064E0]"
                aria-label="Copy project reference"
                title={copied ? "Copied" : "Copy project reference"}
              >
                <Copy size={16} />
              </button>
            }
          />
        </div>
      </div>
    </section>
  );
}