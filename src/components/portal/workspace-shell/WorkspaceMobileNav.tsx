"use client";

import Link from "next/link";
import { LogOut, MoreHorizontal, X } from "lucide-react";
import type { Role } from "@/lib/types";
import type { WorkspaceCreateAction, WorkspaceNavItem } from "./workspace-shell-types";
import { roleEyebrow } from "./workspace-shell-utils";
import { WorkspaceNavItemRow } from "./WorkspaceNavItem";

export function WorkspaceMobileNav({
  role,
  nav,
  createAction,
  open,
  onToggle,
  onClose,
  onLogout,
  isActiveHref,
}: {
  role: Role;
  nav: WorkspaceNavItem[];
  createAction: WorkspaceCreateAction;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
  isActiveHref: (href: string) => boolean;
}) {
  const primaryNav = nav.slice(0, 3);
  const moreNav = nav.slice(3);
  const moreActive = open || moreNav.some((item) => isActiveHref(item.href));

  return (
    <>
      <nav className="fixed bottom-3 left-3 right-3 z-50 flex items-center gap-2 rounded-[26px] border border-blue-100 bg-white/96 p-2 shadow-[0_20px_50px_rgba(0,100,224,0.18)] backdrop-blur-xl lg:hidden">
        <div className="grid flex-1 grid-cols-3 gap-1">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "relative flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition",
                isActiveHref(item.href)
                  ? "bg-[#0064E0] text-white shadow-[0_10px_22px_rgba(0,100,224,0.24)]"
                  : "text-slate-600 hover:bg-blue-50 hover:text-[#0064E0]",
              ].join(" ")}
            >
              <span>{item.icon}</span>
              <span className="max-w-[68px] truncate">{item.shortLabel ?? item.label}</span>
              {!!item.badge ? (
                <em className="absolute right-2 top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold not-italic text-white ring-2 ring-white">
                  {item.badge}
                </em>
              ) : null}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className={[
            "flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition",
            moreActive
              ? "bg-[#0064E0] text-white shadow-[0_10px_22px_rgba(0,100,224,0.24)]"
              : "text-slate-600 hover:bg-blue-50 hover:text-[#0064E0]",
          ].join(" ")}
          aria-expanded={open}
          aria-label="Open more navigation"
        >
          <MoreHorizontal size={20} strokeWidth={2.25} />
          <span>More</span>
        </button>
      </nav>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
            aria-label="Close more navigation"
            onClick={onClose}
          />

          <section className="fixed bottom-24 left-3 right-3 z-50 rounded-[28px] border border-blue-100 bg-white p-4 shadow-[0_26px_70px_rgba(0,100,224,0.22)] lg:hidden">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <strong className="block text-base font-semibold text-slate-950">
                  More actions
                </strong>
                <span className="mt-1 block text-xs font-medium text-slate-500">
                  {roleEyebrow(role)}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600"
                aria-label="Close more navigation"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid max-h-[56vh] grid-cols-2 gap-2 overflow-auto">
              <Link
                href={createAction.href}
                onClick={onClose}
                className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0064E0] px-4 text-sm font-semibold text-white"
              >
                {createAction.icon}
                {createAction.label}
              </Link>

              {moreNav.map((item) => (
                <WorkspaceNavItemRow
                  key={item.href}
                  item={item}
                  active={isActiveHref(item.href)}
                  onClick={onClose}
                />
              ))}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
