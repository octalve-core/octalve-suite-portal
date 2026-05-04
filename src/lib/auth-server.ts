import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/types";

/**
 * Get the current session (may be null).
 * Only call from Server Components / Route Handlers / Server Actions.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Require an authenticated session. Redirects to /login if not authenticated.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Require the authenticated user to have one of the given roles.
 * Redirects to /login if not authenticated or role does not match.
 */
export async function requireRole(...roles: Role[]) {
  const session = await requireSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = ((session.user as any).role ?? "CLIENT") as Role;
  if (!roles.includes(userRole)) redirect("/login");
  return session;
}
