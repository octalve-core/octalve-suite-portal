import type { Role } from "@/lib/types";
import { ROLE_PATHS } from "./auth-config";

const LOCAL_ORIGIN = "https://workspace.octalve.local";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function hasMinimumPasswordStrength(value: string) {
  return value.length >= 8;
}

export function getSafeRoleRedirect(callbackURL: string | null, role: Role) {
  const rolePath = ROLE_PATHS[role] ?? "/client";

  if (!callbackURL || callbackURL.startsWith("//")) {
    return rolePath;
  }

  try {
    const url = new URL(callbackURL, LOCAL_ORIGIN);

    if (url.origin !== LOCAL_ORIGIN) {
      return rolePath;
    }

    const pathname = url.pathname;

    if (pathname === rolePath || pathname.startsWith(`${rolePath}/`)) {
      return `${url.pathname}${url.search}${url.hash}`;
    }

    return rolePath;
  } catch {
    return rolePath;
  }
}

export function getPublicAuthError(
  message: string | undefined,
  fallback: string,
) {
  if (!message) return fallback;

  const value = message.toLowerCase();

  if (
    value.includes("invalid") ||
    value.includes("password") ||
    value.includes("credential") ||
    value.includes("not found")
  ) {
    return "Invalid email or password.";
  }

  if (value.includes("verify")) {
    return "Please verify your email address before continuing.";
  }

  if (value.includes("rate") || value.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return fallback;
}

export function getSafeOAuthCallback() {
  return "/";
}
