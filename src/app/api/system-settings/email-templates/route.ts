import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  errorResponse,
  getSessionOrThrow,
  requireRoles,
} from "@/lib/api-helpers";
import { ensureDefaultEmailTemplates } from "@/lib/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_CHANNELS = new Set(["EMAIL"]);

function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function cleanText(value: unknown, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function serialize(template: {
  id: string;
  eventKey: string;
  title: string;
  subject: string;
  body: string;
  channel: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: template.id,
    eventKey: template.eventKey,
    title: template.title,
    subject: template.subject,
    body: template.body,
    channel: template.channel,
    isEnabled: template.isEnabled,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export async function GET() {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  await ensureDefaultEmailTemplates();

  const templates = await prisma.emailTemplate.findMany({
    orderBy: [{ channel: "asc" }, { eventKey: "asc" }],
  });

  return noStoreJson(templates.map(serialize));
}

export async function PATCH(request: Request) {
  const result = await getSessionOrThrow();
  if (result.error) return result.error;

  const forbidden = requireRoles(result.role, "SUPER_ADMIN");
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));

  const eventKey = cleanText(body.eventKey, 120).toUpperCase();
  const title = cleanText(body.title, 140);
  const subject = cleanText(body.subject, 180);
  const templateBody = cleanText(body.body, 5000);
  const channel = cleanText(body.channel || "EMAIL", 40).toUpperCase();
  const isEnabled = Boolean(body.isEnabled);

  if (!eventKey) {
    return errorResponse("Template event key is required.", 400);
  }

  if (!title) {
    return errorResponse("Template title is required.", 400);
  }

  if (!subject) {
    return errorResponse("Template subject is required.", 400);
  }

  if (!templateBody) {
    return errorResponse("Template body is required.", 400);
  }

  if (!ALLOWED_CHANNELS.has(channel)) {
    return errorResponse("Unsupported template channel.", 400);
  }

  const saved = await prisma.emailTemplate.upsert({
    where: { eventKey },
    create: {
      eventKey,
      title,
      subject,
      body: templateBody,
      channel,
      isEnabled,
    },
    update: {
      title,
      subject,
      body: templateBody,
      channel,
      isEnabled,
    },
  });

  return noStoreJson(serialize(saved));
}