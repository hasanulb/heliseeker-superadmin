-- 006_create_center_profiles_table.sql
-- Creates the center approval/onboarding table used by Center Management.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'center_approval_status') THEN
    CREATE TYPE public.center_approval_status AS ENUM (
      'submitted',
      'pending',
      'active',
      'deactive',
      'rejected',
      'blacklisted'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'center_approval_status'
      AND e.enumlabel = 'submitted'
  ) THEN
    ALTER TYPE public.center_approval_status ADD VALUE 'submitted';
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.center_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  center_name text NOT NULL,
  contact_email text,
  contact_phone text,
  approval_status public.center_approval_status NOT NULL DEFAULT 'submitted',
  approval_note text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_center_profiles_created_at ON public.center_profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_center_profiles_approval_status ON public.center_profiles (approval_status);
CREATE INDEX IF NOT EXISTS idx_center_profiles_contact_email ON public.center_profiles (lower(contact_email));
CREATE INDEX IF NOT EXISTS idx_center_profiles_contact_phone ON public.center_profiles (contact_phone);

CREATE OR REPLACE FUNCTION public.set_center_profiles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_center_profiles_updated_at ON public.center_profiles;
CREATE TRIGGER trg_set_center_profiles_updated_at
BEFORE UPDATE ON public.center_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_center_profiles_updated_at();

ALTER TABLE public.center_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS center_profiles_insert_own ON public.center_profiles;
CREATE POLICY center_profiles_insert_own
ON public.center_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS center_profiles_select_own ON public.center_profiles;
CREATE POLICY center_profiles_select_own
ON public.center_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS center_profiles_update_own ON public.center_profiles;
CREATE POLICY center_profiles_update_own
ON public.center_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Admin/CMS uses a server-side DB connection; grant read for authenticated to support non-admin views if needed.
GRANT SELECT, INSERT, UPDATE ON public.center_profiles TO authenticated;

