-- Voyager Logs schema hardening + search indexes

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT,
ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMP(3);

ALTER TABLE "Post"
ADD COLUMN IF NOT EXISTS "excerpt" TEXT,
ADD COLUMN IF NOT EXISTS "published" BOOLEAN DEFAULT true;

UPDATE "Post" SET "published" = true WHERE "published" IS NULL;

CREATE INDEX IF NOT EXISTS "Post_title_idx" ON "Post" ("title");
CREATE INDEX IF NOT EXISTS "Post_published_createdAt_idx" ON "Post" ("published", "createdAt");

-- Fuzzy search support
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Post_title_trgm_idx" ON "Post" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Post_content_trgm_idx" ON "Post" USING GIN ("content" gin_trgm_ops);
