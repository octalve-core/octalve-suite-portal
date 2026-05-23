import Link from "next/link";
import { LogOut } from "lucide-react";
import type { Role } from "@/lib/types";
import type { WorkspaceCreateAction, WorkspaceNavItem } from "./workspace-shell-types";
import { roleEyebrow, roleHome } from "./workspace-shell-utils";
import { WorkspaceNavItemRow } from "./WorkspaceNavItem";
import { WorkspaceUserAvatar } from "./WorkspaceUserAvatar";

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
    <aside className="sticky top-0 hidden h-screen flex-col overflow-hidden bg-[#000A16] text-white lg:flex">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(0,100,224,0.28),transparent_34%),radial-gradient(circle_at_90%_95%,rgba(0,100,224,0.13),transparent_30%)]" />

      <div className="relative z-10 flex h-full flex-col px-5 py-5">
        <Link href={roleHome(role)} className="flex items-center gap-3">
          <img
            src="/octalvedash.png"
            alt="Octalve Workspace"
            className="h-12 w-auto object-contain"
          />
        </Link>

        <Link
          href={createAction.href}
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(0,100,224,0.28)] transition hover:-translate-y-0.5 hover:bg-[#0052B8]"
        >
          {createAction.icon}
          <span>{createAction.label}</span>
        </Link>

        <nav className="mt-6 grid gap-2" aria-label={`${roleEyebrow(role)} navigation`}>
          {nav.map((item) => (
            <WorkspaceNavItemRow
              key={item.href}
              item={item}
              active={isActiveHref(item.href)}
            />
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-5">
          <div className="flex items-center gap-3">
            <WorkspaceUserAvatar name={userName} />

            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-semibold text-white">
                {userName}
              </strong>
              <span className="mt-0.5 block text-xs font-medium text-white/55">
                {roleEyebrow(role)}
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="grid h-10 w-10 place-items-center rounded-2xl text-white/60 transition hover:bg-red-500/10 hover:text-red-300"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
