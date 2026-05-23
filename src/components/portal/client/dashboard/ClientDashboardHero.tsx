"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlarmClock, CalendarDays, ChevronDown, Eye, Plus, WalletCards } from "lucide-react";

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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  const statusTone = getToneForStatus(project.status);
  const countdownText = formatCountdown(project.targetDate, now);
  const dateText = formatProjectDate(project.targetDate);

  return (
    <section className="relative overflow-hidden rounded-[22px] bg-[#0064E0] p-5 text-white shadow-[0_22px_60px_rgba(0,100,224,0.24)] sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_40%_120%,rgba(0,10,22,0.22),transparent_36%)]" />
      <div className="pointer-events-none absolute -right-12 top-6 hidden h-52 w-52 rounded-[46px] border border-white/10 bg-white/5 rotate-12 lg:block" />

      <div className="relative z-10 grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <div className="min-w-0">
          <Greeting userName={userName} />

          <h1 className="mt-4 max-w-4xl text-[34px] font-semibold leading-[1.04] tracking-[-0.06em] sm:text-[44px] lg:text-[54px]">
            Welcome to Octalve Workspace
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-white/82 sm:text-base">
            Track projects, approvals, payments and delivery timelines in one place.
          </p>
        </div>

        <div className="rounded-[22px] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
            <span>Wallet Overview</span>
            <Eye size={16} />
          </div>

          <strong className="mt-4 block text-[34px] font-semibold leading-none tracking-[-0.06em] text-white sm:text-[42px]">
            {walletAvailable === null ? "â€”" : formatNaira(walletAvailable)}
          </strong>

          <Link
            href="/client/wallet"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-[#0064E0] shadow-[0_16px_34px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5"
          >
            <WalletCards size={17} />
            Fund Wallet
          </Link>
        </div>
      </div>

      <div className="relative z-10 mt-7 rounded-[20px] border border-white/20 bg-white/10 p-3 backdrop-blur-md">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.2fr)_minmax(150px,0.65fr)_minmax(220px,1fr)_minmax(190px,0.85fr)_minmax(220px,1fr)]">
          <label className="relative block">
            <select
              value={project.id}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="h-14 w-full appearance-none rounded-2xl border border-white/20 bg-white px-4 pr-11 text-sm font-semibold text-slate-950 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.03)] outline-none transition focus:ring-4 focus:ring-white/25"
              aria-label="Select active project"
            >
              {clientProjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </label>

          <div className="flex min-h-14 items-center justify-center rounded-2xl border border-white/20 bg-white px-4 text-center text-sm font-semibold text-[#0064E0]">
            {getPackageTitle(project.packageType)}
          </div>

          <div
            className={[
              "flex min-h-14 items-center justify-center rounded-2xl border px-4 text-center text-sm font-semibold",
              getBadgeClasses(statusTone),
            ].join(" ")}
          >
            {statusLabel(project.status)}
          </div>

          <div className="flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white px-4 text-center text-sm font-semibold text-slate-950">
            <CalendarDays size={18} className="text-slate-600" />
            {dateText}
          </div>

          <div
            className={[
              "flex min-h-14 items-center justify-center gap-3 rounded-2xl border px-4 text-center text-sm font-semibold",
              countdownText.includes("overdue")
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-red-100 bg-white text-red-600",
            ].join(" ")}
          >
            <AlarmClock size={18} />
            {countdownText}
          </div>
        </div>
      </div>
    </section>
  );
}
