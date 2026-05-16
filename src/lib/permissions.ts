import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/**
 * Octalve Suite RBAC – shared between server (auth.ts) and client (auth-client.ts).
 *
 * Roles:
 *  CLIENT          – can create projects, view own data, mark payments, approve phases
 *  STAFF           – can view projects, deliver on phases
 *  PROJECT_MANAGER – can manage projects and phases, plus admin-level user ops
 *  SUPER_ADMIN     – full access to everything
 */

export const statement = {
  ...defaultStatements,
  project: ["create", "view", "update", "delete", "approve", "manage"],
  payment: ["view", "mark-paid", "confirm", "reject"],
  phase: ["view", "assign", "deliver", "approve", "request-changes"],
  template: ["create", "update", "delete"],
  team: ["create", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const clientRole = ac.newRole({
  project: ["create", "view"],
  payment: ["view", "mark-paid"],
  phase: ["view", "approve"],
});

export const staffRole = ac.newRole({
  project: ["view"],
  phase: ["view", "deliver"],
});

export const projectManagerRole = ac.newRole({
  project: ["view", "manage"],
  phase: ["view", "assign", "deliver", "request-changes"],
  ...adminAc.statements,
});

export const superAdminRole = ac.newRole({
  project: ["create", "view", "update", "delete", "approve", "manage"],
  payment: ["view", "confirm", "reject"],
  phase: ["view", "assign", "deliver", "approve", "request-changes"],
  template: ["create", "update", "delete"],
  team: ["create", "update", "delete"],
  ...adminAc.statements,
});
