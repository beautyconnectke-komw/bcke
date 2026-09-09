create extension if not exists "pgcrypto" with schema extensions;

create type public.profile_role as enum ('worker', 'employer', 'admin');
create type public.worker_verification_status as enum (
  'draft',
  'pending_review',
  'approved',
  'rejected'
);
create type public.worker_availability_status as enum ('available', 'considering', 'matched');
create type public.compensation_model as enum (
  'salary',
  'commission',
  'salary_plus_commission',
  'hourly',
  'negotiable'
);
create type public.employer_request_status as enum (
  'pending',
  'accepted',
  'considering',
  'declined',
  'cancelled',
  'expired'
);
create type public.handshake_status as enum ('matched', 'completed', 'cancelled');
create type public.notification_type as enum (
  'application_submitted',
  'application_approved',
  'application_rejected',
  'employer_request_received',
  'request_accepted',
  'request_considered',
  'request_declined',
  'handshake_completed'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.profile_role,
  display_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) <= 120
  )
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'::public.profile_role
  );
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

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

create trigger prevent_profile_role_escalation
before insert or update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_length check (char_length(name) between 2 and 120),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create table public.worker_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete restrict,
  full_name text not null,
  phone text,
  location text,
  county text,
  town text,
  profile_photo_path text,
  years_experience integer not null default 0,
  experience_months integer not null default 0,
  short_bio text,
  work_experience text,
  skills text[] not null default '{}',
  extra_specialty_ids uuid[] not null default '{}',
  compensation_model public.compensation_model not null default 'negotiable',
  salary_expectation numeric(12,2),
  commission_expectation numeric(5,2),
  verification_status public.worker_verification_status not null default 'draft',
  availability_status public.worker_availability_status not null default 'available',
  is_suspended boolean not null default false,
  public_visible boolean generated always as (
    verification_status = 'approved'::public.worker_verification_status and is_suspended = false
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_profiles_full_name_length check (char_length(full_name) between 2 and 160),
  constraint worker_profiles_years_experience_range check (years_experience between 0 and 80),
  constraint worker_profiles_experience_months_range check (experience_months between 0 and 11),
  constraint worker_profiles_county_length check (county is null or char_length(county) between 2 and 80),
  constraint worker_profiles_town_length check (town is null or char_length(town) between 2 and 120),
  constraint worker_profiles_short_bio_length check (
    short_bio is null or char_length(short_bio) <= 600
  ),
  constraint worker_profiles_work_experience_length check (
    work_experience is null or char_length(work_experience) <= 5000
  ),
  constraint worker_profiles_skills_limit check (cardinality(skills) <= 30),
  constraint worker_profiles_extra_specialties_limit check (cardinality(extra_specialty_ids) <= 12),
  constraint worker_profiles_salary_non_negative check (
    salary_expectation is null or salary_expectation >= 0
  ),
  constraint worker_profiles_commission_range check (
    commission_expectation is null or commission_expectation between 0 and 100
  )
);

create trigger set_worker_profiles_updated_at
before update on public.worker_profiles
for each row execute function public.set_updated_at();

create table public.worker_portfolio (
  id uuid primary key default gen_random_uuid(),
  worker_profile_id uuid not null references public.worker_profiles(id) on delete cascade,
  storage_bucket text not null default 'worker-portfolio-images',
  storage_path text not null,
  display_order integer not null,
  alt_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_portfolio_order_range check (display_order between 1 and 4),
  constraint worker_portfolio_alt_text_length check (
    alt_text is null or char_length(alt_text) <= 180
  ),
  constraint worker_portfolio_bucket check (storage_bucket = 'worker-portfolio-images'),
  unique (worker_profile_id, display_order),
  unique (storage_bucket, storage_path)
);

create trigger set_worker_portfolio_updated_at
before update on public.worker_portfolio
for each row execute function public.set_updated_at();

create or replace function public.enforce_worker_portfolio_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.worker_portfolio
    where worker_profile_id = new.worker_profile_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) >= 4 then
    raise exception 'Workers can have a maximum of four portfolio images.';
  end if;

  return new;
