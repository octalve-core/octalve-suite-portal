import type { Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import {
  type EmailTemplateEventKey,
  type EmailTemplateVariableMap,
  sendTemplateEmail,
} from "@/lib/email-service";

export type NotifyWorkspaceInput = {
  userId?: string | null;
  role?: Role | null;
  title: string;
  body: string;
  href?: string | null;
  eventKey?: EmailTemplateEventKey | (string & {});
  skipInApp?: boolean;
  email?: {
    to?: string | null;
    eventKey: EmailTemplateEventKey | (string & {});
    variables?: EmailTemplateVariableMap;
  };
};

function cleanText(value: unknown, max = 240) {
  return String(value ?? "").trim().slice(0, max);
}

function eventToggleEnabled(
  settings: {
    paymentUpdatesEnabled: boolean;
    approvalNotificationsEnabled: boolean;
    projectUpdatesEnabled: boolean;
    supportMessagesEnabled: boolean;
  } | null,
  eventKey?: string | null,
) {
  if (!eventKey) return true;
  if (!settings) return true;

  if (
    [
      "PAYMENT_INITIALIZED",
      "PAYMENT_CONFIRMED",
      "WALLET_TOPUP_CONFIRMED",
    ].includes(eventKey)
  ) {
    return settings.paymentUpdatesEnabled;
  }

  if (
    [
      "PHASE_APPROVAL_REQUESTED",
      "PHASE_APPROVED",
      "PHASE_CHANGES_REQUESTED",
    ].includes(eventKey)
  ) {
    return settings.approvalNotificationsEnabled;
  }

  if (
    [
      "PROJECT_REQUEST_RECEIVED",
      "PROJECT_REQUEST_SUBMITTED",
      "PROJECT_APPROVED",
    ].includes(eventKey)
  ) {
    return settings.projectUpdatesEnabled;
  }

  if (eventKey === "SUPPORT_MESSAGE_RECEIVED") {
    return settings.supportMessagesEnabled;
  }

  return true;
}

export async function notifyWorkspace(input: NotifyWorkspaceInput) {
  const title = cleanText(input.title, 120);
  const body = cleanText(input.body, 280);
  const href = input.href ? cleanText(input.href, 240) : null;
  const eventKey = input.email?.eventKey ?? input.eventKey ?? null;

  if (!title || !body) {
    return {
      notification: null,
      email: null,
      skipped: true,
      reason: "Notification title or body is empty.",
    };
  }

  const settings = await prisma.notificationDefaultSetting.findUnique({
    where: { id: "official" },
  });

  const eventEnabled = eventToggleEnabled(settings, eventKey);
  const shouldCreateInApp =
    !input.skipInApp && (settings?.inAppAlertsEnabled ?? true) && eventEnabled;

  let notification = null;

  if (shouldCreateInApp) {
    try {
      notification = await prisma.notification.create({
        data: {
          userId: input.userId ?? null,
          role: input.userId ? null : input.role ?? null,
          title,
          body,
          href,
        },
      });
    } catch (error) {
      console.error("[notification-service] In-app notification failed", error);
    }
  }

  let emailResult = null;

  if (input.email?.to && eventKey) {
    if (!eventEnabled) {
      emailResult = {
        sent: false,
        skipped: true,
        provider: settings?.emailProvider ?? "NONE",
        reason: "Notification event is disabled.",
      };
    } else {
      try {
        emailResult = await sendTemplateEmail({
          to: input.email.to,
          eventKey,
          variables: input.email.variables,
        });
      } catch (error) {
        console.error("[notification-service] Email notification failed", error);

        emailResult = {
          sent: false,
          skipped: false,
          provider: settings?.emailProvider ?? "UNKNOWN",
          reason: "Email notification failed without blocking the source event.",
        };
      }
    }
  }

  return {
    notification,
    email: emailResult,
    skipped: false,
  };
}