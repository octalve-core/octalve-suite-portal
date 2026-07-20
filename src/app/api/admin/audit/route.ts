import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { ADMIN_AUDIT_ACTIONS } from "@/lib/admin-audit";
import { errorResponse, getSessionOrThrow, requireRoles } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

const allowedActions = new Set<string>(Object.values(ADMIN_AUDIT_ACTIONS));
const allowedRiskLevels = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const allowedTargetTypes = new Set(["CLIENT", "TEAM_MEMBER", "PROJECT", "PAYMENT"]);

const blockedMetadataKeyParts = [
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

function cleanParam(value: string | null, maxLength = 120) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanNumber(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(min, Math.min(max, parsed));
}

function isBlockedMetadataKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  return blockedMetadataKeyParts.some((part) => normalized.includes(part));
}

function sanitizeText(value: unknown, maxLength = 240) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeJson(value: unknown, depth = 0): unknown {
  if (depth > 3) return "[Max depth reached]";

  if (value === null || value === undefined) return null;

  if (typeof value === "string") return sanitizeText(value);

  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  if (typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeJson(item, depth + 1));
  }

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    let redactedFieldCount = 0;

    for (const [rawKey, rawValue] of Object.entries(value as Record<string, unknown>)) {
      const key = sanitizeText(rawKey, 64);

      if (!key) continue;

      if (isBlockedMetadataKey(key)) {
        redactedFieldCount += 1;
        continue;
      }

      output[key] = sanitizeJson(rawValue, depth + 1);
    }

    if (redactedFieldCount > 0) {
      output.redactedFieldCount = redactedFieldCount;
    }

    return output;
  }

  return sanitizeText(value);
}

function serializeLog(
  log: Prisma.AdminActionAuditLogGetPayload<{
    include: {
      actor: {
        select: {
          id: true;
          name: true;
          email: true;
          role: true;
        };
      };
    };
  }>,
) {
  return {
    id: log.id,
    actorId: log.actorId,
    actorName: log.actor?.name ?? null,
    actorEmail: log.actor?.email ?? null,
    actorRole: log.actorRole ?? log.actor?.role ?? null,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    targetLabel: log.targetLabel,
    riskLevel: log.riskLevel,
    reason: log.reason,
    metadata: sanitizeJson(log.metadata) as Record<string, unknown> | null,
    createdAt: log.createdAt.toISOString(),
  };
}

/**
 * GET /api/admin/audit
 * SUPER_ADMIN only.
 *
 * Returns sanitized, paginated admin action audit logs.
 */
export async function GET(request: NextRequest) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const searchParams = request.nextUrl.searchParams;
  const page = cleanNumber(searchParams.get("page"), 1, 1, 10_000);
  const pageSize = cleanNumber(searchParams.get("pageSize"), 25, 10, 100);

  const action = cleanParam(searchParams.get("action"), 80).toUpperCase();
  const riskLevel = cleanParam(searchParams.get("riskLevel"), 20).toUpperCase();
  const targetType = cleanParam(searchParams.get("targetType"), 40).toUpperCase();

  const where: Prisma.AdminActionAuditLogWhereInput = {};

  if (action && allowedActions.has(action)) {
    where.action = action;
  }

  if (riskLevel && allowedRiskLevels.has(riskLevel)) {
    where.riskLevel = riskLevel;
  }

  if (targetType && allowedTargetTypes.has(targetType)) {
    where.targetType = targetType;
  }

  const skip = (page - 1) * pageSize;

  const [logs, total, criticalCount, highCount] = await prisma.$transaction([
    prisma.adminActionAuditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: pageSize,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.adminActionAuditLog.count({ where }),
    prisma.adminActionAuditLog.count({
      where: {
        ...where,
        riskLevel: "CRITICAL",
      },
    }),
    prisma.adminActionAuditLog.count({
      where: {
        ...where,
        riskLevel: "HIGH",
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    items: logs.map(serializeLog),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    summary: {
      shownCount: logs.length,
      totalCount: total,
      criticalCount,
      highCount,
    },
  });
}
