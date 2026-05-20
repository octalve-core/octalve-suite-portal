import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { Role } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionUser = any;

export type AuthResult =
  | { error: NextResponse; session?: never; user?: never; role?: never }
  | { error?: never; session: Awaited<ReturnType<typeof auth.api.getSession>>; user: SessionUser; role: Role };

/**
 * Get authenticated session or return a 401 JSON response.
 * Use in every route handler:
 *
 *   const result = await getSessionOrThrow();
 *   if (result.error) return result.error;
 *   const { user, role } = result;
 */
export async function getSessionOrThrow(): Promise<AuthResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const role = (session.user.role ?? "CLIENT") as Role;
  return { session, user: session.user, role };
}

/**
 * Returns a 403 response if the user's role is not in the allowed list.
 * Returns null if the user is authorized.
 */
export function requireRoles(userRole: Role, ...allowed: Role[]): NextResponse | null {
  if (!allowed.includes(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * Generate a unique project code, e.g. "OCT-A3F92B"
 */
export function makeProjectCode(): string {
  return `OCT-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/**
 * Generate a payment reference, e.g. "OCT-A3F92B-DEP"
 */
export function makePaymentRef(code: string, type: "DEP" | "BAL"): string {
  const normalizedCode = code.startsWith("OCT-") ? code : `OCT-${code}`;

  return `${normalizedCode}-${type}`;
}

/**
 * Standard JSON error response
 */
export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
