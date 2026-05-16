# Database Switching — Done ✅

**Three files modified, one new script created:**

| Files Modified | Changes |
|-----------------|---------|
| `scripts/switch-db.mjs` | New — toggles schema provider + .env URL + regenerates Prisma client |
| `src/lib/prisma.ts` | Dynamic client: loads @prisma/adapter-pg only for PostgreSQL, uses built-in driver for SQLite |
| `src/lib/auth.ts` | Dynamic better-auth adapter provider based on DATABASE_URL |
| `package.json` | Added `db:use:pg` and `db:use:sqlite` scripts |
| `.env`                                            | Pre-staged both database URLs (active + commented) |

## Usage

### Switch to SQLite (for offline/local dev)
```bash
npm run db:use:sqlite
npx prisma db push        # create tables
npm run db:seed            # seed data
```

### Switch back to PostgreSQL
```bash
npm run db:use:pg
npx prisma db push         # sync schema
```

### Check current provider
```bash
npx node scripts/switch-db.mjs
```

**Note:** The SQLite database file will be created at `prisma/dev.db`. Your schema's enum types are fully compatible — Prisma emulates them as string checks for SQLite.

