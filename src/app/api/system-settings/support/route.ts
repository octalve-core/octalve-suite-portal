import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  errorResponse,
  getSessionOrThrow,
  requireRoles,
} from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORT_SETTING_ID = "official";

const DEFAULT_SUPPORT_SETTING = {
  id: SUPPORT_SETTING_ID,
  supportEmail: "info@octalve.com",
  guideUrl: "https://octalve.com/trends",
  preferPhaseThreadSupport: true,
  paymentDisputeSafetyText:
    "For payment disputes, include the payment reference only. Do not send card details, OTPs, passwords, private keys, or admin credentials.",
};

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function serialize(setting: typeof DEFAULT_SUPPORT_SETTING & { createdAt?: Date; updatedAt?: Date }) {
  return {
    id: setting.id,
    supportEmail: setting.supportEmail,
    guideUrl: setting.guideUrl,
    preferPhaseThreadSupport: setting.preferPhaseThreadSupport,
    paymentDisputeSafetyText: setting.paymentDisputeSafetyText,
    createdAt: setting.createdAt?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: setting.updatedAt?.toISOString() ?? new Date(0).toISOString(),
  };
}

export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const setting = await prisma.supportSetting.findUnique({
    where: { id: SUPPORT_SETTING_ID },
  });

  return noStoreJson(serialize(setting ?? DEFAULT_SUPPORT_SETTING));
}

export async function PATCH(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));

  const supportEmail = String(body.supportEmail ?? "").trim().toLowerCase();
  const guideUrl = String(body.guideUrl ?? "").trim();
  const paymentDisputeSafetyText = String(body.paymentDisputeSafetyText ?? "")
    .trim()
    .slice(0, 500);
  const preferPhaseThreadSupport = Boolean(body.preferPhaseThreadSupport);

  if (!isValidEmail(supportEmail)) {
    return errorResponse("A valid support email is required.", 400);
  }

  if (!isValidHttpUrl(guideUrl)) {
    return errorResponse("A valid support guide URL is required.", 400);
  }

  if (!paymentDisputeSafetyText) {
    return errorResponse("Payment dispute safety text is required.", 400);
  }

  const saved = await prisma.supportSetting.upsert({
    where: { id: SUPPORT_SETTING_ID },
    create: {
      id: SUPPORT_SETTING_ID,
      supportEmail,
      guideUrl,
      preferPhaseThreadSupport,
      paymentDisputeSafetyText,
    },
    update: {
      supportEmail,
      guideUrl,
      preferPhaseThreadSupport,
      paymentDisputeSafetyText,
    },
  });

  return noStoreJson(serialize(saved));
}