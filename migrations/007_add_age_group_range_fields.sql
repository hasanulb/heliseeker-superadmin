-- Add structured age range fields to age_groups (used by /admin/masters/age-groups).
-- Safe to run multiple times.

alter table public.age_groups
  add column if not exists from_age integer,
  add column if not exists to_age integer,
  add column if not exists unit text,
  add column if not exists status boolean not null default true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'age_groups_unit_check'
  ) then
    alter table public.age_groups
      add constraint age_groups_unit_check
      check (unit in ('month', 'year') or unit is null);
  end if;
end $$;

create index if not exists idx_age_groups_status on public.age_groups(status);
