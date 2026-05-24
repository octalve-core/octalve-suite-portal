import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  errorResponse,
  getSessionOrThrow,
  requireRoles,
} from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKSPACE_DEFAULT_ID = "official";

const UPDATE_FREQUENCIES = new Set([
  "REAL_TIME",
  "DAILY_DIGEST",
  "WEEKLY_DIGEST",
  "IMPORTANT_ONLY",
]);

const EMAIL_DIGESTS = new Set([
  "SUMMARY_OF_ALL_ACTIVITY",
  "PAYMENTS_AND_APPROVALS",
  "PROJECT_ACTIVITY_ONLY",
  "NONE",
]);

const DEFAULT_WORKSPACE_DEFAULTS = {
  id: WORKSPACE_DEFAULT_ID,
  defaultTimezone: "Africa/Lagos",
  defaultLanguage: "English (US)",
  updateFrequency: "WEEKLY_DIGEST",
  emailDigest: "SUMMARY_OF_ALL_ACTIVITY",
  allowClientPreferenceOverride: false,
};

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function cleanText(value: unknown, fallback: string, max = 80) {
  const text = String(value ?? fallback).trim().slice(0, max);
  return text || fallback;
}

function serialize(setting: typeof DEFAULT_WORKSPACE_DEFAULTS & { createdAt?: Date; updatedAt?: Date }) {
  return {
    id: setting.id,
    defaultTimezone: setting.defaultTimezone,
    defaultLanguage: setting.defaultLanguage,
    updateFrequency: setting.updateFrequency,
    emailDigest: setting.emailDigest,
    allowClientPreferenceOverride: setting.allowClientPreferenceOverride,
    createdAt: setting.createdAt?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: setting.updatedAt?.toISOString() ?? new Date(0).toISOString(),
  };
}

export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const setting = await prisma.workspaceDefaultSetting.findUnique({
    where: { id: WORKSPACE_DEFAULT_ID },
  });

  return noStoreJson(serialize(setting ?? DEFAULT_WORKSPACE_DEFAULTS));
}

export async function PATCH(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));

  const updateFrequency = String(
    body.updateFrequency ?? DEFAULT_WORKSPACE_DEFAULTS.updateFrequency,
  )
    .trim()
    .toUpperCase();

  const emailDigest = String(body.emailDigest ?? DEFAULT_WORKSPACE_DEFAULTS.emailDigest)
    .trim()
    .toUpperCase();

  if (!UPDATE_FREQUENCIES.has(updateFrequency)) {
    return errorResponse("Unsupported update frequency.", 400);
  }

  if (!EMAIL_DIGESTS.has(emailDigest)) {
    return errorResponse("Unsupported email digest setting.", 400);
  }

  const saved = await prisma.workspaceDefaultSetting.upsert({
    where: { id: WORKSPACE_DEFAULT_ID },
    create: {
      id: WORKSPACE_DEFAULT_ID,
      defaultTimezone: cleanText(body.defaultTimezone, "Africa/Lagos", 80),
      defaultLanguage: cleanText(body.defaultLanguage, "English (US)", 60),
      updateFrequency,
      emailDigest,
      allowClientPreferenceOverride: Boolean(body.allowClientPreferenceOverride),
    },
    update: {
      defaultTimezone: cleanText(body.defaultTimezone, "Africa/Lagos", 80),
      defaultLanguage: cleanText(body.defaultLanguage, "English (US)", 60),
      updateFrequency,
      emailDigest,
      allowClientPreferenceOverride: Boolean(body.allowClientPreferenceOverride),
    },
  });

  return noStoreJson(serialize(saved));
}