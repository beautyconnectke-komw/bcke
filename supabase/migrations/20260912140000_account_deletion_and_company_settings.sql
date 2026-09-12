create table if not exists public.company_settings (
  id integer primary key default 1,
  phone text,
  email text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_settings_singleton check (id = 1),
  constraint company_settings_phone_length check (
    phone is null or char_length(phone) <= 40
  ),
  constraint company_settings_email_format check (
    email is null or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

drop trigger if exists set_company_settings_updated_at
on public.company_settings;
create trigger set_company_settings_updated_at
before update on public.company_settings
for each row execute function public.set_updated_at();

insert into public.company_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.company_settings enable row level security;
revoke all on table public.company_settings from anon;
grant select on table public.company_settings to authenticated;

drop policy if exists "Authenticated users can view company contact"
on public.company_settings;
create policy "Authenticated users can view company contact"
on public.company_settings for select
to authenticated
using (auth.uid() is not null);

drop policy if exists "Admins can manage company contact"
on public.company_settings;
create policy "Admins can manage company contact"
on public.company_settings for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

alter table public.profiles
  add column if not exists account_deletion_requested_at timestamptz,
  add column if not exists account_deletion_scheduled_for timestamptz;

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  email text not null,
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz not null,
  status text not null default 'pending',
  cancelled_at timestamptz,
  completed_at timestamptz,
  constraint account_deletion_requests_status check (
    status in ('pending', 'cancelled', 'completed')
  )
);

create unique index if not exists account_deletion_requests_one_pending
on public.account_deletion_requests (profile_id)
where status = 'pending' and profile_id is not null;

create index if not exists account_deletion_requests_scheduled_idx
on public.account_deletion_requests (scheduled_for)
where status = 'pending';

alter table public.account_deletion_requests enable row level security;
revoke all on table public.account_deletion_requests from anon, authenticated;

create or replace function public.bc_update_company_settings(
  p_phone text default null,
  p_email text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_phone text := nullif(trim(p_phone), '');
  normalized_email text := nullif(lower(trim(p_email)), '');
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  if normalized_phone is not null and char_length(normalized_phone) > 40 then
    raise exception 'The company phone number must be 40 characters or fewer.';
  end if;

  if normalized_email is not null
    and normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  then
    raise exception 'Enter a valid company email address.';
  end if;

  insert into public.company_settings (id, phone, email, updated_by)
  values (1, normalized_phone, normalized_email, auth.uid())
  on conflict (id) do update
    set phone = excluded.phone,
        email = excluded.email,
        updated_by = excluded.updated_by;

  perform public.log_admin_activity(
    'company_contact_updated',
    'company_settings',
    null,
    jsonb_build_object('phone_configured', normalized_phone is not null,
                       'email_configured', normalized_email is not null)
  );
end;
$$;

create or replace function public.bc_request_account_deletion()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  existing_schedule timestamptz;
  next_schedule timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  perform 1
  from public.profiles
  where id = current_user_id
  for update;

  if not found then
    raise exception 'Your Beauty Connect profile could not be found.';
  end if;

  select email into current_email
  from auth.users
  where id = current_user_id;

  if current_email is null then
    raise exception 'Your account email could not be found.';
  end if;

  select scheduled_for into existing_schedule
  from public.account_deletion_requests
  where profile_id = current_user_id
    and status = 'pending'
    and scheduled_for > now()
  order by requested_at desc
  limit 1
  for update;

  if existing_schedule is not null then
    return existing_schedule;
  end if;

  next_schedule := now() + interval '30 days';

  insert into public.account_deletion_requests (
    profile_id,
    email,
    scheduled_for
  )
  values (current_user_id, lower(trim(current_email)), next_schedule);

  update public.profiles
  set account_deletion_requested_at = now(),
      account_deletion_scheduled_for = next_schedule
  where id = current_user_id;

  return next_schedule;
end;
$$;

create or replace function public.bc_cancel_account_deletion(
  p_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  update public.account_deletion_requests
  set status = 'cancelled',
      cancelled_at = now()
  where profile_id = p_profile_id
    and status = 'pending';

  update public.profiles
  set account_deletion_requested_at = null,
      account_deletion_scheduled_for = null
  where id = p_profile_id;

  perform public.log_admin_activity(
    'account_deletion_cancelled',
    'profiles',
    p_profile_id,
    '{}'::jsonb
  );
end;
$$;

revoke execute on function public.bc_update_company_settings(text, text) from public;
revoke execute on function public.bc_request_account_deletion() from public;
revoke execute on function public.bc_cancel_account_deletion(uuid) from public;
grant execute on function public.bc_update_company_settings(text, text) to authenticated;
grant execute on function public.bc_request_account_deletion() to authenticated;
grant execute on function public.bc_cancel_account_deletion(uuid) to authenticated;

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
join public.profiles owner_profile on owner_profile.id = wp.profile_id
left join public.categories c on c.id = wp.category_id
where wp.verification_status = 'approved'
  and wp.is_suspended = false
  and owner_profile.account_deletion_requested_at is null;

create or replace view public.public_employer_profiles as
select
  ep.id,
  ep.business_name,
  ep.description,
  ep.location,
  ep.address_line,
  ep.profile_image_path,
  ep.salon_info,
  ep.created_at,
  ep.updated_at
from public.employer_profiles ep
join public.profiles owner_profile on owner_profile.id = ep.profile_id
where ep.is_suspended = false
  and owner_profile.account_deletion_requested_at is null;

create or replace view public.public_worker_portfolio as
select
  portfolio.id,
  portfolio.worker_profile_id,
  portfolio.storage_bucket,
  portfolio.storage_path,
  portfolio.display_order,
  portfolio.alt_text,
  portfolio.created_at,
  portfolio.updated_at
from public.worker_portfolio portfolio
join public.worker_profiles worker on worker.id = portfolio.worker_profile_id
join public.profiles owner_profile on owner_profile.id = worker.profile_id
where worker.verification_status = 'approved'
  and worker.is_suspended = false
  and owner_profile.account_deletion_requested_at is null;
