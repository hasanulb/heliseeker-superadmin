DO $$ BEGIN
  CREATE TYPE "center_approval_status" AS ENUM ('pending', 'active', 'deactive', 'rejected', 'blacklisted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "center_profiles"
  ADD COLUMN IF NOT EXISTS "approval_status" "center_approval_status" NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "approval_note" text,
  ADD COLUMN IF NOT EXISTS "decided_at" timestamp with time zone;
