import type { Role } from "@/lib/types";

export const AUTH_ASSETS = {
  logo: "/octalve.png",
  slides: ["/octalvelog1.png", "/octalvelog2.png", "/octalvelog3.png"],
} as const;

export const ROLE_PATHS: Record<Role, string> = {
  CLIENT: "/client",
  STAFF: "/staff",
  PROJECT_MANAGER: "/staff",
  SUPER_ADMIN: "/admin",
};

export type AuthMode = "login" | "signup" | "forgot";

export const AUTH_COPY: Record<
  AuthMode,
  {
    panelTitle: string;
    panelBody: string;
    image: string;
  }
> = {
  login: {
    panelTitle: "Manage projects with clarity.",
    panelBody:
      "Sign in to manage project phases, approvals, payments and delivery conversations.",
    image: AUTH_ASSETS.slides[0],
  },
  signup: {
    panelTitle: "Create your workspace with structure.",
    panelBody:
      "Open a secure client account to request projects, track progress and approve deliverables.",
    image: AUTH_ASSETS.slides[1],
  },
  forgot: {
    panelTitle: "Recover access securely.",
    panelBody:
      "Reset your password and continue managing project delivery with confidence.",
    image: AUTH_ASSETS.slides[2],
  },
};
