/**
 * Database seed script — creates initial users via Better Auth API.
 *
 * Run with:  pnpm db:seed
 *            (or: npx tsx src/lib/seed-db.ts)
 */
import { auth } from "./auth";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

const SEED_USERS: {
  name: string;
  email: string;
  password: string;
  role: Role;
  company?: string;
  specialty?: string;
  phone?: string;
}[] = [
  {
    name: "Octa Ive",
    email: "octalve0@gmail.com",
    password: "OctalveAdmin2026!",
    role: "SUPER_ADMIN",
    company: "Octalve Team",
  },
  {
    name: "Adedotun Idowu",
    email: "aidowu@octalve.com",
    password: "OctalvePM2026!",
    role: "PROJECT_MANAGER",
    specialty: "PM",
  },
  {
    name: "Marcus Chen",
    email: "marcus@octalve.com",
    password: "OctalveStaff2026!",
    role: "STAFF",
    specialty: "Designer",
  },
  {
    name: "James Wilson",
    email: "james@octalve.com",
    password: "OctalveStaff2026!",
    role: "STAFF",
    specialty: "Strategist",
  },
  {
    name: "Emily Rodriguez",
    email: "emily@octalve.com",
    password: "OctalveStaff2026!",
    role: "STAFF",
    specialty: "Developer",
  },
  {
    name: "Lisa Park",
    email: "lisa@octalve.com",
    password: "OctalveStaff2026!",
    role: "STAFF",
    specialty: "Copywriter",
  },
  {
    name: "hellobrandde",
    email: "hellobrandde@gmail.com",
    password: "ClientDemo2026!",
    role: "CLIENT",
    company: "ChatGPT",
    phone: "08000000000",
  },
  {
    name: "Adecrown",
    email: "adecrown@gmail.com",
    password: "ClientDemo2026!",
    role: "CLIENT",
    company: "Adecrown",
  },
  {
    name: "SFx",
    email: "kolawolemuqaddis@gmail.com",
    password: "ClientDemo2026!",
    role: "CLIENT",
    company: "SFx",
  },
];

async function seed() {
  console.log("🌱 Seeding database...\n");

  for (const user of SEED_USERS) {
    try {
      const { name, email, password, role, ...additionalData } = user;
      
      // Create user via Better Auth
      await auth.api.signUpEmail({
        body: {
          name,
          email,
          password,
          ...additionalData,
        },
      });

      // Update role directly via Prisma since Better Auth blocks it in signUpEmail
      await prisma.user.update({
        where: { email },
        data: { role },
      });

      console.log(`  ✅ ${role.padEnd(16)} ${email}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      
      if (message.includes("already") || message.includes("exists") || message.includes("unique") || message.includes("role is not allowed")) {
        // Even if user exists or failed due to role, ensure their role is correct via Prisma
        try {
          await prisma.user.update({
            where: { email: user.email },
            data: { role: user.role },
          });
          console.log(`  ✅ ${user.role.padEnd(16)} ${user.email} (verified/updated)`);
        } catch (updateErr) {
          console.error(`  ❌ ${user.role.padEnd(16)} ${user.email} (update failed): ${updateErr}`);
        }
      } else {
        console.error(`  ❌ ${user.role.padEnd(16)} ${user.email}: ${message}`);
      }
    }
  }

  console.log("\n🎉 Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
