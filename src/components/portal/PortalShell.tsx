"use client";

import type React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { Role } from "@/lib/types";
import { AIAssistant } from "./AIAssistant";
import { useApp } from "./AppContext";
import { WorkspaceMobileNav } from "./workspace-shell/WorkspaceMobileNav";
import { WorkspaceSidebar } from "./workspace-shell/WorkspaceSidebar";
import { WorkspaceTopbar } from "./workspace-shell/WorkspaceTopbar";
import type { WorkspaceTopbarPaymentAlert } from "./workspace-shell/WorkspaceTopbar";
import {
  getCreateAction,
  navForRole,
  roleHome,
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
    workspaceReady,
  } = useApp();

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  // Permanent protected shell guard:
  // wait silently during auth/data resolution; redirect only after auth is resolved.
  useEffect(() => {
    if (!sessionLoading && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, router, sessionLoading]);

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

      try {
        localStorage.removeItem("octalve-suite-selected-project-v2");
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
  }

  const workspaceProjects = useMemo(
    () => (role === "CLIENT" ? clientProjects : state.projects),
    [clientProjects, role, state.projects],
  );

  const paymentAlertItems = useMemo<WorkspaceTopbarPaymentAlert[]>(() => {
    return workspaceProjects
      .flatMap((project) =>
        project.payments
          .filter((payment) =>
            ["UNPAID", "PENDING_CONFIRMATION"].includes(payment.status),
          )
          .map((payment) => ({
            id: payment.id,
            projectTitle: project.title || project.businessName || "Project",
            businessName: project.businessName || project.title || "Workspace",
            type: payment.type,
            status: payment.status,
            amount: payment.amount,
            href:
              role === "SUPER_ADMIN"
                ? `/admin/payments/${payment.id}`
                : role === "CLIENT"
                  ? `/client/payments/${payment.id}`
                  : "/staff/phases",
          })),
      )
      .sort((a, b) => {
        if (a.status === b.status) return b.amount - a.amount;
        return a.status === "PENDING_CONFIRMATION" ? -1 : 1;
      });
  }, [role, workspaceProjects]);

  const counts = useMemo<WorkspaceCountState>(() => {
    const approvals = workspaceProjects
      .flatMap((project) => project.phases)
      .filter((phase) => phase.status === "AWAITING_APPROVAL").length;

    const requests =
      role === "SUPER_ADMIN"
        ? (state.requests ?? []).filter((request) =>
            ["PENDING_REVIEW", "INFO_REQUESTED"].includes(request.status),
          ).length
        : 0;

    return { approvals, payments: paymentAlertItems.length, requests };
  }, [paymentAlertItems.length, role, state.requests, workspaceProjects]);

  const nav = navForRole(role, counts);
  const createAction = getCreateAction(role);
  const userName = currentUser?.name ?? "Octalve";
  const pendingTotal = counts.approvals + counts.requests;

  function isActiveHref(href: string) {
    const homeHref = roleHome(role);

    if (href === homeHref) {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }
  const shouldHoldProtectedShell =
    sessionLoading || !currentUser || !workspaceReady || (dataLoading && !workspaceReady);

  if (shouldHoldProtectedShell) {
    return null;
  }

  return (
    <div className="octalve-portal-shell min-h-screen bg-[#f6f8fc] text-slate-950 lg:grid lg:grid-cols-[276px_minmax(0,1fr)]">
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
          paymentAlerts={paymentAlertItems}
          onLogout={handlePortalLogout}
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
