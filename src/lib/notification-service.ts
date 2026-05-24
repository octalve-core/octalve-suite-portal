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
  email?: {
    to?: string | null;
    eventKey: EmailTemplateEventKey | (string & {});
    variables?: EmailTemplateVariableMap;
  };
};

function cleanText(value: unknown, max = 240) {
  return String(value ?? "").trim().slice(0, max);
}

export async function notifyWorkspace(input: NotifyWorkspaceInput) {
  const title = cleanText(input.title, 120);
  const body = cleanText(input.body, 280);
  const href = input.href ? cleanText(input.href, 240) : null;

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

  const shouldCreateInApp = settings?.inAppAlertsEnabled ?? true;

  const notification = shouldCreateInApp
    ? await prisma.notification.create({
        data: {
          userId: input.userId ?? null,
          role: input.userId ? null : input.role ?? null,
          title,
          body,
          href,
        },
      })
    : null;

  const emailResult =
    input.email?.to
      ? await sendTemplateEmail({
          to: input.email.to,
          eventKey: input.email.eventKey,
          variables: input.email.variables,
        })
      : null;

  return {
    notification,
    email: emailResult,
    skipped: false,
  };
}