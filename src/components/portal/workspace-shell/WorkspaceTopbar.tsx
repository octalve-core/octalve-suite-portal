import Link from "next/link";
import { Bell, CreditCard, Search, Settings2 } from "lucide-react";
import type { Role } from "@/lib/types";
import { NotificationBell } from "../NotificationBell";
import { paymentsHref, roleEyebrow, settingsHref } from "./workspace-shell-utils";
import { WorkspaceUserAvatar } from "./WorkspaceUserAvatar";

export function WorkspaceTopbar({
  role,
  userName,
  pendingTotal,
  paymentsCount,
}: {
  role: Role;
  userName: string;
  pendingTotal: number;
  paymentsCount: number;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
      <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden h-12 w-full max-w-[360px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:flex">
            <Search size={19} className="text-[#334a7d]" />
            <input
              type="search"
              placeholder="Search workspace..."
              className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-[#526899]"
            />
            <kbd className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500 md:inline-flex">
              ? K
            </kbd>
          </div>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-[#334a7d] shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:hidden"
            aria-label="Search workspace"
          >
            <Search size={19} />
          </button>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          <div className="relative">
            <NotificationBell />
          </div>

          <Link
            href={paymentsHref(role)}
            className="hidden min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition hover:border-blue-200 hover:text-[#0064E0] md:inline-flex"
          >
            <CreditCard size={18} className="text-[#0064E0]" />
            <span>Payments</span>
            {paymentsCount > 0 ? (
              <em className="grid min-w-5 place-items-center rounded-full bg-[#0064E0] px-1.5 py-0.5 text-[10px] font-bold not-italic text-white">
                {paymentsCount}
              </em>
            ) : null}
          </Link>

          <Link
            href={settingsHref(role)}
            className="hidden min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition hover:border-blue-200 hover:text-[#0064E0] md:inline-flex"
          >
            <Settings2 size={18} />
            <span>Settings</span>
          </Link>

          <Link
            href={
              pendingTotal > 0
                ? role === "SUPER_ADMIN"
                  ? "/admin/project-requests"
                  : role === "CLIENT"
                    ? "/client/approvals"
                    : "/staff/phases"
                : settingsHref(role)
            }
            className="relative grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.035)] md:hidden"
            aria-label="Alerts"
          >
            <Bell size={18} />
            {pendingTotal > 0 ? (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white ring-2 ring-white">
                {pendingTotal}
              </span>
            ) : null}
          </Link>

          <div className="flex min-w-0 items-center gap-3 pl-1">
            <WorkspaceUserAvatar
              name={userName}
              className="!bg-slate-100 !text-slate-900 !ring-slate-200"
            />
            <div className="hidden min-w-0 lg:block">
              <strong className="block max-w-[150px] truncate text-sm font-semibold text-slate-950">
                {userName}
              </strong>
              <span className="mt-0.5 block text-xs font-medium text-[#334a7d]">
                {roleEyebrow(role)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
