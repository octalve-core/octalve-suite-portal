"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CheckSquare,
  ClipboardCheck,
  CreditCard,
  FileText,
  FolderKanban,
  Gauge,
  Inbox,
  Layers3,
  ListChecks,
  LogOut,
  MessageSquareText,
  MessagesSquare,
  MoreHorizontal,
  Plus,
  Rocket,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundCog,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { Role } from "@/lib/types";
import { AIAssistant } from "./AIAssistant";
import { useApp } from "./AppContext";
import { Button, PageLoading } from "./UI";

type NavItem = {
  label: string;
  shortLabel?: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

type CountState = {
  approvals: number;
  payments: number;
  requests: number;
};

const iconSize = 20;
const iconStroke = 2.2;

function navIcon(Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>) {
  return <Icon size={iconSize} strokeWidth={iconStroke} />;
}

function navForRole(role: Role, counts: CountState): NavItem[] {
  if (role === "CLIENT") {
    return [
      {
        label: "Dashboard",
        shortLabel: "Home",
        href: "/client",
        icon: navIcon(Gauge),
      },
      {
        label: "Projects",
        shortLabel: "Projects",
        href: "/client/projects",
        icon: navIcon(FolderKanban),
      },
      {
        label: "Phases",
        shortLabel: "Phases",
        href: "/client/phases",
        icon: navIcon(Layers3),
      },
      {
        label: "Approvals",
        shortLabel: "Approve",
        href: "/client/approvals",
        icon: navIcon(ClipboardCheck),
        badge: counts.approvals,
      },
      {
        label: "Payments",
        shortLabel: "Pay",
        href: "/client/payments",
        icon: navIcon(WalletCards),
        badge: counts.payments,
      },
      {
        label: "Support",
        shortLabel: "Help",
        href: "/client/support",
        icon: navIcon(MessagesSquare),
      },
      {
        label: "Settings",
        shortLabel: "Settings",
        href: "/client/settings",
        icon: navIcon(Settings2),
      },
    ];
  }

  if (role === "STAFF" || role === "PROJECT_MANAGER") {
    return [
      {
        label: "Dashboard",
        shortLabel: "Home",
        href: "/staff",
        icon: navIcon(Gauge),
      },
      {
        label: "Projects",
        shortLabel: "Projects",
        href: "/staff/projects",
        icon: navIcon(BriefcaseBusiness),
      },
      {
        label: "Phases",
        shortLabel: "Phases",
        href: "/staff/phases",
        icon: navIcon(Layers3),
      },
      {
        label: "Messages",
        shortLabel: "Chats",
        href: "/staff/messages",
        icon: navIcon(MessageSquareText),
      },
      {
        label: "Workload",
        shortLabel: "Work",
        href: "/staff/workload",
        icon: navIcon(ListChecks),
      },
      {
        label: "Settings",
        shortLabel: "Settings",
        href: "/staff/settings",
        icon: navIcon(Settings2),
      },
    ];
  }

  return [
    {
      label: "Overview",
      shortLabel: "Home",
      href: "/admin",
      icon: navIcon(Gauge),
    },
    {
      label: "Projects",
      shortLabel: "Projects",
      href: "/admin/projects",
      icon: navIcon(FolderKanban),
    },
    {
      label: "Requests",
      shortLabel: "Requests",
      href: "/admin/project-requests",
      icon: navIcon(Inbox),
      badge: counts.requests,
    },
    {
      label: "Clients",
      shortLabel: "Clients",
      href: "/admin/clients",
      icon: navIcon(UsersRound),
    },
    {
      label: "Templates",
      shortLabel: "Templates",
      href: "/admin/templates",
      icon: navIcon(FileText),
    },
    {
      label: "Team",
      shortLabel: "Team",
      href: "/admin/team",
      icon: navIcon(UserRoundCog),
    },
    {
      label: "Payments",
      shortLabel: "Payments",
      href: "/admin/payments",
      icon: navIcon(CreditCard),
      badge: counts.payments,
    },
    {
      label: "Analytics",
      shortLabel: "Data",
      href: "/admin/analytics",
      icon: navIcon(BarChart3),
    },
    {
      label: "Reviews",
      shortLabel: "Reviews",
      href: "/admin/reviews",
      icon: navIcon(Star),
    },
    {
      label: "Settings",
      shortLabel: "Settings",
      href: "/admin/settings",
      icon: navIcon(Settings2),
    },
  ];
}

function roleHome(role: Role) {
  if (role === "CLIENT") return "/client";
  if (role === "SUPER_ADMIN") return "/admin";
  return "/staff";
}

function roleLabel(role: Role) {
  if (role === "CLIENT") return "Client Workspace";
  if (role === "SUPER_ADMIN") return "Command Workspace";
  if (role === "PROJECT_MANAGER") return "Project Manager";
  return "Delivery Workspace";
}

function roleEyebrow(role: Role) {
  if (role === "CLIENT") return "Client Portal";
  if (role === "SUPER_ADMIN") return "Admin Console";
  if (role === "PROJECT_MANAGER") return "PM Desk";
  return "Staff Desk";
}

function getCreateAction(role: Role) {
  if (role === "CLIENT") {
    return {
      href: "/client/projects/new",
      label: "Create Project",
      icon: <Rocket size={18} strokeWidth={2.2} />,
    };
  }

  if (role === "SUPER_ADMIN") {
    return {
      href: "/admin/projects/new",
      label: "New Project",
      icon: <Plus size={18} strokeWidth={2.2} />,
    };
  }

  return {
    href: "/staff/phases",
    label: "My Phases",
    icon: <Layers3 size={18} strokeWidth={2.2} />,
  };
}

function UserAvatar({ name }: { name?: string }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "O";

  return <div className="avatar">{initial}</div>;
}

export function PortalShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
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

  const counts = useMemo(() => {
    const projects = role === "CLIENT" ? clientProjects : state.projects;

    const approvals = projects
      .flatMap((project) => project.phases)
      .filter((phase) => phase.status === "AWAITING_APPROVAL").length;

    const payments = projects
      .flatMap((project) => project.payments)
      .filter(
        (payment) =>
          payment.status === "PENDING_CONFIRMATION" ||
          payment.status === "UNPAID",
      ).length;

    const requests = state.requests.filter(
      (request) => request.status === "PENDING_REVIEW",
    ).length;

    return { approvals, payments, requests };
  }, [clientProjects, role, state.projects, state.requests]);

  const nav = navForRole(role, counts);
  const createAction = getCreateAction(role);

  const isActiveHref = (href: string) =>
    pathname === href ||
    (href !== "/admin" &&
      href !== "/client" &&
      href !== "/staff" &&
      pathname.startsWith(href));

  const mobileMoreNav = nav.slice(3);
  const mobileMoreActive =
    mobileMoreOpen || mobileMoreNav.some((item) => isActiveHref(item.href));

  const pendingTotal = counts.approvals + counts.requests;
  const userName = currentUser?.name ?? "Octalve";
  const workspaceLabel = roleLabel(role);

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  if (sessionLoading || (dataLoading && state.projects.length === 0)) {
    return <PageLoading />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="sidebar-brand" href={roleHome(role)}>
          <img src="/octalve-logo.svg" alt="Octalve" className="brand-logo" />
          <span>Octalve</span>
        </Link>

        <div className="create-btn-wrap">
          <Link href={createAction.href}>
            <Button className="create-btn">
              {createAction.icon}
              <span>{createAction.label}</span>
            </Button>
          </Link>
        </div>

        <nav className="sidebar-nav" aria-label={`${workspaceLabel} navigation`}>
          {nav.map((item) => {
            const active = isActiveHref(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "nav-link active" : "nav-link"}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.label}</span>
                {!!item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mobile-more-wrap">
          <button
            type="button"
            className={
              mobileMoreActive
                ? "nav-link mobile-more-trigger active"
                : "nav-link mobile-more-trigger"
            }
            onClick={() => setMobileMoreOpen((value) => !value)}
            aria-expanded={mobileMoreOpen}
            aria-label="Open more navigation"
          >
            <span className="nav-icon">
              <MoreHorizontal size={20} strokeWidth={2.25} />
            </span>
            <span className="nav-text">More</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <UserAvatar name={userName} />
          <div>
            <strong>{userName}</strong>
            <span>{roleEyebrow(role)}</span>
          </div>
          <button
            className="icon-btn logout-btn"
            onClick={handleLogout}
            title="Logout"
            type="button"
            aria-label="Logout"
          >
            <LogOut size={18} strokeWidth={2.2} />
          </button>
        </div>
      </aside>

      {mobileMoreOpen && (
        <>
          <button
            type="button"
            className="mobile-more-backdrop"
            aria-label="Close more navigation"
            onClick={() => setMobileMoreOpen(false)}
          />

          <section className="mobile-more-sheet" aria-label="More navigation">
            <div className="mobile-more-head">
              <div>
                <strong>More actions</strong>
                <span>{workspaceLabel}</span>
              </div>

              <button
                type="button"
                className="icon-btn"
                onClick={() => setMobileMoreOpen(false)}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.25} />
              </button>
            </div>

            <div className="mobile-more-grid">
              <Link
                href={createAction.href}
                className="mobile-more-cta"
                onClick={() => setMobileMoreOpen(false)}
              >
                {createAction.icon}
                <span>{createAction.label}</span>
              </Link>

              {mobileMoreNav.map((item) => {
                const active = isActiveHref(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active ? "mobile-more-item active" : "mobile-more-item"
                    }
                    onClick={() => setMobileMoreOpen(false)}
                  >
                    <span>{item.icon}</span>
                    <strong>{item.label}</strong>
                    {!!item.badge && <em>{item.badge}</em>}
                  </Link>
                );
              })}

              <button
                type="button"
                className="mobile-more-logout"
                onClick={() => {
                  setMobileMoreOpen(false);
                  handleLogout();
                }}
              >
                <LogOut size={18} strokeWidth={2.2} />
                <span>Logout</span>
              </button>
            </div>
          </section>
        </>
      )}

      <main className="main">
        <header className="topbar">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              minWidth: 0,
            }}
          >
            <div className="search">
              <Search size={18} strokeWidth={2.2} />
              <input placeholder="Search workspace..." aria-label="Search workspace" />
            </div>

            <div
              style={{
                minWidth: 0,
                display: "none",
              }}
              className="topbar-context"
            >
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  lineHeight: 1,
                  color: "var(--muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                {roleEyebrow(role)}
              </span>
              <strong
                style={{
                  display: "block",
                  marginTop: 4,
                  fontSize: 14,
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                }}
              >
                {workspaceLabel}
              </strong>
            </div>
          </div>

          <div className="top-actions">
            {pendingTotal > 0 && (
              <Link
                href={
                  role === "SUPER_ADMIN"
                    ? counts.requests > 0
                      ? "/admin/project-requests"
                      : "/admin/projects"
                    : role === "CLIENT"
                      ? "/client/approvals"
                      : "/staff/phases"
                }
                className="notification-btn"
              >
                <Bell size={16} strokeWidth={2.25} />
                {pendingTotal} Pending
              </Link>
            )}

            {counts.payments > 0 && role === "SUPER_ADMIN" && (
              <Link href="/admin/payments" className="notification-btn">
                <CreditCard size={16} strokeWidth={2.25} />
                {counts.payments} Payment{counts.payments > 1 ? "s" : ""}
              </Link>
            )}

            <Link
              href={
                role === "STAFF" || role === "PROJECT_MANAGER"
                  ? "/staff/settings"
                  : role === "SUPER_ADMIN"
                    ? "/admin/settings"
                    : "/client/settings"
              }
              className="notification-btn"
            >
              <Settings2 size={16} strokeWidth={2.25} />
              Settings
            </Link>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingLeft: 4,
              }}
            >
              <UserAvatar name={userName} />
              <div
                style={{
                  display: "grid",
                  gap: 2,
                  minWidth: 0,
                }}
              >
                <strong
                  style={{
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 140,
                  }}
                >
                  {userName}
                </strong>
                <span
                  style={{
                    color: "var(--muted)",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                  }}
                >
                  {roleEyebrow(role)}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div
          style={{
            position: "relative",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "fixed",
              top: 78,
              right: 0,
              width: 420,
              height: 420,
              pointerEvents: "none",
              background:
                "radial-gradient(circle, rgba(0,100,224,0.08), transparent 62%)",
              zIndex: 0,
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
        </div>
      </main>

      <AIAssistant />
    </div>
  );
}
