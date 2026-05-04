"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CheckSquare,
  CreditCard,
  FileText,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Users,
  UserRoundCog,
  Layers3,
  MessageSquareText,
  ListChecks,
} from "lucide-react";
import { useApp } from "./AppContext";
import { AIAssistant } from "./AIAssistant";
import { Button } from "./UI";
import { Role } from "@/lib/types";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};
const iconSize = 20;

function navForRole(
  role: Role,
  counts: { approvals: number; payments: number; requests: number },
): NavItem[] {
  if (role === "CLIENT") {
    return [
      {
        label: "Dashboard",
        href: "/client",
        icon: <LayoutDashboard size={iconSize} />,
      },
      {
        label: "Projects",
        href: "/client/projects",
        icon: <FolderKanban size={iconSize} />,
      },
      {
        label: "Phases",
        href: "/client/phases",
        icon: <Layers3 size={iconSize} />,
      },
      {
        label: "Approvals",
        href: "/client/approvals",
        icon: <CheckSquare size={iconSize} />,
        badge: counts.approvals,
      },
      {
        label: "Payments",
        href: "/client/payments",
        icon: <CreditCard size={iconSize} />,
        badge: counts.payments,
      },
      {
        label: "Support",
        href: "/client/support",
        icon: <HelpCircle size={iconSize} />,
      },
    ];
  }
  if (role === "STAFF" || role === "PROJECT_MANAGER") {
    return [
      {
        label: "Dashboard",
        href: "/staff",
        icon: <LayoutDashboard size={iconSize} />,
      },
      {
        label: "Projects",
        href: "/staff/projects",
        icon: <BriefcaseBusiness size={iconSize} />,
      },
      {
        label: "Phases",
        href: "/staff/phases",
        icon: <Layers3 size={iconSize} />,
      },
      {
        label: "Messages",
        href: "/staff/messages",
        icon: <MessageSquareText size={iconSize} />,
      },
      {
        label: "Workload",
        href: "/staff/workload",
        icon: <ListChecks size={iconSize} />,
      },
      {
        label: "Settings",
        href: "/staff/settings",
        icon: <Settings size={iconSize} />,
      },
    ];
  }
  return [
    {
      label: "Overview",
      href: "/admin",
      icon: <LayoutDashboard size={iconSize} />,
    },
    {
      label: "Projects",
      href: "/admin/projects",
      icon: <FolderKanban size={iconSize} />,
    },
    {
      label: "Requests",
      href: "/admin/project-requests",
      icon: <CheckSquare size={iconSize} />,
      badge: counts.requests,
    },
    {
      label: "Clients",
      href: "/admin/clients",
      icon: <Users size={iconSize} />,
    },
    {
      label: "Templates",
      href: "/admin/templates",
      icon: <FileText size={iconSize} />,
    },
    {
      label: "Team",
      href: "/admin/team",
      icon: <UserRoundCog size={iconSize} />,
    },
    {
      label: "Payments",
      href: "/admin/payments",
      icon: <CreditCard size={iconSize} />,
      badge: counts.payments,
    },
    {
      label: "Analytics",
      href: "/admin/analytics",
      icon: <BarChart3 size={iconSize} />,
    },
    {
      label: "Reviews",
      href: "/admin/reviews",
      icon: <CheckSquare size={iconSize} />,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: <Settings size={iconSize} />,
    },
  ];
}

export function PortalShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
  const pathname = usePathname();
  const { currentUser, logout, state, clientProjects } = useApp();

  const counts = useMemo(() => {
    const projects = role === "CLIENT" ? clientProjects : state.projects;
    const approvals = projects
      .flatMap((p) => p.phases)
      .filter((phase) => phase.status === "AWAITING_APPROVAL").length;
    const payments = projects
      .flatMap((p) => p.payments)
      .filter(
        (pay) =>
          pay.status === "PENDING_CONFIRMATION" || pay.status === "UNPAID",
      ).length;
    const requests = state.requests.filter(
      (request) => request.status === "PENDING_REVIEW",
    ).length;
    return { approvals, payments, requests };
  }, [clientProjects, role, state.projects, state.requests]);

  const nav = navForRole(role, counts);
  const createHref =
    role === "CLIENT"
      ? "/client/projects/new"
      : role === "SUPER_ADMIN"
        ? "/admin/projects/new"
        : "/staff/phases";
  const createLabel =
    role === "CLIENT"
      ? "Create Project"
      : role === "SUPER_ADMIN"
        ? "Create Project"
        : "My Phases";

  const handleLogout = async () => {
    await logout();
    // Force a hard reload to clear bfcache and ensure fresh state
    window.location.reload();
  };

  return (  
    <div className="app-shell">
      <aside className="sidebar">
        <Link
          className="sidebar-brand"
          href={
            role === "CLIENT"
              ? "/client"
              : role === "SUPER_ADMIN"
                ? "/admin"
                : "/staff"
          }
        >
          {/* Replace with your real logo when ready. Example: <img src="/octalve-logo.svg" alt="Octalve" className="brand-logo" /> */}
          {/* <div className="logo-mark">O</div> */}
          <img src="/octalve-logo.svg" alt="Octalve" className="brand-logo" />
          <span>Octalve</span>
        </Link>
        <div className="create-btn-wrap">
          <Link href={createHref}>
            <Button className="create-btn">
              <Plus size={18} /> <span>{createLabel}</span>
            </Button>
          </Link>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" &&
                item.href !== "/client" &&
                item.href !== "/staff" &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "nav-link active" : "nav-link"}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.label}</span>
                {!!item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">
            {currentUser?.name?.[0]?.toLowerCase() ?? "o"}
          </div>
          <div>
            <strong>{currentUser?.name ?? "Octalve"}</strong>
            <span>
              {role === "CLIENT"
                ? "Client"
                : role === "SUPER_ADMIN"
                  ? "Octalve Team"
                  : role === "PROJECT_MANAGER"
                    ? "Project Manager"
                    : "Staff"}
            </span>
          </div>
          <button
            className="icon-btn logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="search">
            <Search size={18} /> <input placeholder="Search..." />
          </div>
          <div className="top-actions">
            {counts.approvals > 0 && (
              <Link
                href={
                  role === "CLIENT" ? "/client/approvals" : "/admin/projects"
                }
                className="notification-btn"
              >
                <CheckSquare size={16} /> {counts.approvals} Pending Approval
                {counts.approvals > 1 ? "s" : ""}
              </Link>
            )}
            {counts.requests > 0 && role === "SUPER_ADMIN" && (
              <Link href="/admin/project-requests" className="notification-btn">
                <Bell size={16} /> {counts.requests} Request
                {counts.requests > 1 ? "s" : ""}
              </Link>
            )}
          </div>
        </header>
        {children}
      </main>
      <AIAssistant />
    </div>
  );
}
