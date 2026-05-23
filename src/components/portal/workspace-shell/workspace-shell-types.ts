import type React from "react";
import type { Role } from "@/lib/types";

export type WorkspaceNavItem = {
  label: string;
  shortLabel?: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

export type WorkspaceCountState = {
  approvals: number;
  payments: number;
  requests: number;
};

export type WorkspaceCreateAction = {
  href: string;
  label: string;
  icon: React.ReactNode;
};
