-- 003_add_admin_password_hash.sql
-- Adds hashed password storage for admin login validation.

ALTER TABLE public.admins
ADD COLUMN IF NOT EXISTS password_hash text;
