import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORT_SETTING_ID = "official";
const WORKSPACE_DEFAULT_ID = "official";
const NOTIFICATION_DEFAULT_ID = "official";

const DEFAULT_SUPPORT = {
  supportEmail: "info@octalve.com",
  guideUrl: "https://octalve.com/trends",
  preferPhaseThreadSupport: true,
  paymentDisputeSafetyText:
    "For payment disputes, include the payment reference only. Do not send card details, OTPs, passwords, private keys, or admin credentials.",
};

const DEFAULT_WORKSPACE = {
  defaultTimezone: "Africa/Lagos",
  defaultLanguage: "English (US)",
  updateFrequency: "WEEKLY_DIGEST",
  emailDigest: "SUMMARY_OF_ALL_ACTIVITY",
  allowClientPreferenceOverride: false,
};

const DEFAULT_NOTIFICATIONS = {
  inAppAlertsEnabled: true,
  emailAlertsEnabled: false,
  paymentUpdatesEnabled: true,
  approvalNotificationsEnabled: true,
  projectUpdatesEnabled: true,
  supportMessagesEnabled: false,
};

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const [support, workspaceDefaults, notificationDefaults] = await Promise.all([
    prisma.supportSetting.findUnique({
      where: { id: SUPPORT_SETTING_ID },
      select: {
        supportEmail: true,
        guideUrl: true,
        preferPhaseThreadSupport: true,
        paymentDisputeSafetyText: true,
        updatedAt: true,
      },
    }),
    prisma.workspaceDefaultSetting.findUnique({
      where: { id: WORKSPACE_DEFAULT_ID },
      select: {
        defaultTimezone: true,
        defaultLanguage: true,
        updateFrequency: true,
        emailDigest: true,
        allowClientPreferenceOverride: true,
        updatedAt: true,
      },
    }),
    prisma.notificationDefaultSetting.findUnique({
      where: { id: NOTIFICATION_DEFAULT_ID },
      select: {
        inAppAlertsEnabled: true,
        emailAlertsEnabled: true,
        paymentUpdatesEnabled: true,
        approvalNotificationsEnabled: true,
        projectUpdatesEnabled: true,
        supportMessagesEnabled: true,
        updatedAt: true,
      },
    }),
  ]);

  return noStoreJson({
    support: {
      supportEmail: support?.supportEmail ?? DEFAULT_SUPPORT.supportEmail,
      guideUrl: support?.guideUrl ?? DEFAULT_SUPPORT.guideUrl,
      preferPhaseThreadSupport:
        support?.preferPhaseThreadSupport ?? DEFAULT_SUPPORT.preferPhaseThreadSupport,
      paymentDisputeSafetyText:
        support?.paymentDisputeSafetyText ?? DEFAULT_SUPPORT.paymentDisputeSafetyText,
    },
    workspaceDefaults: {
      defaultTimezone:
        workspaceDefaults?.defaultTimezone ?? DEFAULT_WORKSPACE.defaultTimezone,
      defaultLanguage:
        workspaceDefaults?.defaultLanguage ?? DEFAULT_WORKSPACE.defaultLanguage,
      updateFrequency:
        workspaceDefaults?.updateFrequency ?? DEFAULT_WORKSPACE.updateFrequency,
      emailDigest: workspaceDefaults?.emailDigest ?? DEFAULT_WORKSPACE.emailDigest,
      allowClientPreferenceOverride:
        workspaceDefaults?.allowClientPreferenceOverride ??
        DEFAULT_WORKSPACE.allowClientPreferenceOverride,
    },
    notifications: {
      inAppAlertsEnabled:
        notificationDefaults?.inAppAlertsEnabled ??
        DEFAULT_NOTIFICATIONS.inAppAlertsEnabled,
      emailAlertsEnabled:
        notificationDefaults?.emailAlertsEnabled ??
        DEFAULT_NOTIFICATIONS.emailAlertsEnabled,
      paymentUpdatesEnabled:
        notificationDefaults?.paymentUpdatesEnabled ??
        DEFAULT_NOTIFICATIONS.paymentUpdatesEnabled,
      approvalNotificationsEnabled:
        notificationDefaults?.approvalNotificationsEnabled ??
        DEFAULT_NOTIFICATIONS.approvalNotificationsEnabled,
      projectUpdatesEnabled:
        notificationDefaults?.projectUpdatesEnabled ??
        DEFAULT_NOTIFICATIONS.projectUpdatesEnabled,
      supportMessagesEnabled:
        notificationDefaults?.supportMessagesEnabled ??
        DEFAULT_NOTIFICATIONS.supportMessagesEnabled,
    },
    updatedAt:
      support?.updatedAt?.toISOString() ??
      workspaceDefaults?.updatedAt?.toISOString() ??
      notificationDefaults?.updatedAt?.toISOString() ??
      new Date(0).toISOString(),
  });
}