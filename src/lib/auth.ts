import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import {
  ac,
  clientRole,
  staffRole,
  projectManagerRole,
  superAdminRole,
} from "@/lib/permissions";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Set to true once a real email transport is configured
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      // TODO: Replace with real email service (Resend, Nodemailer, etc.)
      console.log(`📧 Verification email for ${user.email}: ${url}`);
    },
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