end;
$$;

create trigger enforce_worker_portfolio_limit
before insert or update on public.worker_portfolio
for each row execute function public.enforce_worker_portfolio_limit();

create table public.employer_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text not null,
  contact_person text,
  phone text,
  business_email text,
  description text,
  location text,
  address_line text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  profile_image_path text,
  salon_info jsonb not null default '{}'::jsonb,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employer_profiles_business_name_length check (char_length(business_name) between 2 and 160),
  constraint employer_profiles_description_length check (
    description is null or char_length(description) <= 1200
  ),
  constraint employer_profiles_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint employer_profiles_longitude_range check (longitude is null or longitude between -180 and 180)
);

create trigger set_employer_profiles_updated_at
before update on public.employer_profiles
for each row execute function public.set_updated_at();

create table public.employer_requests (
  id uuid primary key default gen_random_uuid(),
  employer_profile_id uuid not null references public.employer_profiles(id) on delete cascade,
  worker_profile_id uuid not null references public.worker_profiles(id) on delete cascade,
  status public.employer_request_status not null default 'pending',
  message text,
  responded_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employer_requests_message_length check (
    message is null or char_length(message) <= 2000
  )
);

create trigger set_employer_requests_updated_at
before update on public.employer_requests
for each row execute function public.set_updated_at();

create unique index employer_requests_one_active_pair
on public.employer_requests (employer_profile_id, worker_profile_id)
where status in ('pending', 'accepted', 'considering');

create table public.handshakes (
  id uuid primary key default gen_random_uuid(),
  employer_profile_id uuid not null references public.employer_profiles(id) on delete cascade,
  worker_profile_id uuid not null references public.worker_profiles(id) on delete cascade,
  request_id uuid unique references public.employer_requests(id) on delete set null,
  status public.handshake_status not null default 'matched',
  matched_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_handshakes_updated_at
before update on public.handshakes
for each row execute function public.set_updated_at();

create unique index handshakes_one_active_worker_match
on public.handshakes (worker_profile_id)
where status = 'matched';

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_title_length check (char_length(title) between 2 and 160),
  constraint notifications_body_length check (body is null or char_length(body) <= 1000)
);

create table public.admin_activity (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_activity_action_format check (action ~ '^[a-z0-9_]+$'),
  constraint admin_activity_target_table_format check (target_table ~ '^[a-z0-9_]+$')
);

create index profiles_role_idx on public.profiles (role);
create index categories_active_order_idx on public.categories (is_active, display_order, name);
create index worker_profiles_category_idx on public.worker_profiles (category_id);
create index worker_profiles_experience_idx on public.worker_profiles (years_experience);
create index worker_profiles_verification_idx on public.worker_profiles (verification_status);
create index worker_profiles_availability_idx on public.worker_profiles (availability_status);
create index worker_profiles_marketplace_idx
on public.worker_profiles (verification_status, availability_status, category_id)
where is_suspended = false;
create index employer_profiles_profile_idx on public.employer_profiles (profile_id);
create index employer_requests_employer_status_idx
on public.employer_requests (employer_profile_id, status, created_at desc);
create index employer_requests_worker_status_idx
on public.employer_requests (worker_profile_id, status, created_at desc);
create index handshakes_employer_idx on public.handshakes (employer_profile_id, status);
create index handshakes_worker_idx on public.handshakes (worker_profile_id, status);
create index notifications_profile_created_idx
on public.notifications (profile_id, created_at desc);
create index notifications_unread_idx
on public.notifications (profile_id, created_at desc)
where read_at is null;
create index admin_activity_created_idx on public.admin_activity (created_at desc);

create or replace function public.enforce_profile_role(table_profile_id uuid, expected_role public.profile_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = table_profile_id
      and role = expected_role
  ) then
    raise exception 'Profile does not have required role: %', expected_role;
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

create trigger enforce_worker_profile_rules
before insert or update on public.worker_profiles
for each row execute function public.enforce_worker_profile_rules();

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

