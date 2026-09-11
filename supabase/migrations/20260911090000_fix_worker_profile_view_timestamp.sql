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
  v_now timestamptz := now();
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
    v_now - interval '24 hours'
  )
  on conflict (worker_profile_id, employer_profile_id) do nothing;

  select cooldown.last_viewed_at
  into previous_viewed_at
  from public.worker_profile_view_cooldowns cooldown
  where cooldown.worker_profile_id = p_worker_profile_id
    and cooldown.employer_profile_id = employer_id
  for update;

  if previous_viewed_at > v_now - interval '24 hours' then
    return false;
  end if;

  update public.worker_profile_view_cooldowns
  set last_viewed_at = v_now
  where worker_profile_id = p_worker_profile_id
    and employer_profile_id = employer_id;

  insert into public.worker_profile_views (
    worker_profile_id,
    employer_profile_id,
    viewed_at
  ) values (
    p_worker_profile_id,
    employer_id,
    v_now
  );

  return true;
end;
$$;
