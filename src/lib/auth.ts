import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { sendAuthVerificationEmail } from "@/lib/email-service";
import {
  ac,
  clientRole,
  staffRole,
  projectManagerRole,
  superAdminRole,
} from "@/lib/permissions";


const OCTALVE_AUTH_BASE_URL =
  process.env.BETTER_AUTH_URL || "https://workspace.octalve.com";

const OCTALVE_AUTH_TRUSTED_ORIGINS = Array.from(
  new Set(
    [
      OCTALVE_AUTH_BASE_URL,
      "https://workspace.octalve.com",
      "https://octalve-suite-portal.vercel.app",
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    ].filter(Boolean),
  ),
);

const hasGoogleOAuth =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET);

async function sendVerificationEmail({
  user,
  url,
}: {
  user: { email: string };
  url: string;
}) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[dev-email] Verification link for ${user.email}: ${url}`);
    return;
  }

  /**
   * Production email transport should be connected here.
   * Recommended options: Resend, Postmark, SendGrid, SMTP/Nodemailer.
   *
   * Until then, do not log verification URLs in production.
   */
}

export const auth = betterAuth({
  baseURL: OCTALVE_AUTH_BASE_URL,
  trustedOrigins: OCTALVE_AUTH_TRUSTED_ORIGINS,
  database: prismaAdapter(prisma, {
    provider: (process.env.DATABASE_URL ?? "").startsWith("file:")
      ? "sqlite"
      : "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification:
      process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true",
  },
  socialProviders: hasGoogleOAuth
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
  emailVerification: {
    sendOnSignUp:
      process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true",
    sendVerificationEmail,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "CLIENT" },
      phone: { type: "string", required: false },
      company: { type: "string", required: false },
      specialty: { type: "string", required: false },
    },
  },
  plugins: [
    admin({
      defaultRole: "CLIENT",
      adminRoles: ["SUPER_ADMIN", "PROJECT_MANAGER"],
      ac,
      roles: {
        CLIENT: clientRole,
        STAFF: staffRole,
        PROJECT_MANAGER: projectManagerRole,
        SUPER_ADMIN: superAdminRole,
      },
    }),
  ],
});