create trigger enforce_employer_profile_rules
before insert or update on public.employer_profiles
for each row execute function public.enforce_employer_profile_rules();

create or replace function public.enforce_notification_update_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and not public.is_admin(auth.uid())
    and not public.is_service_role()
    and (
      new.profile_id is distinct from old.profile_id
      or new.type is distinct from old.type
      or new.title is distinct from old.title
      or new.body is distinct from old.body
      or new.data is distinct from old.data
      or new.created_at is distinct from old.created_at
    )
  then
    raise exception 'Users can only update notification read state.';
  end if;

  return new;
end;
$$;

create trigger enforce_notification_update_rules
before update on public.notifications
for each row execute function public.enforce_notification_update_rules();

create or replace function public.enforce_employer_request_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  employer_owner uuid;
  worker_owner uuid;
  worker_status public.worker_verification_status;
  worker_availability public.worker_availability_status;
  worker_suspended boolean;
  employer_suspended boolean;
begin
  select profile_id, is_suspended
  into employer_owner, employer_suspended
  from public.employer_profiles
  where id = new.employer_profile_id;

  select profile_id, verification_status, availability_status, is_suspended
  into worker_owner, worker_status, worker_availability, worker_suspended
  from public.worker_profiles
  where id = new.worker_profile_id;

  if employer_owner is null or worker_owner is null then
    raise exception 'Employer and worker must both exist.';
  end if;

  if employer_owner = worker_owner then
    raise exception 'A user cannot request themselves.';
  end if;

  if employer_suspended then
    raise exception 'Suspended employers cannot create requests.';
  end if;

  if worker_status <> 'approved' or worker_suspended then
    raise exception 'Only approved workers can receive employer requests.';
  end if;

  if worker_availability = 'matched' then
    raise exception 'Matched workers cannot receive new employer requests.';
  end if;

  if tg_op = 'INSERT' and new.status <> 'pending' then
    raise exception 'New employer requests must start as pending.';
  end if;

  return new;
end;
$$;

create trigger enforce_employer_request_rules
before insert on public.employer_requests
for each row execute function public.enforce_employer_request_rules();

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

create or replace view public.public_employer_profiles as
select
  ep.id,
  ep.business_name,
  ep.description,
  ep.location,
  ep.profile_image_path,
  ep.created_at,
  ep.updated_at
from public.employer_profiles ep
where ep.is_suspended = false;

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
where worker.verification_status = 'approved'
  and worker.is_suspended = false;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.worker_portfolio enable row level security;
alter table public.employer_profiles enable row level security;
alter table public.employer_requests enable row level security;
alter table public.handshakes enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_activity enable row level security;

create policy "Profiles are visible to owner and admins"
on public.profiles for select
using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "Users can create their own non-admin profile"
on public.profiles for insert
with check (id = auth.uid() and (role is null or role <> 'admin'));

create policy "Users can update their own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Admins can manage profiles"
on public.profiles for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Active categories are publicly readable"
on public.categories for select
using (is_active = true);

