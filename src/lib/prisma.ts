import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isSQLite = databaseUrl.startsWith("file:");

  const logConfig =
    process.env.NODE_ENV === "development"
      ? (["info", "warn", "error"] as const)
      : (["warn", "error"] as const);

  if (isSQLite) {
    // SQLite — use better-sqlite3 adapter (Prisma 7 client engine requires an adapter)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const path = require("path");

    // Resolve the file path relative to CWD (matches Prisma CLI behavior)
    const dbPath = databaseUrl.replace(/^file:/, "");
    const absolutePath = path.isAbsolute(dbPath)
      ? dbPath
      : path.resolve(/* turbopackIgnore: true */ process.cwd(), dbPath);

    const adapter = new PrismaBetterSqlite3({ url: absolutePath });
    return new PrismaClient({ log: [...logConfig], adapter });
  }

  // PostgreSQL — use @prisma/adapter-pg with connection pool
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require("@prisma/adapter-pg");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg");

  const poolParams = databaseUrl.includes("?")
    ? "&connection_limit=10&pool_timeout=30"
    : "?connection_limit=10&pool_timeout=30";
  const connectionString = `${databaseUrl}${poolParams}`;

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ log: [...logConfig], adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

// In development, enable HMR by storing the Prisma instance in globalThis
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;