import Link from "next/link";
import { LogOut } from "lucide-react";

import type { Role } from "@/lib/types";
import type {
  WorkspaceCreateAction,
  WorkspaceNavItem,
} from "./workspace-shell-types";
import { roleEyebrow, roleHome } from "./workspace-shell-utils";
import { WorkspaceUserAvatar } from "./WorkspaceUserAvatar";

function WorkspaceSidebarNavRow({
  item,
  active,
}: {
  item: WorkspaceNavItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={[
        "group flex min-h-[58px] items-center gap-4 rounded-[22px] px-5 text-[15px] font-semibold transition",
        active
          ? "bg-[#06356E]/72 text-white ring-1 ring-white/5"
          : "text-white/82 hover:bg-white/[0.055] hover:text-white",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={[
          "grid h-10 w-10 shrink-0 place-items-center transition",
          active ? "text-[#1478FF]" : "text-white/84 group-hover:text-white",
        ].join(" ")}
      >
        {item.icon}
      </span>

      <span className="min-w-0 flex-1 truncate">
        {item.shortLabel ?? item.label}
      </span>

      {item.badge ? (
        <span className="grid min-w-8 place-items-center rounded-xl bg-[#06479A] px-2.5 py-1 text-sm font-black text-white shadow-[0_6px_14px_rgba(0,100,224,0.14)]">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function WorkspaceSidebar({
  role,
  nav,
  createAction,
  userName,
  isActiveHref,
  onLogout,
}: {
  role: Role;
  nav: WorkspaceNavItem[];
  createAction: WorkspaceCreateAction;
  userName: string;
  isActiveHref: (href: string) => boolean;
  onLogout: () => void;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen overflow-hidden bg-[#000A16] text-white lg:block">
      <div className="relative z-10 flex h-full min-h-0 flex-col px-6 py-6">
        <Link
          href={roleHome(role)}
          className="mx-auto flex w-full items-center justify-center"
          aria-label="Octalve Workspace"
        >
          <img
            src="/octalvedash.png"
            alt="Octalve Workspace"
            className="h-10 w-auto object-contain"
          />
        </Link>

        <Link
          href={createAction.href}
          className="mt-8 inline-flex min-h-[54px] items-center justify-center gap-3 rounded-[18px] bg-[#0064E0] px-5 text-[15px] font-semibold text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:-translate-y-0.5 hover:bg-[#0052B8]"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full border border-white/40 text-white">
            {createAction.icon}
          </span>
          <span>{createAction.label}</span>
        </Link>

        <nav
          className="mt-8 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={`${roleEyebrow(role)} navigation`}
        >
          {nav.map((item) => (
            <WorkspaceSidebarNavRow
              key={item.href}
              item={item}
              active={isActiveHref(item.href)}
            />
          ))}
        </nav>

        <div className="mt-6 shrink-0 border-t border-white/10 pt-5">
          <div className="rounded-[20px] border border-white/10 bg-white/[0.035] p-3.5">
            <div className="flex items-center gap-3">
              <WorkspaceUserAvatar
                name={userName}
                className="h-11 w-11 !bg-[#0A2447] !text-white !ring-[#0064E0]"
              />

              <div className="min-w-0 flex-1">
                <strong className="block truncate text-[15px] font-semibold text-white">
                  {userName}
                </strong>
                <span className="mt-0.5 block text-sm font-medium text-white/58">
                  {roleEyebrow(role)}
                </span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.025] text-white/70 transition hover:border-red-400/25 hover:bg-red-500/10 hover:text-red-300"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut size={19} strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}