create policy "Admins can manage categories"
on public.categories for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Workers can view their own worker profile"
on public.worker_profiles for select
using (profile_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Workers can create their own draft worker profile"
on public.worker_profiles for insert
with check (
  profile_id = auth.uid()
  and verification_status = 'draft'
  and availability_status = 'available'
  and is_suspended = false
);

create policy "Workers can update their own worker profile"
on public.worker_profiles for update
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Admins can manage worker profiles"
on public.worker_profiles for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Approved worker portfolio is publicly readable"
on public.worker_portfolio for select
using (
  exists (
    select 1
    from public.worker_profiles worker
    where worker.id = worker_portfolio.worker_profile_id
      and worker.verification_status = 'approved'
      and worker.is_suspended = false
  )
);

create policy "Workers can manage their own portfolio"
on public.worker_portfolio for all
using (
  exists (
    select 1
    from public.worker_profiles worker
    where worker.id = worker_portfolio.worker_profile_id
      and worker.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.worker_profiles worker
    where worker.id = worker_portfolio.worker_profile_id
      and worker.profile_id = auth.uid()
  )
);

create policy "Admins can manage worker portfolio"
on public.worker_portfolio for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Employers can view their own profile and admins can view all"
on public.employer_profiles for select
using (profile_id = auth.uid() or public.is_admin(auth.uid()));

create or replace function public.worker_can_view_employer_profile(
  target_employer_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.employer_requests request
    join public.worker_profiles worker on worker.id = request.worker_profile_id
    where request.employer_profile_id = target_employer_profile_id
      and worker.profile_id = auth.uid()
  );
$$;

revoke execute on function public.worker_can_view_employer_profile(uuid) from public;
grant execute on function public.worker_can_view_employer_profile(uuid) to authenticated;

create policy "Workers can view employers that requested them"
on public.employer_profiles for select
using (public.worker_can_view_employer_profile(id));

create policy "Employers can create their own employer profile"
on public.employer_profiles for insert
with check (profile_id = auth.uid() and is_suspended = false);

create policy "Employers can update their own employer profile"
on public.employer_profiles for update
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Admins can manage employer profiles"
on public.employer_profiles for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Employers and target workers can view requests"
on public.employer_requests for select
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.employer_profiles employer
    where employer.id = employer_requests.employer_profile_id
      and employer.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.worker_profiles worker
    where worker.id = employer_requests.worker_profile_id
      and worker.profile_id = auth.uid()
  )
);

create policy "Employers can create requests they own"
on public.employer_requests for insert
with check (
  exists (
    select 1
    from public.employer_profiles employer
    where employer.id = employer_requests.employer_profile_id
      and employer.profile_id = auth.uid()
      and employer.is_suspended = false
  )
);

create policy "Admins can manage requests"
on public.employer_requests for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Participants and admins can view handshakes"
on public.handshakes for select
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.employer_profiles employer
    where employer.id = handshakes.employer_profile_id
      and employer.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.worker_profiles worker
    where worker.id = handshakes.worker_profile_id
      and worker.profile_id = auth.uid()
  )
);

create policy "Admins can manage handshakes"
on public.handshakes for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Users can view their own notifications"
on public.notifications for select
using (profile_id = auth.uid() or public.is_admin(auth.uid()));

create policy "Users can update their own notifications"
on public.notifications for update
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Admins can manage notifications"
on public.notifications for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admins can view audit activity"
on public.admin_activity for select
using (public.is_admin(auth.uid()));

create policy "Admins can create audit activity"
on public.admin_activity for insert
with check (public.is_admin(auth.uid()));

grant select on public.public_worker_profiles to anon, authenticated;
grant select on public.public_worker_portfolio to anon, authenticated;

insert into storage.buckets (id, name, public)
values
  ('worker-profile-images', 'worker-profile-images', true),
  ('worker-portfolio-images', 'worker-portfolio-images', true),
  ('employer-images', 'employer-images', true),
  ('verification-documents', 'verification-documents', false)
on conflict (id) do nothing;

create policy "Public marketplace images are readable"
on storage.objects for select
using (bucket_id in ('worker-profile-images', 'worker-portfolio-images', 'employer-images'));

