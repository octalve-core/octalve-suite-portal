import { prisma } from "@/lib/prisma";

export type EmailTemplateEventKey =
  | "PROJECT_REQUEST_RECEIVED"
  | "PROJECT_REQUEST_SUBMITTED"
  | "PROJECT_APPROVED"
  | "PAYMENT_INITIALIZED"
  | "PAYMENT_CONFIRMED"
  | "WALLET_TOPUP_CONFIRMED"
  | "PHASE_APPROVAL_REQUESTED"
  | "PHASE_APPROVED"
  | "PHASE_CHANGES_REQUESTED"
  | "SUPPORT_MESSAGE_RECEIVED"
  | "AUTH_VERIFICATION";

export type EmailTemplateVariableMap = Record<string, string | number | boolean | null | undefined>;

export type SendTemplateEmailInput = {
  eventKey: EmailTemplateEventKey | (string & {});
  to: string;
  variables?: EmailTemplateVariableMap;
};

export type SendEmailResult = {
  sent: boolean;
  skipped: boolean;
  provider: string;
  reason?: string;
};

const NOTIFICATION_DEFAULT_ID = "official";

const DEFAULT_EMAIL_TEMPLATES: Array<{
  eventKey: EmailTemplateEventKey;
  title: string;
  subject: string;
  body: string;
}> = [
  {
    eventKey: "PROJECT_REQUEST_RECEIVED",
    title: "Admin: New project request",
    subject: "New project request from {{businessName}}",
    body: "A new project request has been submitted by {{businessName}}. Project: {{projectName}}. Review it in Octalve Workspace.",
  },
  {
    eventKey: "PROJECT_REQUEST_SUBMITTED",
    title: "Client: Project request submitted",
    subject: "We received your project request",
    body: "Hello {{clientName}}, your project request for {{projectName}} has been received and is under review.",
  },
  {
    eventKey: "PROJECT_APPROVED",
    title: "Client: Project approved",
    subject: "Your Octalve project has been approved",
    body: "Hello {{clientName}}, your project {{projectTitle}} has been approved. You can now view payment and phase details in your workspace.",
  },
  {
    eventKey: "PAYMENT_INITIALIZED",
    title: "Client: Payment started",
    subject: "Payment started for {{projectTitle}}",
    body: "Hello {{clientName}}, payment has been started for {{projectTitle}}. Reference: {{paymentReference}}.",
  },
  {
    eventKey: "PAYMENT_CONFIRMED",
    title: "Client: Payment confirmed",
    subject: "Payment confirmed for {{projectTitle}}",
    body: "Hello {{clientName}}, your payment of {{amount}} for {{projectTitle}} has been confirmed.",
  },
  {
    eventKey: "WALLET_TOPUP_CONFIRMED",
    title: "Client: Wallet funding confirmed",
    subject: "Wallet funding confirmed",
    body: "Hello {{clientName}}, your wallet funding of {{amount}} has been confirmed.",
  },
  {
    eventKey: "PHASE_APPROVAL_REQUESTED",
    title: "Client: Phase approval requested",
    subject: "Review required: {{phaseTitle}}",
    body: "Hello {{clientName}}, {{phaseTitle}} is ready for your review in Octalve Workspace.",
  },
  {
    eventKey: "PHASE_APPROVED",
    title: "Team: Phase approved",
    subject: "Phase approved: {{phaseTitle}}",
    body: "{{phaseTitle}} has been approved for {{projectTitle}}.",
  },
  {
    eventKey: "PHASE_CHANGES_REQUESTED",
    title: "Team: Changes requested",
    subject: "Changes requested on {{phaseTitle}}",
    body: "Changes have been requested on {{phaseTitle}} for {{projectTitle}}. Please review the feedback in the workspace.",
  },
  {
    eventKey: "SUPPORT_MESSAGE_RECEIVED",
    title: "Support message received",
    subject: "New support message from {{senderName}}",
    body: "{{senderName}} sent a support message related to {{projectTitle}}.",
  },
  {
    eventKey: "AUTH_VERIFICATION",
    title: "Auth: Email verification",
    subject: "Verify your Octalve Workspace email",
    body: "Hello {{clientName}}, verify your email using this secure link: {{verificationUrl}}",
  },
];

function safeTrim(value: unknown, max = 240) {
  return String(value ?? "").trim().slice(0, max);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function renderTemplate(template: string, variables: EmailTemplateVariableMap = {}) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key];

    if (value === null || value === undefined) return "";

    return String(value).slice(0, 1000);
  });
}

