#!/usr/bin/env node
/**
 * switch-db.mjs — Toggle between PostgreSQL and SQLite for Prisma.
 *
 * Usage:
 *   node scripts/switch-db.mjs postgres   # switch to PostgreSQL
 *   node scripts/switch-db.mjs sqlite     # switch to SQLite
 *   node scripts/switch-db.mjs            # show current provider
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SCHEMA = resolve(ROOT, "prisma/schema.prisma");
const ENV_FILE = resolve(ROOT, ".env");

const SQLITE_URL = `file:./dev.db`;
const PG_PLACEHOLDER = `postgresql://roji:roji@127.0.0.1:5432/octalve_suite?schema=public`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readFile(path) {
  return readFileSync(path, "utf-8");
}
function writeFile(path, content) {
  writeFileSync(path, content, "utf-8");
}

function getCurrentProvider(schema) {
  const match = schema.match(/provider\s*=\s*"(postgresql|sqlite)"/);
  return match?.[1] ?? null;
}

// ─── Schema swap ──────────────────────────────────────────────────────────────

function setSchemaProvider(target) {
  let schema = readFile(SCHEMA);
  const current = getCurrentProvider(schema);

  if (current === target) {
    console.log(`✓  Schema already set to "${target}".`);
    return false;
  }

  // Swap the provider line inside datasource db { ... }
  schema = schema.replace(
    /provider\s*=\s*"(postgresql|sqlite)"/,
    `provider = "${target}"`
  );

  writeFile(SCHEMA, schema);
  console.log(`✓  Schema provider: ${current} → ${target}`);
  return true;
}

// ─── .env swap ────────────────────────────────────────────────────────────────

function setEnvDatabaseUrl(target) {
  let env = readFile(ENV_FILE);

  // Extract current DATABASE_URL (uncommented line)
  const activeMatch = env.match(/^DATABASE_URL="(.+)"$/m);
  const currentUrl = activeMatch?.[1] ?? "";

  let newUrl;
  if (target === "sqlite") {
    newUrl = SQLITE_URL;
  } else {
    // Find all commented-out PG URLs and pick the last one (user's actual URL)
    const commentedPgMatches = [
      ...env.matchAll(/^#\s*DATABASE_URL="(postgresql:\/\/.+)"$/gm),
    ];
    const lastPg = commentedPgMatches[commentedPgMatches.length - 1];
    newUrl = lastPg?.[1] ?? PG_PLACEHOLDER;
  }

  if (currentUrl === newUrl) {
    console.log(`✓  DATABASE_URL already set for "${target}".`);
    return;
  }

  // Comment out the current active line
  env = env.replace(
    /^(DATABASE_URL=".*")$/m,
    `# $1`
  );

  // Uncomment the specific target URL line
  const escapedUrl = newUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const specificRegex = new RegExp(
    `^#\\s*(DATABASE_URL="${escapedUrl}")$`,
    "m"
  );

  if (specificRegex.test(env)) {
    env = env.replace(specificRegex, `$1`);
  } else {
    // Target URL not found as a comment — append it after the last DATABASE_URL line
    env = env.replace(
      /^(#\s*DATABASE_URL=".+")$/m,
      `$1\nDATABASE_URL="${newUrl}"`
    );
  }

  writeFile(ENV_FILE, env);
  console.log(`✓  DATABASE_URL → ${newUrl}`);
}

// ─── Regenerate client ────────────────────────────────────────────────────────

function regenerate() {
  console.log("\n⏳ Regenerating Prisma client...");
  execSync("npx prisma generate", { cwd: ROOT, stdio: "inherit" });
  console.log("✓  Prisma client regenerated.\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const arg = process.argv[2]?.toLowerCase();

if (!arg) {
  const schema = readFile(SCHEMA);
  const current = getCurrentProvider(schema);
  console.log(`Current database provider: ${current}`);
  console.log(`\nUsage:`);
  console.log(`  npm run db:use:pg       # switch to PostgreSQL`);
  console.log(`  npm run db:use:sqlite   # switch to SQLite`);
  process.exit(0);
}

const target = arg === "pg" || arg === "postgres" || arg === "postgresql"
  ? "postgresql"
  : arg === "sqlite" || arg === "lite"
    ? "sqlite"
    : null;

if (!target) {
  console.error(`❌ Unknown target "${arg}". Use "postgres" or "sqlite".`);
  process.exit(1);
}

console.log(`\n🔄 Switching database to ${target}...\n`);

const changed = setSchemaProvider(target);
setEnvDatabaseUrl(target);

if (changed) {
  regenerate();
  console.log(`💡 Next steps:`);
  if (target === "sqlite") {
    console.log(`   npx prisma db push     # create SQLite tables`);
    console.log(`   npm run db:seed        # seed demo data`);
  } else {
    console.log(`   npx prisma db push     # sync PostgreSQL schema`);
    console.log(`   npm run db:seed        # seed demo data (if needed)`);
  }
  console.log(`\n⚠️  Clear browser cookies for localhost to avoid stale session loops.`);
} else {
  console.log(`\nNothing to do — already on ${target}.`);
}
