-- User management hardening: account status + admin audit logs

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
    CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BANNED');
  END IF;
END $$;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User" ("status");

CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "targetUserId" TEXT,
  "action" TEXT NOT NULL,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx" ON "AdminAuditLog" ("createdAt");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorId_idx" ON "AdminAuditLog" ("actorId");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_targetUserId_idx" ON "AdminAuditLog" ("targetUserId");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_idx" ON "AdminAuditLog" ("action");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AdminAuditLog_actorId_fkey'
  ) THEN
    ALTER TABLE "AdminAuditLog"
      ADD CONSTRAINT "AdminAuditLog_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AdminAuditLog_targetUserId_fkey'
  ) THEN
    ALTER TABLE "AdminAuditLog"
      ADD CONSTRAINT "AdminAuditLog_targetUserId_fkey"
      FOREIGN KEY ("targetUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
