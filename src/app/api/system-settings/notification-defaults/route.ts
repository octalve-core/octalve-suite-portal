import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  errorResponse,
  getSessionOrThrow,
  requireRoles,
} from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOTIFICATION_DEFAULT_ID = "official";

const EMAIL_PROVIDERS = new Set(["NONE", "RESEND", "BREVO", "SMTP"]);

const DEFAULT_NOTIFICATION_DEFAULTS = {
  id: NOTIFICATION_DEFAULT_ID,
  inAppAlertsEnabled: true,
  emailAlertsEnabled: false,
  paymentUpdatesEnabled: true,
  approvalNotificationsEnabled: true,
  projectUpdatesEnabled: true,
  supportMessagesEnabled: false,
  emailProvider: "NONE",
};

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function serialize(setting: typeof DEFAULT_NOTIFICATION_DEFAULTS & { createdAt?: Date; updatedAt?: Date }) {
  return {
    id: setting.id,
    inAppAlertsEnabled: setting.inAppAlertsEnabled,
    emailAlertsEnabled: setting.emailAlertsEnabled,
    paymentUpdatesEnabled: setting.paymentUpdatesEnabled,
    approvalNotificationsEnabled: setting.approvalNotificationsEnabled,
    projectUpdatesEnabled: setting.projectUpdatesEnabled,
    supportMessagesEnabled: setting.supportMessagesEnabled,
    emailProvider: setting.emailProvider,
    createdAt: setting.createdAt?.toISOString() ?? new Date(0).toISOString(),
    updatedAt: setting.updatedAt?.toISOString() ?? new Date(0).toISOString(),
  };
}

export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const setting = await prisma.notificationDefaultSetting.findUnique({
    where: { id: NOTIFICATION_DEFAULT_ID },
  });

  return noStoreJson(serialize(setting ?? DEFAULT_NOTIFICATION_DEFAULTS));
}

export async function PATCH(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));

  const emailProvider = String(body.emailProvider ?? "NONE").trim().toUpperCase();

  if (!EMAIL_PROVIDERS.has(emailProvider)) {
    return errorResponse("Unsupported email provider.", 400);
  }

  const emailAlertsEnabled = Boolean(body.emailAlertsEnabled);

  if (emailAlertsEnabled && emailProvider === "NONE") {
    return errorResponse("Choose an email provider before enabling email alerts.", 400);
  }

  const saved = await prisma.notificationDefaultSetting.upsert({
    where: { id: NOTIFICATION_DEFAULT_ID },
    create: {
      id: NOTIFICATION_DEFAULT_ID,
      inAppAlertsEnabled: Boolean(body.inAppAlertsEnabled),
      emailAlertsEnabled,
      paymentUpdatesEnabled: Boolean(body.paymentUpdatesEnabled),
      approvalNotificationsEnabled: Boolean(body.approvalNotificationsEnabled),
      projectUpdatesEnabled: Boolean(body.projectUpdatesEnabled),
      supportMessagesEnabled: Boolean(body.supportMessagesEnabled),
      emailProvider,
    },
    update: {
      inAppAlertsEnabled: Boolean(body.inAppAlertsEnabled),
      emailAlertsEnabled,
      paymentUpdatesEnabled: Boolean(body.paymentUpdatesEnabled),
      approvalNotificationsEnabled: Boolean(body.approvalNotificationsEnabled),
      projectUpdatesEnabled: Boolean(body.projectUpdatesEnabled),
      supportMessagesEnabled: Boolean(body.supportMessagesEnabled),
      emailProvider,
    },
  });

  return noStoreJson(serialize(saved));
}