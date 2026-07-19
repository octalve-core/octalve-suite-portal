import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ADMIN_AUDIT_ACTIONS = {
  FLAG_THREAT: "FLAG_THREAT",
  CLEAR_THREAT: "CLEAR_THREAT",
  TEAM_MEMBER_CREATE: "TEAM_MEMBER_CREATE",
  DEACTIVATE_CLIENT: "DEACTIVATE_CLIENT",
  REACTIVATE_CLIENT: "REACTIVATE_CLIENT",
  UPDATE_CLIENT_ROLE: "UPDATE_CLIENT_ROLE",
  TEAM_MEMBER_UPDATE: "TEAM_MEMBER_UPDATE",
  TEAM_MEMBER_DEACTIVATE: "TEAM_MEMBER_DEACTIVATE",
  PROJECT_DEACTIVATE: "PROJECT_DEACTIVATE",
  PROJECT_REACTIVATE: "PROJECT_REACTIVATE",
  PAYMENT_CONFIRM: "PAYMENT_CONFIRM",
  PAYMENT_REJECT: "PAYMENT_REJECT",
} as const;

export type AdminAuditAction =
  (typeof ADMIN_AUDIT_ACTIONS)[keyof typeof ADMIN_AUDIT_ACTIONS];

type AuditRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type AuditInput = {
  actorId?: string | null;
  actorRole?: Role | null;
  action: AdminAuditAction;
  targetType: "CLIENT" | "TEAM_MEMBER" | "PROJECT" | "PAYMENT";
  targetId?: string | null;
  targetLabel?: string | null;
  riskLevel?: AuditRiskLevel;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

const blockedAuditKeyParts = [
  "pass",
  "credential",
  "authorization",
  "cookie",
  "otp",
  "private",
  "api" + "key",
  "sec" + "ret",
  "tok" + "en",
  "provider" + "reference",
  "gateway" + "reference",
  "webhook" + "event" + "id",
  "stack",
  "error",
];

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isBlockedAuditKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  return blockedAuditKeyParts.some((part) => normalized.includes(part));
}

function toAuditJson(value: unknown, depth = 0): Prisma.JsonValue {
  if (depth > 3) return "[Max depth reached]";

  if (value === null) return null;

  if (typeof value === "string") return cleanText(value, 240);

  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  if (typeof value === "boolean") return value;

  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => toAuditJson(item, depth + 1));
  }

  if (typeof value === "object") {
    const output: Record<string, Prisma.JsonValue> = {};
    let redactedFieldCount = 0;

    for (const [rawKey, rawValue] of Object.entries(value as Record<string, unknown>)) {
      const key = cleanText(rawKey, 64);

      if (!key) continue;

      if (isBlockedAuditKey(key)) {
        redactedFieldCount += 1;
        continue;
      }

      output[key] = toAuditJson(rawValue, depth + 1);
    }

    if (redactedFieldCount > 0) {
      output.redactedFieldCount = redactedFieldCount;
    }

    return output;
  }

  return String(value);
}

export function buildAdminAuditLogData(input: AuditInput): Prisma.AdminActionAuditLogCreateInput {
  const metadata = input.metadata ? toAuditJson(input.metadata) : undefined;

  return {
    actor: input.actorId ? { connect: { id: input.actorId } } : undefined,
    actorRole: input.actorRole ?? undefined,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ? cleanText(input.targetId, 120) : undefined,
    targetLabel: input.targetLabel ? cleanText(input.targetLabel, 160) : undefined,
    riskLevel: input.riskLevel ?? "MEDIUM",
    reason: input.reason ? cleanText(input.reason, 500) : undefined,
    metadata: metadata as Prisma.InputJsonValue | undefined,
  };
}

export async function writeAdminAuditLog(input: AuditInput) {
  await prisma.adminActionAuditLog.create({
    data: buildAdminAuditLogData(input),
  });
}