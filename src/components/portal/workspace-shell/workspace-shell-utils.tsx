import type React from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardCheck,
  CreditCard,
  FileText,
  FolderKanban,
  Gauge,
  Inbox,
  Layers3,
  ListChecks,
  MessageSquareText,
  MessagesSquare,
  Plus,
  Rocket,
  Settings2,
  Star,
  UserRoundCog,
  UsersRound,
  WalletCards,
} from "lucide-react";

import type { Role } from "@/lib/types";
import type {
  WorkspaceCountState,
  WorkspaceCreateAction,
  WorkspaceNavItem,
} from "./workspace-shell-types";

const iconSize = 20;
const iconStroke = 2.2;

function navIcon(Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>) {
  return <Icon size={iconSize} strokeWidth={iconStroke} />;
}

export function navForRole(
  role: Role,
  counts: WorkspaceCountState,
): WorkspaceNavItem[] {
  if (role === "CLIENT") {
    return [
      { label: "Dashboard", shortLabel: "Home", href: "/client", icon: navIcon(Gauge) },
      { label: "Projects", shortLabel: "Projects", href: "/client/projects", icon: navIcon(FolderKanban) },
      { label: "Phases", shortLabel: "Phases", href: "/client/phases", icon: navIcon(Layers3) },
      { label: "Approvals", shortLabel: "Approve", href: "/client/approvals", icon: navIcon(ClipboardCheck), badge: counts.approvals },
      { label: "Payments", shortLabel: "Pay", href: "/client/payments", icon: navIcon(CreditCard), badge: counts.payments },
      { label: "Wallet", shortLabel: "Wallet", href: "/client/wallet", icon: navIcon(WalletCards) },
      { label: "Support", shortLabel: "Help", href: "/client/support", icon: navIcon(MessagesSquare) },
      { label: "Settings", shortLabel: "Settings", href: "/client/settings", icon: navIcon(Settings2) },
    ];
  }

  if (role === "STAFF" || role === "PROJECT_MANAGER") {
    return [
      { label: "Dashboard", shortLabel: "Home", href: "/staff", icon: navIcon(Gauge) },
      { label: "Projects", shortLabel: "Projects", href: "/staff/projects", icon: navIcon(BriefcaseBusiness) },
      { label: "Phases", shortLabel: "Phases", href: "/staff/phases", icon: navIcon(Layers3) },
      { label: "Messages", shortLabel: "Chats", href: "/staff/messages", icon: navIcon(MessageSquareText) },
      { label: "Workload", shortLabel: "Work", href: "/staff/workload", icon: navIcon(ListChecks) },
      { label: "Settings", shortLabel: "Settings", href: "/staff/settings", icon: navIcon(Settings2) },
    ];
  }

  return [
    { label: "Overview", shortLabel: "Home", href: "/admin", icon: navIcon(Gauge) },
    { label: "Projects", shortLabel: "Projects", href: "/admin/projects", icon: navIcon(FolderKanban) },
    { label: "Requests", shortLabel: "Requests", href: "/admin/project-requests", icon: navIcon(Inbox), badge: counts.requests },
    { label: "Clients", shortLabel: "Clients", href: "/admin/clients", icon: navIcon(UsersRound) },
    { label: "Templates", shortLabel: "Templates", href: "/admin/templates", icon: navIcon(FileText) },
    { label: "Team", shortLabel: "Team", href: "/admin/team", icon: navIcon(UserRoundCog) },
    { label: "Payments", shortLabel: "Payments", href: "/admin/payments", icon: navIcon(CreditCard), badge: counts.payments },
    { label: "Wallet", shortLabel: "Wallet", href: "/admin/wallet", icon: navIcon(WalletCards) },
    { label: "Analytics", shortLabel: "Data", href: "/admin/analytics", icon: navIcon(BarChart3) },
    { label: "Reviews", shortLabel: "Reviews", href: "/admin/reviews", icon: navIcon(Star) },
    { label: "Settings", shortLabel: "Settings", href: "/admin/settings", icon: navIcon(Settings2) },
  ];
}

export function roleHome(role: Role) {
  if (role === "CLIENT") return "/client";
  if (role === "SUPER_ADMIN") return "/admin";
  return "/staff";
}

export function roleLabel(role: Role) {
  if (role === "CLIENT") return "Client Workspace";
  if (role === "SUPER_ADMIN") return "Admin Console";
  if (role === "PROJECT_MANAGER") return "Project Manager";
  return "Staff Workspace";
}

export function roleEyebrow(role: Role) {
  if (role === "CLIENT") return "Client";
  if (role === "SUPER_ADMIN") return "Admin";
  if (role === "PROJECT_MANAGER") return "Project Manager";
  return "Staff";
}

export function settingsHref(role: Role) {
  if (role === "SUPER_ADMIN") return "/admin/settings";
  if (role === "CLIENT") return "/client/settings";
  return "/staff/settings";
}

export function paymentsHref(role: Role) {
  if (role === "CLIENT") return "/client/payments";
  if (role === "SUPER_ADMIN") return "/admin/payments";
  return "/staff/phases";
}

export function getCreateAction(role: Role): WorkspaceCreateAction {
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

export function getInitial(name?: string) {
  return name?.trim()?.[0]?.toUpperCase() ?? "O";
}
