alter table public.profiles
  alter column role drop not null;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  internal_operation boolean := coalesce(current_setting('app.beauty_connect_internal', true), '') = 'on';
begin
  if tg_op = 'INSERT' and new.role = 'admin' and not internal_operation and not public.is_admin(auth.uid()) and not public.is_service_role() then
    raise exception 'Admin profiles must be assigned by an authorized administrator.';
  end if;

  if tg_op = 'UPDATE' and new.role is distinct from old.role and not internal_operation and not public.is_admin(auth.uid()) and not public.is_service_role() then
    raise exception 'Profile roles cannot be changed by this user.';
  end if;

  return new;
end;
$$;

alter table public.worker_profiles
  add column if not exists county text,
  add column if not exists town text,
  add column if not exists experience_months integer not null default 0,
  add column if not exists extra_specialty_ids uuid[] not null default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'worker_profiles_experience_months_range') then
    alter table public.worker_profiles
      add constraint worker_profiles_experience_months_range check (experience_months between 0 and 11);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'worker_profiles_county_length') then
    alter table public.worker_profiles
      add constraint worker_profiles_county_length check (county is null or char_length(county) between 2 and 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'worker_profiles_town_length') then
    alter table public.worker_profiles
      add constraint worker_profiles_town_length check (town is null or char_length(town) between 2 and 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'worker_profiles_extra_specialties_limit') then
    alter table public.worker_profiles
      add constraint worker_profiles_extra_specialties_limit check (cardinality(extra_specialty_ids) <= 12);
  end if;
end;
$$;

create or replace function public.enforce_worker_profile_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  internal_operation boolean := coalesce(current_setting('app.beauty_connect_internal', true), '') = 'on';
begin
  if exists (
    select 1 from public.profiles profile
    where profile.id = new.profile_id and profile.role is not null
  ) then
    perform public.enforce_profile_role(new.profile_id, 'worker');
  end if;

  if tg_op = 'UPDATE'
    and (
      new.verification_status is distinct from old.verification_status
      or new.availability_status is distinct from old.availability_status
      or new.is_suspended is distinct from old.is_suspended
    )
    and not internal_operation
    and not public.is_admin(auth.uid())
    and not public.is_service_role()
  then
    raise exception 'Worker status fields must be changed through authorized domain operations.';
  end if;

  if new.verification_status <> 'approved' and new.availability_status = 'matched' then
    raise exception 'Only approved workers can be marked as matched.';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_employer_profile_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  internal_operation boolean := coalesce(current_setting('app.beauty_connect_internal', true), '') = 'on';
begin
  if exists (
    select 1 from public.profiles profile
    where profile.id = new.profile_id and profile.role is not null
  ) then
    perform public.enforce_profile_role(new.profile_id, 'employer');
  end if;

  if tg_op = 'UPDATE'
    and new.is_suspended is distinct from old.is_suspended
    and not internal_operation
    and not public.is_admin(auth.uid())
    and not public.is_service_role()
  then
    raise exception 'Employer moderation fields must be changed through authorized admin operations.';
  end if;

  return new;
end;
$$;

drop policy if exists "Users can create their own non-admin profile" on public.profiles;
create policy "Users can create their own non-admin profile"
on public.profiles for insert
with check (id = auth.uid() and (role is null or role <> 'admin'));

create or replace view public.public_worker_profiles as
select
  wp.id,
  wp.full_name,
  wp.location,
  wp.profile_photo_path,
  wp.category_id,
  c.name as category_name,
  c.slug as category_slug,
  wp.years_experience,
  wp.short_bio,
  wp.work_experience,
  wp.skills,
  wp.compensation_model,
  wp.salary_expectation,
  wp.commission_expectation,
  wp.availability_status,
  wp.created_at,
  wp.updated_at,
  wp.county,
  wp.town,
  wp.experience_months,
  wp.extra_specialty_ids,
  coalesce(
    (
      select array_agg(extra_category.name order by extra_category.name)
      from public.categories extra_category
      where extra_category.id = any(wp.extra_specialty_ids)
    ),
    '{}'::text[]
  ) as extra_specialty_names
from public.worker_profiles wp
left join public.categories c on c.id = wp.category_id
where wp.verification_status = 'approved'
  and wp.is_suspended = false;

create or replace function public.bc_finalize_profile_role(
  p_role public.profile_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or p_role not in ('worker', 'employer') then
    raise exception 'A valid account role is required.';
  end if;

  if p_role = 'worker' and not exists (
    select 1 from public.worker_profiles
    where profile_id = current_user_id and verification_status = 'pending_review'
  ) then
    raise exception 'A worker application must be submitted before locking this role.';
  end if;

  if p_role = 'employer' and not exists (
    select 1 from public.employer_profiles
    where profile_id = current_user_id
  ) then
    raise exception 'An employer profile must be created before locking this role.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);
  update public.profiles
  set role = p_role
  where id = current_user_id and (role is null or role = p_role);

  if not found then
    raise exception 'This account already has a different role.';
  end if;
end;
$$;

revoke execute on function public.bc_finalize_profile_role(public.profile_role) from public;
grant execute on function public.bc_finalize_profile_role(public.profile_role) to authenticated;
