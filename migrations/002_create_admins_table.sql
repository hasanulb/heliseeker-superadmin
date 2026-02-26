-- 002_create_admins_table.sql
-- Creates admin profile table used by CMS auth/authorization

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.admins (
  admin_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password_hash text,
  role varchar(50) NOT NULL DEFAULT 'super_admin',
  img text,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admins_email_unique UNIQUE (email),
  CONSTRAINT admins_role_check CHECK (role IN ('super_admin', 'admin', 'manager', 'editor'))
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins (lower(email));
CREATE INDEX IF NOT EXISTS idx_admins_auth_user_id ON public.admins (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins (is_active);

CREATE OR REPLACE FUNCTION public.set_admins_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_admins_updated_at ON public.admins;
CREATE TRIGGER trg_set_admins_updated_at
BEFORE UPDATE ON public.admins
FOR EACH ROW
EXECUTE FUNCTION public.set_admins_updated_at();

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admins_select_self ON public.admins;
CREATE POLICY admins_select_self
ON public.admins
FOR SELECT
TO authenticated
USING (email = auth.email());

DROP POLICY IF EXISTS admins_update_self ON public.admins;
CREATE POLICY admins_update_self
ON public.admins
FOR UPDATE
TO authenticated
USING (email = auth.email())
WITH CHECK (email = auth.email());

GRANT SELECT, UPDATE ON public.admins TO authenticated;

-- NOTE:
-- Use /api/auth/setup-super-admin to create initial auth user + admin profile.
