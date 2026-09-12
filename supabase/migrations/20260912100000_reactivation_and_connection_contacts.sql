create type public.reactivation_request_status as enum (
  'pending',
  'approved',
  'declined'
);

create table public.worker_reactivation_requests (
  id uuid primary key default gen_random_uuid(),
  worker_profile_id uuid not null references public.worker_profiles(id) on delete cascade,
  reason text,
  status public.reactivation_request_status not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_reactivation_requests_reason_length check (
    reason is null or char_length(reason) <= 1000
  )
);

create trigger set_worker_reactivation_requests_updated_at
before update on public.worker_reactivation_requests
for each row execute function public.set_updated_at();

create unique index worker_reactivation_requests_one_pending
on public.worker_reactivation_requests (worker_profile_id)
where status = 'pending';

create index worker_reactivation_requests_status_idx
on public.worker_reactivation_requests (status, created_at desc);

alter table public.worker_reactivation_requests enable row level security;

create policy "Workers can view their own reactivation requests"
on public.worker_reactivation_requests for select
using (
  exists (
    select 1
    from public.worker_profiles worker
    where worker.id = worker_reactivation_requests.worker_profile_id
      and worker.profile_id = auth.uid()
  )
);

create policy "Workers can create their own reactivation requests"
on public.worker_reactivation_requests for insert
with check (
  status = 'pending'
  and exists (
    select 1
    from public.worker_profiles worker
    where worker.id = worker_reactivation_requests.worker_profile_id
      and worker.profile_id = auth.uid()
      and worker.verification_status = 'approved'
      and worker.availability_status = 'matched'
      and worker.is_suspended = false
  )
);

create policy "Admins can manage reactivation requests"
on public.worker_reactivation_requests for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- The public employer profile is intentionally limited to non-contact details.
-- Direct contact fields are read from employer_profiles only after a handshake.
drop view if exists public.public_employer_profiles;
create view public.public_employer_profiles as
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
where ep.is_suspended = false;

grant select on public.public_employer_profiles to anon, authenticated;

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
    from public.handshakes handshake
    join public.worker_profiles worker
      on worker.id = handshake.worker_profile_id
    where handshake.employer_profile_id = target_employer_profile_id
      and handshake.status in ('matched', 'completed')
      and worker.profile_id = auth.uid()
  );
$$;

revoke execute on function public.worker_can_view_employer_profile(uuid) from public;
revoke execute on function public.worker_can_view_employer_profile(uuid) from anon;
grant execute on function public.worker_can_view_employer_profile(uuid) to authenticated;

create or replace function public.employer_can_view_worker_profile(
  target_worker_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.handshakes handshake
    join public.employer_profiles employer
      on employer.id = handshake.employer_profile_id
    where handshake.worker_profile_id = target_worker_profile_id
      and handshake.status in ('matched', 'completed')
      and employer.profile_id = auth.uid()
  );
$$;

revoke execute on function public.employer_can_view_worker_profile(uuid) from public;
revoke execute on function public.employer_can_view_worker_profile(uuid) from anon;
grant execute on function public.employer_can_view_worker_profile(uuid) to authenticated;

create policy "Connected employers can view worker profiles"
on public.worker_profiles for select
using (public.employer_can_view_worker_profile(id));

create or replace function public.bc_request_worker_reactivation(
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  worker_id uuid;
  request_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select id
  into worker_id
  from public.worker_profiles
  where profile_id = current_user_id
    and verification_status = 'approved'
    and availability_status = 'matched'
    and is_suspended = false
  for update;

  if worker_id is null then
    raise exception 'Only an approved matched worker can request reactivation.';
  end if;

  insert into public.worker_reactivation_requests (worker_profile_id, reason)
  values (worker_id, nullif(trim(p_reason), ''))
  returning id into request_id;

  return request_id;
end;
$$;

create or replace function public.bc_approve_worker_reactivation(
  p_request_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_record public.worker_reactivation_requests%rowtype;
  worker_owner uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  select *
  into request_record
  from public.worker_reactivation_requests
  where id = p_request_id
  for update;

  if request_record.id is null then
    raise exception 'Reactivation request not found.';
  end if;

  if request_record.status <> 'pending' then
    raise exception 'This reactivation request has already been reviewed.';
  end if;

  select profile_id
  into worker_owner
  from public.worker_profiles
  where id = request_record.worker_profile_id
  for update;

  if worker_owner is null then
    raise exception 'Worker profile not found.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);

  update public.worker_reactivation_requests
  set status = 'approved',
      reviewed_at = now()
  where id = p_request_id;

  -- A reactivation starts a fresh marketplace lifecycle even if legacy active
  -- requests exist from before the worker's previous connection.
  update public.employer_requests
  set status = 'expired',
      responded_at = coalesce(responded_at, now())
  where worker_profile_id = request_record.worker_profile_id
    and status in ('pending', 'considering');

  update public.worker_profiles
  set availability_status = 'available'
  where id = request_record.worker_profile_id
    and verification_status = 'approved'
    and is_suspended = false;

  if not found then
    raise exception 'Worker is no longer eligible for reactivation.';
  end if;

  perform public.log_admin_activity(
    'worker_reactivation_approved',
    'worker_reactivation_requests',
    p_request_id,
    jsonb_build_object('worker_profile_id', request_record.worker_profile_id)
  );
end;
$$;

create or replace function public.bc_decline_worker_reactivation(
  p_request_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_record public.worker_reactivation_requests%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  select *
  into request_record
  from public.worker_reactivation_requests
  where id = p_request_id
  for update;

  if request_record.id is null then
    raise exception 'Reactivation request not found.';
  end if;

  if request_record.status <> 'pending' then
    raise exception 'This reactivation request has already been reviewed.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);

  update public.worker_reactivation_requests
  set status = 'declined',
      reviewed_at = now(),
      reason = coalesce(nullif(trim(p_reason), ''), reason)
  where id = p_request_id;

  perform public.log_admin_activity(
    'worker_reactivation_declined',
    'worker_reactivation_requests',
    p_request_id,
    jsonb_build_object('worker_profile_id', request_record.worker_profile_id)
  );
end;
$$;

revoke execute on function public.bc_request_worker_reactivation(text) from public;
revoke execute on function public.bc_approve_worker_reactivation(uuid) from public;
revoke execute on function public.bc_decline_worker_reactivation(uuid, text) from public;
revoke execute on function public.bc_request_worker_reactivation(text) from anon;
revoke execute on function public.bc_approve_worker_reactivation(uuid) from anon;
revoke execute on function public.bc_decline_worker_reactivation(uuid, text) from anon;
grant execute on function public.bc_request_worker_reactivation(text) to authenticated;
grant execute on function public.bc_approve_worker_reactivation(uuid) to authenticated;
grant execute on function public.bc_decline_worker_reactivation(uuid, text) to authenticated;
