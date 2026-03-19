-- Add 'delete' to the permission catalog used by role_permissions join table.
-- Safe to run multiple times.

insert into public.permissions (permission_name)
values ('delete')
on conflict (permission_name) do nothing;
