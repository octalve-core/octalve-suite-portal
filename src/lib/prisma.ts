import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Add connection pool configuration to the database URL
const databaseUrl = process.env.DATABASE_URL;
const poolParams = databaseUrl?.includes("?")
  ? "&connection_limit=10&pool_timeout=30"
  : "?connection_limit=10&pool_timeout=30";
const connectionString = `${databaseUrl}${poolParams}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
          "info",
          "warn",
          "error",
        ]
        : ["warn", "error"],
    adapter,
  });

// In development, enable HMR by storing the Prisma instance in globalThis
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;