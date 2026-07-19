ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'DEACTIVATED';

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "deactivatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deactivationReason" TEXT;

ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "deactivatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deactivationReason" TEXT,
  ADD COLUMN IF NOT EXISTS "deactivatedFromStatus" "ProjectStatus";