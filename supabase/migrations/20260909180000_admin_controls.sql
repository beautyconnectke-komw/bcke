create table if not exists public.admin_email_whitelist (
  email text primary key,
  created_at timestamptz not null default now(),
  constraint admin_email_whitelist_email_format
    check (email = lower(trim(email)) and position('@' in email) > 1)
);

alter table public.admin_email_whitelist enable row level security;
revoke all on table public.admin_email_whitelist from anon, authenticated;

drop policy if exists "Admins can view admin email whitelist"
  on public.admin_email_whitelist;
create policy "Admins can view admin email whitelist"
on public.admin_email_whitelist for select
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage admin email whitelist"
  on public.admin_email_whitelist;
create policy "Admins can manage admin email whitelist"
on public.admin_email_whitelist for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

grant select, insert, update, delete
on table public.admin_email_whitelist
to authenticated;

alter table public.worker_profiles
  add column if not exists featured_rank integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'worker_profiles_featured_rank_range'
  ) then
    alter table public.worker_profiles
      add constraint worker_profiles_featured_rank_range
      check (featured_rank is null or featured_rank between 1 and 8);
  end if;
end;
$$;

create unique index if not exists worker_profiles_featured_rank_idx
on public.worker_profiles (featured_rank)
where featured_rank is not null;

create or replace function public.bc_add_admin_email_whitelist(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(p_email));
  target_user_id uuid;
  existing_role public.profile_role;
  display_name text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  if normalized_email is null
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  then
    raise exception 'Enter a valid email address.';
  end if;

  select id, coalesce(raw_user_meta_data ->> 'full_name', split_part(normalized_email, '@', 1))
  into target_user_id, display_name
  from auth.users
  where lower(email) = normalized_email
  limit 1;

  if target_user_id is null then
    raise exception 'That email must already exist in Supabase Auth users.';
  end if;

  select role into existing_role
  from public.profiles
  where id = target_user_id;

  if existing_role is not null and existing_role <> 'admin' then
    raise exception 'This account already has a different role.';
  end if;

  insert into public.admin_email_whitelist (email)
  values (normalized_email)
  on conflict (email) do nothing;

  perform set_config('app.beauty_connect_internal', 'on', true);
  insert into public.profiles (id, role, display_name)
  values (target_user_id, 'admin', display_name)
  on conflict (id) do update
    set role = 'admin'::public.profile_role;

  return normalized_email;
end;
$$;

create or replace function public.bc_remove_admin_email_whitelist(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  delete from public.admin_email_whitelist
  where email = lower(trim(p_email));
end;
$$;

create or replace function public.bc_set_featured_workers(
  p_worker_profile_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  worker_ids uuid[] := coalesce(p_worker_profile_ids, '{}'::uuid[]);
  rank_index integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  if cardinality(worker_ids) > 8 then
    raise exception 'You can feature at most 8 workers.';
  end if;

  if (
    select count(*) from (select distinct worker_id from unnest(worker_ids) as worker_id) unique_ids
  ) <> cardinality(worker_ids) then
    raise exception 'A worker can only appear once in the featured list.';
  end if;

  if (
    select count(*) from public.worker_profiles where id = any(worker_ids)
  ) <> cardinality(worker_ids) then
    raise exception 'One or more selected workers could not be found.';
  end if;

  if exists (
    select 1
    from public.worker_profiles
    where id = any(worker_ids)
      and (verification_status <> 'approved' or is_suspended)
  ) then
    raise exception 'Only approved, active workers can be featured.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);
  update public.worker_profiles
  set featured_rank = null
  where featured_rank is not null;

  if cardinality(worker_ids) > 0 then
    for rank_index in 1..cardinality(worker_ids) loop
      update public.worker_profiles
      set featured_rank = rank_index
      where id = worker_ids[rank_index];
    end loop;
  end if;
end;
$$;

revoke execute on function public.bc_add_admin_email_whitelist(text) from public;
revoke execute on function public.bc_remove_admin_email_whitelist(text) from public;
revoke execute on function public.bc_set_featured_workers(uuid[]) from public;
grant execute on function public.bc_add_admin_email_whitelist(text) to authenticated;
grant execute on function public.bc_remove_admin_email_whitelist(text) to authenticated;
grant execute on function public.bc_set_featured_workers(uuid[]) to authenticated;

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
  ) as extra_specialty_names,
  wp.featured_rank
from public.worker_profiles wp
left join public.categories c on c.id = wp.category_id
where wp.verification_status = 'approved'
  and wp.is_suspended = false;
