-- Community/private logs fields and indexes.
-- Backfill existing posts as publicly visible to preserve current behavior.

ALTER TABLE "Post"
ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "publishedByAdmin" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Post"
SET
  "isPublic" = true,
  "isApproved" = true,
  "publishedByAdmin" = true,
  "published" = true;

CREATE INDEX IF NOT EXISTS "Post_isPublic_idx" ON "Post" ("isPublic");
CREATE INDEX IF NOT EXISTS "Post_isApproved_idx" ON "Post" ("isApproved");
CREATE INDEX IF NOT EXISTS "Post_authorId_isPublic_createdAt_idx" ON "Post" ("authorId", "isPublic", "createdAt");
