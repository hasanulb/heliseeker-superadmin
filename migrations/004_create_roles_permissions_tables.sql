-- 004_create_roles_permissions_tables.sql
-- Creates role + role permissions tables for admin access control
-- Also removes legacy `admins.role` CHECK constraint (roles are now dynamic).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Allow dynamic role names (no fixed enum/check list)
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_role_check;

CREATE TABLE IF NOT EXISTS public.roles (
  role_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  permission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(role_id) ON DELETE CASCADE,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT role_permissions_role_module_unique UNIQUE (role_id, module)
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles (lower(name));
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions (role_id);

-- Reuse/update a generic updated_at trigger function (safe to re-run).
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_set_roles_updated_at ON public.roles;
CREATE TRIGGER trg_set_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_set_role_permissions_updated_at ON public.role_permissions;
CREATE TRIGGER trg_set_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Keep policies simple (same pattern as other admin-facing tables in this repo).
DROP POLICY IF EXISTS roles_all_authenticated ON public.roles;
CREATE POLICY roles_all_authenticated
ON public.roles
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS role_permissions_all_authenticated ON public.role_permissions;
CREATE POLICY role_permissions_all_authenticated
ON public.role_permissions
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;

-- Seed baseline roles used by the UI (safe to re-run).
INSERT INTO public.roles (name)
VALUES ('manager'), ('operator')
ON CONFLICT (name) DO NOTHING;

-- Seed a small baseline permission set (edit to fit your needs).
WITH manager AS (
  SELECT role_id FROM public.roles WHERE name = 'manager' LIMIT 1
),
operator AS (
  SELECT role_id FROM public.roles WHERE name = 'operator' LIMIT 1
)
INSERT INTO public.role_permissions (role_id, module, can_view, can_create, can_edit)
SELECT manager.role_id, perms.module, perms.can_view, perms.can_create, perms.can_edit
FROM manager
JOIN (
  VALUES
    ('centers', true, true, true),
    ('leads', true, false, false),
    ('department', true, true, true),
    ('service', true, true, true),
    ('specialization', true, true, true),
    ('ageGroup', true, true, true),
    ('flatPages', true, true, true),
    ('customers', true, false, false),
    ('userManagement', true, true, true),
    ('userRoles', true, false, false)
) AS perms(module, can_view, can_create, can_edit) ON true
ON CONFLICT (role_id, module) DO NOTHING;

WITH operator_role AS (
  SELECT role_id FROM public.roles WHERE name = 'operator' LIMIT 1
)
INSERT INTO public.role_permissions (role_id, module, can_view, can_create, can_edit)
SELECT operator_role.role_id, perms.module, perms.can_view, perms.can_create, perms.can_edit
FROM operator_role
JOIN (
  VALUES
    ('centers', true, false, false),
    ('leads', true, false, false)
) AS perms(module, can_view, can_create, can_edit) ON true
ON CONFLICT (role_id, module) DO NOTHING;