create policy "Users can upload public images in their own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('worker-profile-images', 'worker-portfolio-images', 'employer-images')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update public images in their own folder"
on storage.objects for update
to authenticated
using (
  bucket_id in ('worker-profile-images', 'worker-portfolio-images', 'employer-images')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('worker-profile-images', 'worker-portfolio-images', 'employer-images')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete public images in their own folder"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('worker-profile-images', 'worker-portfolio-images', 'employer-images')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can manage private verification documents in their own folder"
on storage.objects for all
to authenticated
using (
  bucket_id = 'verification-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'verification-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Admins can view verification documents"
on storage.objects for select
to authenticated
using (bucket_id = 'verification-documents' and public.is_admin(auth.uid()));

create or replace function public.log_admin_activity(
  action text,
  target_table text,
  target_id uuid,
  metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_activity (actor_profile_id, action, target_table, target_id, metadata)
  values (auth.uid(), action, target_table, target_id, metadata);
end;
$$;

create or replace function public.create_notification(
  profile_id uuid,
  notification_type public.notification_type,
  title text,
  body text default null,
  data jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid;
begin
  insert into public.notifications (profile_id, type, title, body, data)
  values (profile_id, notification_type, title, body, data)
  returning id into notification_id;

  return notification_id;
end;
$$;

create or replace function public.bc_create_worker_application(
  p_full_name text,
  p_phone text default null,
  p_location text default null,
  p_category_id uuid default null,
  p_profile_photo_path text default null,
  p_years_experience integer default 0,
  p_short_bio text default null,
  p_work_experience text default null,
  p_skills text[] default '{}',
  p_compensation_model public.compensation_model default 'negotiable',
  p_salary_expectation numeric default null,
  p_commission_expectation numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_role public.profile_role;
  worker_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select role into existing_role
  from public.profiles
  where id = current_user_id;

  if existing_role is not null and existing_role <> 'worker' then
    raise exception 'This account is already registered as %.', existing_role;
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);

  insert into public.profiles (id, role, display_name, phone)
  values (current_user_id, 'worker', p_full_name, p_phone)
  on conflict (id) do update
    set display_name = excluded.display_name,
        phone = excluded.phone;

  insert into public.worker_profiles (
    profile_id,
    full_name,
    phone,
    location,
    category_id,
    profile_photo_path,
    years_experience,
    short_bio,
    work_experience,
    skills,
    compensation_model,
    salary_expectation,
    commission_expectation,
    verification_status,
    availability_status
  )
  values (
    current_user_id,
    p_full_name,
    p_phone,
    p_location,
    p_category_id,
    p_profile_photo_path,
    p_years_experience,
    p_short_bio,
    p_work_experience,
    coalesce(p_skills, '{}'),
    p_compensation_model,
    p_salary_expectation,
    p_commission_expectation,
    'pending_review',
    'available'
  )
  on conflict (profile_id) do update
    set full_name = excluded.full_name,
        phone = excluded.phone,
        location = excluded.location,
        category_id = excluded.category_id,
        profile_photo_path = excluded.profile_photo_path,
        years_experience = excluded.years_experience,
        short_bio = excluded.short_bio,
        work_experience = excluded.work_experience,
        skills = excluded.skills,
        compensation_model = excluded.compensation_model,
        salary_expectation = excluded.salary_expectation,
        commission_expectation = excluded.commission_expectation,
        verification_status = case
          when public.worker_profiles.verification_status in ('draft', 'rejected')
          then 'pending_review'::public.worker_verification_status
          else public.worker_profiles.verification_status
        end
  returning id into worker_id;

  perform public.create_notification(
    current_user_id,
    'application_submitted',
    'Application submitted',
    'Your worker application has been submitted for review.',
    jsonb_build_object('worker_profile_id', worker_id)
  );

  return worker_id;
end;
$$;

create or replace function public.bc_create_employer_profile(
  p_business_name text,
  p_contact_person text default null,
  p_phone text default null,
  p_business_email text default null,
  p_description text default null,
  p_location text default null,
  p_address_line text default null,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_profile_image_path text default null,
  p_salon_info jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_role public.profile_role;
  employer_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select role into existing_role
  from public.profiles
  where id = current_user_id;

  if existing_role is not null and existing_role <> 'employer' then
    raise exception 'This account is already registered as %.', existing_role;
  end if;

  insert into public.profiles (id, role, display_name, phone)
  values (current_user_id, 'employer', p_business_name, p_phone)
  on conflict (id) do update
    set display_name = excluded.display_name,
        phone = excluded.phone;

  insert into public.employer_profiles (
    profile_id,
    business_name,
    contact_person,
    phone,
    business_email,
    description,
    location,
    address_line,
    latitude,
    longitude,
    profile_image_path,
    salon_info
  )
  values (
    current_user_id,
    p_business_name,
    p_contact_person,
    p_phone,
    p_business_email,
    p_description,
    p_location,
    p_address_line,
    p_latitude,
    p_longitude,
    p_profile_image_path,
    coalesce(p_salon_info, '{}'::jsonb)
  )
  on conflict (profile_id) do update
    set business_name = excluded.business_name,
        contact_person = excluded.contact_person,
        phone = excluded.phone,
        business_email = excluded.business_email,
        description = excluded.description,
        location = excluded.location,
        address_line = excluded.address_line,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        profile_image_path = excluded.profile_image_path,
        salon_info = excluded.salon_info
  returning id into employer_id;

  return employer_id;
end;
$$;

create or replace function public.bc_approve_worker(p_worker_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  worker_owner uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);

  update public.worker_profiles
  set verification_status = 'approved',
      availability_status = 'available',
      is_suspended = false
  where id = p_worker_profile_id
  returning profile_id into worker_owner;

  if worker_owner is null then
    raise exception 'Worker profile not found.';
  end if;

  perform public.create_notification(
    worker_owner,
    'application_approved',
    'Application approved',
    'Your Beauty Connect worker profile has been approved.',
    jsonb_build_object('worker_profile_id', p_worker_profile_id)
  );

  perform public.log_admin_activity(
    'worker_approved',
    'worker_profiles',
    p_worker_profile_id,
    '{}'::jsonb
  );
end;
$$;

create or replace function public.bc_reject_worker(p_worker_profile_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  worker_owner uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);

  update public.worker_profiles
  set verification_status = 'rejected',
      availability_status = 'available'
  where id = p_worker_profile_id
  returning profile_id into worker_owner;

  if worker_owner is null then
    raise exception 'Worker profile not found.';
  end if;

  perform public.create_notification(
    worker_owner,
    'application_rejected',
    'Application rejected',
    'Your Beauty Connect worker application was not approved.',
    jsonb_build_object('worker_profile_id', p_worker_profile_id)
  );

  perform public.log_admin_activity(
    'worker_rejected',
    'worker_profiles',
    p_worker_profile_id,
    jsonb_build_object('reason', p_reason)
  );
end;
$$;

create or replace function public.bc_suspend_worker(p_worker_profile_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);

  update public.worker_profiles
  set is_suspended = true,
      availability_status = case
        when availability_status = 'matched' then availability_status
        else 'available'::public.worker_availability_status
      end
  where id = p_worker_profile_id;

  if not found then
    raise exception 'Worker profile not found.';
  end if;

  perform public.log_admin_activity(
    'worker_suspended',
    'worker_profiles',
    p_worker_profile_id,
    jsonb_build_object('reason', p_reason)
  );
end;
$$;

create or replace function public.bc_restore_worker(p_worker_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);

  update public.worker_profiles
  set is_suspended = false
  where id = p_worker_profile_id;

  if not found then
    raise exception 'Worker profile not found.';
  end if;

  perform public.log_admin_activity(
    'worker_restored',
    'worker_profiles',
    p_worker_profile_id,
    '{}'::jsonb
  );
end;
$$;

create or replace function public.bc_suspend_employer(p_employer_profile_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);

  update public.employer_profiles
  set is_suspended = true
  where id = p_employer_profile_id;

  if not found then
    raise exception 'Employer profile not found.';
  end if;

  update public.employer_requests
  set status = 'cancelled'
  where employer_profile_id = p_employer_profile_id
    and status in ('pending', 'considering');

  perform public.log_admin_activity(
    'employer_suspended',
    'employer_profiles',
    p_employer_profile_id,
    jsonb_build_object('reason', p_reason)
  );
end;
$$;

create or replace function public.bc_restore_employer(p_employer_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);

  update public.employer_profiles
  set is_suspended = false
  where id = p_employer_profile_id;

  if not found then
    raise exception 'Employer profile not found.';
  end if;

  perform public.log_admin_activity(
    'employer_restored',
    'employer_profiles',
    p_employer_profile_id,
    '{}'::jsonb
  );
end;
$$;

create or replace function public.bc_request_worker(p_worker_profile_id uuid, p_message text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  employer_id uuid;
  worker_owner uuid;
  request_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select id into employer_id
  from public.employer_profiles
  where profile_id = current_user_id
    and is_suspended = false;

  if employer_id is null then
    raise exception 'An active employer profile is required.';
  end if;

  select profile_id into worker_owner
  from public.worker_profiles
  where id = p_worker_profile_id
    and verification_status = 'approved'
    and availability_status <> 'matched'
    and is_suspended = false
  for update;

  if worker_owner is null then
    raise exception 'Worker is not available for requests.';
  end if;

  if worker_owner = current_user_id then
    raise exception 'A user cannot request themselves.';
  end if;

  insert into public.employer_requests (employer_profile_id, worker_profile_id, message)
  values (employer_id, p_worker_profile_id, p_message)
  returning id into request_id;

  perform public.create_notification(
    worker_owner,
    'employer_request_received',
    'New employer request',
    'A salon is interested in your worker profile.',
    jsonb_build_object('request_id', request_id)
  );

  return request_id;
end;
$$;

create or replace function public.bc_respond_to_worker_request(
  p_request_id uuid,
  p_response public.employer_request_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  request_record public.employer_requests%rowtype;
  worker_record public.worker_profiles%rowtype;
  employer_owner uuid;
  handshake_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_response not in ('accepted', 'considering', 'declined') then
    raise exception 'Invalid worker response.';
  end if;

  select * into request_record
  from public.employer_requests
  where id = p_request_id
  for update;

  if request_record.id is null then
    raise exception 'Employer request not found.';
  end if;

  select * into worker_record
  from public.worker_profiles
  where id = request_record.worker_profile_id
  for update;

  if worker_record.profile_id <> current_user_id then
    raise exception 'Only the requested worker can respond to this request.';
  end if;

  if worker_record.verification_status <> 'approved' or worker_record.is_suspended then
    raise exception 'Only approved workers can respond to requests.';
  end if;

  if request_record.status not in ('pending', 'considering') then
    raise exception 'This request can no longer be responded to.';
  end if;

  select profile_id into employer_owner
  from public.employer_profiles
  where id = request_record.employer_profile_id;

  perform set_config('app.beauty_connect_internal', 'on', true);

  if p_response = 'declined' then
    update public.employer_requests
    set status = 'declined',
        responded_at = now()
    where id = p_request_id;

    if not exists (
      select 1
      from public.employer_requests
      where worker_profile_id = request_record.worker_profile_id
        and status = 'considering'
        and id <> p_request_id
    ) and worker_record.availability_status <> 'matched' then
      update public.worker_profiles
      set availability_status = 'available'
      where id = request_record.worker_profile_id;
    end if;

    perform public.create_notification(
      employer_owner,
      'request_declined',
      'Worker declined request',
      'A worker declined your request.',
      jsonb_build_object('request_id', p_request_id)
    );

    return null;
  end if;

  if p_response = 'considering' then
    if worker_record.availability_status = 'matched' then
      raise exception 'Matched workers cannot consider new requests.';
    end if;

    update public.employer_requests
    set status = 'considering',
        responded_at = now()
    where id = p_request_id;

    update public.worker_profiles
    set availability_status = 'considering'
    where id = request_record.worker_profile_id;

    perform public.create_notification(
      employer_owner,
      'request_considered',
      'Worker is considering',
      'A worker is considering your request.',
      jsonb_build_object('request_id', p_request_id)
    );

    return null;
  end if;

  if worker_record.availability_status = 'matched' then
    raise exception 'Worker is already matched.';
  end if;

  insert into public.handshakes (employer_profile_id, worker_profile_id, request_id, status)
  values (request_record.employer_profile_id, request_record.worker_profile_id, p_request_id, 'matched')
  returning id into handshake_id;

  update public.employer_requests
  set status = 'accepted',
      responded_at = now()
  where id = p_request_id;

  update public.employer_requests
  set status = 'expired'
  where worker_profile_id = request_record.worker_profile_id
    and id <> p_request_id
    and status in ('pending', 'considering');

  update public.worker_profiles
  set availability_status = 'matched'
  where id = request_record.worker_profile_id;

  perform public.create_notification(
    employer_owner,
    'request_accepted',
    'Worker accepted request',
    'A worker accepted your request.',
    jsonb_build_object('request_id', p_request_id, 'handshake_id', handshake_id)
  );

  perform public.create_notification(
    current_user_id,
    'handshake_completed',
    'Handshake completed',
    'You have matched with a salon.',
    jsonb_build_object('request_id', p_request_id, 'handshake_id', handshake_id)
  );

  perform public.create_notification(
    employer_owner,
    'handshake_completed',
    'Handshake completed',
    'You have matched with a worker.',
    jsonb_build_object('request_id', p_request_id, 'handshake_id', handshake_id)
  );

  return handshake_id;
end;
$$;

create or replace function public.bc_complete_handshake(p_request_id uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.bc_respond_to_worker_request(
    p_request_id,
    'accepted'::public.employer_request_status
  );
$$;

create or replace function public.bc_update_worker_availability(
  p_availability public.worker_availability_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_availability = 'matched' then
    raise exception 'Matched status is reserved for a completed handshake.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);
  update public.worker_profiles
  set availability_status = p_availability
  where profile_id = current_user_id
    and verification_status = 'approved'
    and is_suspended = false;

  if not found then
    raise exception 'Only an active approved worker can update availability.';
  end if;
end;
$$;

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
    where profile_id = current_user_id
      and verification_status = 'pending_review'
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
  where id = current_user_id
    and (role is null or role = p_role);

  if not found then
    raise exception 'This account already has a different role.';
  end if;
end;
$$;

revoke execute on function public.log_admin_activity(text, text, uuid, jsonb) from public;
revoke execute on function public.create_notification(uuid, public.notification_type, text, text, jsonb) from public;
revoke execute on function public.bc_create_worker_application(
  text, text, text, uuid, text, integer, text, text, text[], public.compensation_model, numeric, numeric
) from public;
revoke execute on function public.bc_create_employer_profile(
  text, text, text, text, text, text, text, numeric, numeric, text, jsonb
) from public;
revoke execute on function public.bc_approve_worker(uuid) from public;
revoke execute on function public.bc_reject_worker(uuid, text) from public;
revoke execute on function public.bc_suspend_worker(uuid, text) from public;
revoke execute on function public.bc_restore_worker(uuid) from public;
revoke execute on function public.bc_suspend_employer(uuid, text) from public;
revoke execute on function public.bc_restore_employer(uuid) from public;
revoke execute on function public.bc_request_worker(uuid, text) from public;
revoke execute on function public.bc_respond_to_worker_request(uuid, public.employer_request_status) from public;
revoke execute on function public.bc_complete_handshake(uuid) from public;
revoke execute on function public.bc_update_worker_availability(public.worker_availability_status) from public;
revoke execute on function public.bc_finalize_profile_role(public.profile_role) from public;

grant execute on function public.bc_create_worker_application(
  text, text, text, uuid, text, integer, text, text, text[], public.compensation_model, numeric, numeric
) to authenticated;
grant execute on function public.bc_create_employer_profile(
  text, text, text, text, text, text, text, numeric, numeric, text, jsonb
) to authenticated;
grant execute on function public.bc_approve_worker(uuid) to authenticated;
grant execute on function public.bc_reject_worker(uuid, text) to authenticated;
grant execute on function public.bc_suspend_worker(uuid, text) to authenticated;
grant execute on function public.bc_restore_worker(uuid) to authenticated;
grant execute on function public.bc_suspend_employer(uuid, text) to authenticated;
grant execute on function public.bc_restore_employer(uuid) to authenticated;
grant execute on function public.bc_request_worker(uuid, text) to authenticated;
grant execute on function public.bc_respond_to_worker_request(uuid, public.employer_request_status) to authenticated;
grant execute on function public.bc_complete_handshake(uuid) to authenticated;
grant execute on function public.bc_update_worker_availability(public.worker_availability_status) to authenticated;
grant execute on function public.bc_finalize_profile_role(public.profile_role) to authenticated;
