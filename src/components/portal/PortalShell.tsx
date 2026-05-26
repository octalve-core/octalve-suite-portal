"use client";

import type React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { Role } from "@/lib/types";
import { AIAssistant } from "./AIAssistant";
import { useApp } from "./AppContext";
import { PageLoading } from "./UI";
import { WorkspaceMobileNav } from "./workspace-shell/WorkspaceMobileNav";
import { WorkspaceSidebar } from "./workspace-shell/WorkspaceSidebar";
import { WorkspaceTopbar } from "./workspace-shell/WorkspaceTopbar";
import {
  getCreateAction,
  navForRole,
} from "./workspace-shell/workspace-shell-utils";
import type { WorkspaceCountState } from "./workspace-shell/workspace-shell-types";

export function PortalShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    currentUser,
    logout,
    state,
    clientProjects,
    sessionLoading,
    dataLoading,
  } = useApp();

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  async function handlePortalLogout() {
    try {
      await logout();
    } catch {
      try {
        await fetch("/api/auth/sign-out", {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // Continue redirect even if logout request fails.
      }
    }

    try {
      localStorage.removeItem("octalve-session");
      localStorage.removeItem("octalve-user");
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
    } catch {
      // Storage may be unavailable in restricted browsers.
    }

    router.replace("/login");

    window.setTimeout(() => {
      window.location.href = "/login";
    }, 80);
  }

  const counts = useMemo<WorkspaceCountState>(() => {
    const projects = role === "CLIENT" ? clientProjects : state.projects;

    const approvals = projects
      .flatMap((project) => project.phases)
      .filter((phase) => phase.status === "AWAITING_APPROVAL").length;

    const payments = projects
      .flatMap((project) => project.payments)
      .filter((payment) =>
        ["UNPAID", "PENDING_CONFIRMATION"].includes(payment.status),
      ).length;

    const requests =
      role === "SUPER_ADMIN"
        ? (state.requests ?? []).filter((request) =>
            ["PENDING_REVIEW", "INFO_REQUESTED"].includes(request.status),
          ).length
        : 0;

    return { approvals, payments, requests };
  }, [clientProjects, role, state.projects, state.requests]);

  const nav = navForRole(role, counts);
  const createAction = getCreateAction(role);
  const userName = currentUser?.name ?? "Octalve";
  const pendingTotal = counts.approvals + counts.requests;

  function isActiveHref(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (sessionLoading || (dataLoading && state.projects.length === 0)) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950 lg:grid lg:grid-cols-[292px_minmax(0,1fr)]">
      <WorkspaceSidebar
        role={role}
        nav={nav}
        createAction={createAction}
        userName={userName}
        isActiveHref={isActiveHref}
        onLogout={handlePortalLogout}
      />

      <div className="min-w-0 pb-28 lg:pb-0">
        <WorkspaceTopbar
          role={role}
          userName={userName}
          pendingTotal={pendingTotal}
          paymentsCount={counts.payments}
        />

        <div className="min-w-0">
          {children}
        </div>
      </div>

      <WorkspaceMobileNav
        role={role}
        nav={nav}
        createAction={createAction}
        open={mobileMoreOpen}
        onToggle={() => setMobileMoreOpen((value) => !value)}
        onClose={() => setMobileMoreOpen(false)}
        onLogout={handlePortalLogout}
        isActiveHref={isActiveHref}
      />

      <AIAssistant />
    </div>
  );
}