function getSender() {
  const configured = process.env.OCTALVE_EMAIL_FROM?.trim();

  if (configured) return configured;

  return "Octalve Workspace <no-reply@workspace.octalve.com>";
}

function getBrevoSender() {
  const configured = process.env.OCTALVE_EMAIL_FROM?.trim();
  const fallbackEmail = process.env.OCTALVE_EMAIL_FROM_ADDRESS?.trim() || "no-reply@workspace.octalve.com";
  const fallbackName = process.env.OCTALVE_EMAIL_FROM_NAME?.trim() || "Octalve Workspace";

  if (!configured) {
    return {
      email: fallbackEmail,
      name: fallbackName,
    };
  }

  const match = configured.match(/^(.*?)<([^>]+)>$/);

  if (!match) {
    return {
      email: configured,
      name: fallbackName,
    };
  }

  return {
    name: match[1].trim() || fallbackName,
    email: match[2].trim() || fallbackEmail,
  };
}

async function sendWithResend(input: {
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return {
      sent: false,
      skipped: true,
      provider: "RESEND",
      reason: "RESEND_API_KEY is not configured.",
    } satisfies SendEmailResult;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getSender(),
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    return {
      sent: false,
      skipped: false,
      provider: "RESEND",
      reason: `Resend request failed with status ${response.status}.`,
    };
  }

  return {
    sent: true,
    skipped: false,
    provider: "RESEND",
  };
}

async function sendWithBrevo(input: {
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.BREVO_API_KEY?.trim();

  if (!apiKey) {
    return {
      sent: false,
      skipped: true,
      provider: "BREVO",
      reason: "BREVO_API_KEY is not configured.",
    } satisfies SendEmailResult;
  }

  const sender = getBrevoSender();

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: input.to }],
      subject: input.subject,
      textContent: input.text,
    }),
  });

  if (!response.ok) {
    return {
      sent: false,
      skipped: false,
      provider: "BREVO",
      reason: `Brevo request failed with status ${response.status}.`,
    };
  }

  return {
    sent: true,
    skipped: false,
    provider: "BREVO",
  };
}

export async function ensureDefaultEmailTemplates() {
  await Promise.all(
    DEFAULT_EMAIL_TEMPLATES.map((template) =>
      prisma.emailTemplate.upsert({
        where: { eventKey: template.eventKey },
        create: {
          eventKey: template.eventKey,
          title: template.title,
          subject: template.subject,
          body: template.body,
          channel: "EMAIL",
          isEnabled: false,
        },
        update: {},
      }),
    ),
  );
}

export async function sendTemplateEmail(input: SendTemplateEmailInput): Promise<SendEmailResult> {
  const to = safeTrim(input.to, 180).toLowerCase();

  if (!isEmail(to)) {
    return {
      sent: false,
      skipped: true,
      provider: "NONE",
      reason: "Recipient email is invalid.",
    };
  }

  const settings = await prisma.notificationDefaultSetting.findUnique({
    where: { id: NOTIFICATION_DEFAULT_ID },
  });

  if (!settings?.emailAlertsEnabled || settings.emailProvider === "NONE") {
    return {
      sent: false,
      skipped: true,
      provider: settings?.emailProvider ?? "NONE",
      reason: "Email alerts are disabled.",
    };
  }

  const template = await prisma.emailTemplate.findUnique({
    where: { eventKey: input.eventKey },
  });

  if (!template?.isEnabled || template.channel !== "EMAIL") {
    return {
      sent: false,
      skipped: true,
      provider: settings.emailProvider,
      reason: "Email template is disabled or missing.",
    };
  }

  const subject = renderTemplate(template.subject, input.variables).slice(0, 180);
  const text = renderTemplate(template.body, input.variables).slice(0, 5000);

  if (!subject || !text) {
    return {
      sent: false,
      skipped: true,
      provider: settings.emailProvider,
      reason: "Email subject or body is empty.",
    };
  }

  if (settings.emailProvider === "RESEND") {
    return sendWithResend({ to, subject, text });
  }

  if (settings.emailProvider === "BREVO") {
    return sendWithBrevo({ to, subject, text });
  }

  if (settings.emailProvider === "SMTP") {
    return {
      sent: false,
      skipped: true,
      provider: "SMTP",
      reason: "SMTP sending requires a dedicated SMTP dependency batch.",
    };
  }

  return {
    sent: false,
    skipped: true,
    provider: settings.emailProvider,
    reason: "Unsupported email provider.",
  };
}