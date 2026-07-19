CREATE TABLE IF NOT EXISTS "AdminActionAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "actorRole" "Role",
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "targetLabel" TEXT,
  "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminActionAuditLog_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AdminActionAuditLog_actorId_fkey'
  ) THEN
    ALTER TABLE "AdminActionAuditLog"
      ADD CONSTRAINT "AdminActionAuditLog_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AdminActionAuditLog_actorId_createdAt_idx"
  ON "AdminActionAuditLog"("actorId", "createdAt");

CREATE INDEX IF NOT EXISTS "AdminActionAuditLog_action_createdAt_idx"
  ON "AdminActionAuditLog"("action", "createdAt");

CREATE INDEX IF NOT EXISTS "AdminActionAuditLog_targetType_targetId_idx"
  ON "AdminActionAuditLog"("targetType", "targetId");

CREATE INDEX IF NOT EXISTS "AdminActionAuditLog_riskLevel_createdAt_idx"
  ON "AdminActionAuditLog"("riskLevel", "createdAt");