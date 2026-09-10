create table if not exists public.worker_profile_views (
  id uuid primary key default gen_random_uuid(),
  worker_profile_id uuid not null references public.worker_profiles(id) on delete cascade,
  employer_profile_id uuid not null references public.employer_profiles(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists worker_profile_views_worker_viewed_idx
on public.worker_profile_views (worker_profile_id, viewed_at desc);

create table if not exists public.worker_profile_view_cooldowns (
  worker_profile_id uuid not null references public.worker_profiles(id) on delete cascade,
  employer_profile_id uuid not null references public.employer_profiles(id) on delete cascade,
  last_viewed_at timestamptz not null,
  primary key (worker_profile_id, employer_profile_id)
);

alter table public.worker_profile_views enable row level security;
alter table public.worker_profile_view_cooldowns enable row level security;

drop policy if exists "Workers can view their own profile analytics"
  on public.worker_profile_views;
create policy "Workers can view their own profile analytics"
on public.worker_profile_views for select
using (
  exists (
    select 1
    from public.worker_profiles worker
    where worker.id = worker_profile_views.worker_profile_id
      and worker.profile_id = auth.uid()
  )
);

drop policy if exists "Admins can view profile analytics"
  on public.worker_profile_views;
create policy "Admins can view profile analytics"
on public.worker_profile_views for select
using (public.is_admin(auth.uid()));

create or replace function public.bc_record_worker_profile_view(
  p_worker_profile_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  employer_id uuid;
  worker_owner_id uuid;
  previous_viewed_at timestamptz;
  current_time timestamptz := now();
begin
  if current_user_id is null then
    return false;
  end if;

  select employer.id
  into employer_id
  from public.employer_profiles employer
  where employer.profile_id = current_user_id
    and employer.is_suspended = false;

  if employer_id is null then
    return false;
  end if;

  select worker.profile_id
  into worker_owner_id
  from public.worker_profiles worker
  where worker.id = p_worker_profile_id
    and worker.verification_status = 'approved'
    and worker.is_suspended = false;

  if worker_owner_id is null or worker_owner_id = current_user_id then
    return false;
  end if;

  insert into public.worker_profile_view_cooldowns (
    worker_profile_id,
    employer_profile_id,
    last_viewed_at
  ) values (
    p_worker_profile_id,
    employer_id,
    current_time - interval '24 hours'
  )
  on conflict (worker_profile_id, employer_profile_id) do nothing;

  select cooldown.last_viewed_at
  into previous_viewed_at
  from public.worker_profile_view_cooldowns cooldown
  where cooldown.worker_profile_id = p_worker_profile_id
    and cooldown.employer_profile_id = employer_id
  for update;

  if previous_viewed_at > current_time - interval '24 hours' then
    return false;
  end if;

  update public.worker_profile_view_cooldowns
  set last_viewed_at = current_time
  where worker_profile_id = p_worker_profile_id
    and employer_profile_id = employer_id;

  insert into public.worker_profile_views (
    worker_profile_id,
    employer_profile_id,
    viewed_at
  ) values (
    p_worker_profile_id,
    employer_id,
    current_time
  );

  return true;
end;
$$;

create or replace function public.bc_get_worker_profile_analytics(
  p_worker_profile_id uuid
)
returns table (
  total_profile_views bigint,
  weekly_profile_views bigint,
  unique_employer_views bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.worker_profiles worker
    where worker.id = p_worker_profile_id
      and (worker.profile_id = auth.uid() or public.is_admin(auth.uid()))
  ) then
    raise exception 'You are not allowed to view these profile analytics.';
  end if;

  return query
  select
    count(*)::bigint,
    count(*) filter (where viewed_at >= now() - interval '7 days')::bigint,
    count(distinct employer_profile_id)::bigint
  from public.worker_profile_views
  where worker_profile_id = p_worker_profile_id;
end;
$$;

revoke execute on function public.bc_record_worker_profile_view(uuid) from public;
grant execute on function public.bc_record_worker_profile_view(uuid) to authenticated;
revoke execute on function public.bc_get_worker_profile_analytics(uuid) from public;
grant execute on function public.bc_get_worker_profile_analytics(uuid) to authenticated;
