ALTER TABLE public.admins
ADD COLUMN IF NOT EXISTS password_hash text;
