import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "CLIENT" },
      phone: { type: "string", required: false },
      company: { type: "string", required: false },
      specialty: { type: "string", required: false },
    },
  },
});
