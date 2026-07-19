# Production migration discipline

Production database changes must use committed Prisma migrations.

## Allowed

- Create and review Prisma migration files locally.
- Commit migration files under `prisma/migrations/`.
- Apply reviewed production migrations intentionally with `prisma migrate deploy` in a controlled production environment.

## Not allowed

- Do not use schema-push shortcuts against production.
- Do not run seed scripts against production.
- Do not paste production database URLs into shell history or chat.
- Do not rely on manual schema edits as the normal deployment path.

## Emergency note

Manual Neon SQL was used once to recover production schema drift after the deployed code expected columns that were not yet present in production. That was an incident recovery path, not the standard operating model.
