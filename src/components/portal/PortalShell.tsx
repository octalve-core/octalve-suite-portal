"use client";

import type React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { Project, ProjectPayment, ProjectPhase, ProjectRequest, Role, User } from "@/lib/types";
import { AIAssistant } from "./AIAssistant";
import { useApp } from "./AppContext";
import { WorkspaceMobileNav } from "./workspace-shell/WorkspaceMobileNav";
import { WorkspaceSidebar } from "./workspace-shell/WorkspaceSidebar";
import { WorkspaceTopbar } from "./workspace-shell/WorkspaceTopbar";
import type {
  WorkspaceSearchItem,
  WorkspaceTopbarPaymentAlert,
} from "./workspace-shell/WorkspaceTopbar";
import {
  getCreateAction,
  navForRole,
  roleHome,
} from "./workspace-shell/workspace-shell-utils";
import type { WorkspaceCountState } from "./workspace-shell/workspace-shell-types";

function projectHref(role: Role, projectId: string) {
  if (role === "SUPER_ADMIN") return `/admin/projects/${projectId}`;
  if (role === "CLIENT") return `/client/projects/${projectId}`;

  return "/staff/projects";
}
function phaseHref(role: Role, projectId: string, phaseId: string) {
  if (role === "CLIENT") return `/client/phases/${phaseId}`;
  if (role === "SUPER_ADMIN") return `/admin/projects/${projectId}/phases/${phaseId}`;

  return `/staff/phases/${phaseId}`;
}
function paymentHref(role: Role, paymentId: string) {
  if (role === "SUPER_ADMIN") return `/admin/payments/${paymentId}`;
  if (role === "CLIENT") return `/client/payments/${paymentId}`;
  return "/staff/phases";
}

function requestHref(role: Role, requestId: string) {
  if (role === "SUPER_ADMIN") return `/admin/project-requests/${requestId}`;
  if (role === "CLIENT") return "/client/projects";
  return "/staff";
}

function paymentTypeLabel(type: ProjectPayment["type"]) {
  return type === "DEPOSIT" ? "Deposit" : "Balance";
}

function paymentStatusLabel(status: ProjectPayment["status"]) {
  if (status === "UNPAID") return "Unpaid";
  if (status === "PENDING_CONFIRMATION") return "Awaiting confirmation";
  if (status === "CONFIRMED") return "Confirmed";
  return "Rejected";
}

function compactSearchKeywords(
  values: Array<string | number | null | undefined>,
): string[] {
  return values
    .map((value) => {
      if (typeof value === "number") return String(value);
      return value;
    })
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function projectSearchItem(role: Role, project: Project): WorkspaceSearchItem {
  return {
    id: `project-${project.id}`,
    title: project.title || project.businessName || "Project",
    eyebrow: "Project",
    description: `${project.businessName || "Workspace"} • ${project.projectCode || project.status}`,
    href: projectHref(role, project.id),
    keywords: compactSearchKeywords([
      project.title,
      project.businessName,
      project.projectCode,
      project.packageType,
      project.status,
    ]),
  };
}

function phaseSearchItem(
  role: Role,
  project: Project,
  phase: ProjectPhase,
): WorkspaceSearchItem {
  return {
    id: `phase-${phase.id}`,
    title: phase.title,
    eyebrow: "Phase",
    description: `${project.title || project.businessName || "Project"} • ${phase.status}`,
    href: phaseHref(role, project.id, phase.id),
    keywords: compactSearchKeywords([
      phase.title,
      phase.description,
      phase.status,
      project.title,
      project.businessName,
      project.projectCode,
    ]),
  };
}

function paymentSearchItem(
  role: Role,
  project: Project,
  payment: ProjectPayment,
): WorkspaceSearchItem {
  return {
    id: `payment-${payment.id}`,
    title: `${paymentTypeLabel(payment.type)} payment`,
    eyebrow: "Payment",
    description: `${project.title || project.businessName || "Project"} • ${paymentStatusLabel(payment.status)}`,
    href: paymentHref(role, payment.id),
    keywords: compactSearchKeywords([
      payment.type,
      payment.status,
      payment.amount,
      project.title,
      project.businessName,
      project.projectCode,
    ]),
  };
}

function requestSearchItem(role: Role, request: ProjectRequest): WorkspaceSearchItem {
  return {
    id: `request-${request.id}`,
    title: request.projectName || request.businessName || "Project request",
    eyebrow: "Request",
    description: `${request.businessName || "Client request"} • ${request.status}`,
    href: requestHref(role, request.id),
    keywords: compactSearchKeywords([
      request.projectName,
      request.businessName,
      request.packageType,
      request.status,
    ]),
  };
}

function userSearchItem(user: User): WorkspaceSearchItem {
  const isClient = user.role === "CLIENT";

  return {
    id: `user-${user.id}`,
    title: user.name || user.company || (isClient ? "Client" : "Team member"),
    eyebrow: isClient ? "Client" : "Team",
    description: user.company || user.specialty || user.role,
    href: isClient ? `/admin/clients/${user.id}` : `/admin/team/${user.id}`,
    keywords: compactSearchKeywords([
      user.name,
      user.company,
      user.specialty,
      user.role,
    ]),
  };
}

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
            href: paymentHref(role, payment.id),
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

  const searchItems = useMemo<WorkspaceSearchItem[]>(() => {
    const pageItems = [
      ...nav.map((item) => ({
        id: `page-${item.href}`,
        title: item.label,
        eyebrow: "Page",
        description: "Workspace navigation",
        href: item.href,
        keywords: [item.label, item.shortLabel ?? "", item.href],
      })),
      {
        id: `action-${createAction.href}`,
        title: createAction.label,
        eyebrow: "Action",
        description: "Quick workspace action",
        href: createAction.href,
        keywords: [createAction.label, createAction.href],
      },
    ];

    const projectItems = workspaceProjects.map((project) =>
      projectSearchItem(role, project),
    );

    const phaseItems = workspaceProjects.flatMap((project) =>
      project.phases.map((phase) => phaseSearchItem(role, project, phase)),
    );

    const paymentItems = workspaceProjects.flatMap((project) =>
      project.payments.map((payment) => paymentSearchItem(role, project, payment)),
    );

    const requestItems =
      role === "SUPER_ADMIN"
        ? (state.requests ?? []).map((request) => requestSearchItem(role, request))
        : [];

    const userItems =
      role === "SUPER_ADMIN"
        ? (state.users ?? []).map((user) => userSearchItem(user))
        : [];

    return [
      ...pageItems,
      ...projectItems,
      ...phaseItems,
      ...paymentItems,
      ...requestItems,
      ...userItems,
    ];
  }, [createAction.href, createAction.label, nav, role, state.requests, state.users, workspaceProjects]);

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
          searchItems={searchItems}
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