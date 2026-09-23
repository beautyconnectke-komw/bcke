-- Repair notification creation for databases that have already applied the
-- normal-notifications migration, and make application notifications
-- idempotent without changing the existing notification architecture.

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
set search_path = public, pg_temp
as $$
declare
  notification_id uuid;
  recipient_profile_id uuid := profile_id;
  notification_data jsonb := coalesce(data, '{}'::jsonb);
  notification_dedupe_key text;
  request_worker_profile_id uuid;
  request_employer_profile_id uuid;
  request_worker_owner_id uuid;
  request_employer_owner_id uuid;
  handshake_request_id uuid;
begin
  if recipient_profile_id is null then
    raise exception 'Notification recipient is required.';
  end if;

  if notification_data ? 'request_id' then
    select
      request.worker_profile_id,
      request.employer_profile_id
    into
      request_worker_profile_id,
      request_employer_profile_id
    from public.employer_requests request
    where request.id = nullif(notification_data ->> 'request_id', '')::uuid;
  end if;

  if notification_data ? 'handshake_id'
    and (request_worker_profile_id is null or request_employer_profile_id is null)
  then
    select
      handshake.worker_profile_id,
      handshake.employer_profile_id,
      handshake.request_id
    into
      request_worker_profile_id,
      request_employer_profile_id,
      handshake_request_id
    from public.handshakes handshake
    where handshake.id = nullif(notification_data ->> 'handshake_id', '')::uuid;

    if notification_data ->> 'request_id' is null and handshake_request_id is not null then
      notification_data := notification_data || jsonb_build_object(
        'request_id', handshake_request_id
      );
    end if;
  end if;

  if request_worker_profile_id is not null then
    select worker.profile_id
    into request_worker_owner_id
    from public.worker_profiles worker
    where worker.id = request_worker_profile_id;
  end if;

  if request_employer_profile_id is not null then
    select employer.profile_id
    into request_employer_owner_id
    from public.employer_profiles employer
    where employer.id = request_employer_profile_id;
  end if;

  if request_worker_profile_id is not null then
    notification_data := notification_data || jsonb_build_object(
      'worker_profile_id', request_worker_profile_id
    );
  end if;

  if request_employer_profile_id is not null then
    notification_data := notification_data || jsonb_build_object(
      'employer_profile_id', request_employer_profile_id
    );
  end if;

  if not (
    notification_data ? 'url'
    and jsonb_typeof(notification_data -> 'url') = 'string'
    and left(notification_data ->> 'url', 1) = '/'
    and left(notification_data ->> 'url', 2) <> '//'
  ) then
    notification_data := notification_data || jsonb_build_object(
      'url',
      case
        when notification_type = 'employer_request_received'
          and request_employer_profile_id is not null
          then '/worker/status/employers/' || request_employer_profile_id::text
        when notification_type in (
          'request_accepted',
          'request_considered',
          'request_declined'
        ) and request_worker_profile_id is not null
          then '/employer/workers/' || request_worker_profile_id::text
        when notification_type = 'handshake_completed'
          and recipient_profile_id = request_worker_owner_id
          and request_employer_profile_id is not null
          then '/worker/status/employers/' || request_employer_profile_id::text
        when notification_type = 'handshake_completed'
          and recipient_profile_id = request_employer_owner_id
          and request_worker_profile_id is not null
          then '/employer/workers/' || request_worker_profile_id::text
        when notification_type = 'profile_views_aggregated'
          then '/worker/profile'
        when notification_type in (
          'application_submitted',
          'application_approved',
          'application_rejected'
        )
          then '/worker/home'
        else null
      end
    );
  end if;

  notification_dedupe_key := nullif(notification_data ->> 'dedupe_key', '');

  if notification_dedupe_key is null then
    notification_dedupe_key := case
      when notification_type in (
        'employer_request_received',
        'request_accepted',
        'request_considered',
        'request_declined'
      ) and notification_data ->> 'request_id' is not null
        then notification_type::text || ':request:' || (notification_data ->> 'request_id')
      when notification_type = 'handshake_completed'
        and notification_data ->> 'handshake_id' is not null
        then notification_type::text || ':handshake:' || (notification_data ->> 'handshake_id')
      else null
    end;
  end if;

  insert into public.notifications (
    profile_id,
    type,
    title,
    body,
    data,
    dedupe_key
  )
  values (
    profile_id,
    notification_type,
    title,
    body,
    notification_data,
    notification_dedupe_key
  )
  on conflict (profile_id, dedupe_key)
    where dedupe_key is not null
    do nothing
  returning id into notification_id;

  if notification_id is null and notification_dedupe_key is not null then
    select notification.id
    into notification_id
    from public.notifications notification
    where notification.profile_id = recipient_profile_id
      and notification.dedupe_key = notification_dedupe_key;
  end if;

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
  previous_verification_status public.worker_verification_status;
  application_transition_at timestamptz;
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

  select verification_status
  into previous_verification_status
  from public.worker_profiles
  where profile_id = current_user_id
  for update;

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
  returning id, updated_at into worker_id, application_transition_at;

  if previous_verification_status is distinct from 'pending_review'
    and previous_verification_status is distinct from 'approved'
  then
    perform public.create_notification(
      current_user_id,
      'application_submitted',
      'Application submitted',
      'Your worker application has been submitted for review.',
      jsonb_build_object(
        'worker_profile_id', worker_id,
        'dedupe_key', 'application_submitted:worker:' || worker_id::text
          || ':from:' || coalesce(previous_verification_status::text, 'none')
          || ':to:pending_review:at:' || application_transition_at::text
      )
    );
  end if;

  return worker_id;
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
  previous_verification_status public.worker_verification_status;
  approval_transition_at timestamptz;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  select profile_id, verification_status
  into worker_owner, previous_verification_status
  from public.worker_profiles
  where id = p_worker_profile_id
  for update;

  if worker_owner is null then
    raise exception 'Worker profile not found.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);

  update public.worker_profiles
  set verification_status = 'approved',
      availability_status = 'available',
      is_suspended = false
  where id = p_worker_profile_id
  returning updated_at into approval_transition_at;

  if previous_verification_status is distinct from 'approved' then
    perform public.create_notification(
      worker_owner,
      'application_approved',
      'Application approved',
      'Your Beauty Connect worker profile has been approved.',
      jsonb_build_object(
        'worker_profile_id', p_worker_profile_id,
        'dedupe_key', 'application_approved:worker:' || p_worker_profile_id::text
          || ':from:' || coalesce(previous_verification_status::text, 'none')
          || ':to:approved:at:' || approval_transition_at::text
      )
    );
  end if;

  perform public.log_admin_activity(
    'worker_approved',
    'worker_profiles',
    p_worker_profile_id,
    '{}'::jsonb
  );
end;
$$;

create or replace function public.bc_reject_worker(
  p_worker_profile_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  worker_owner uuid;
  previous_verification_status public.worker_verification_status;
  rejection_transition_at timestamptz;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  select profile_id, verification_status
  into worker_owner, previous_verification_status
  from public.worker_profiles
  where id = p_worker_profile_id
  for update;

  if worker_owner is null then
    raise exception 'Worker profile not found.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);

  update public.worker_profiles
  set verification_status = 'rejected',
      availability_status = 'available'
  where id = p_worker_profile_id
  returning updated_at into rejection_transition_at;

  if previous_verification_status is distinct from 'rejected' then
    perform public.create_notification(
      worker_owner,
      'application_rejected',
      'Application rejected',
      'Your Beauty Connect worker application was not approved.',
      jsonb_build_object(
        'worker_profile_id', p_worker_profile_id,
        'dedupe_key', 'application_rejected:worker:' || p_worker_profile_id::text
          || ':from:' || coalesce(previous_verification_status::text, 'none')
          || ':to:rejected:at:' || rejection_transition_at::text
      )
    );
  end if;

  perform public.log_admin_activity(
    'worker_rejected',
    'worker_profiles',
    p_worker_profile_id,
    jsonb_build_object('reason', p_reason)
  );
end;
$$;

create or replace function public.bc_submit_worker_reviewed_profile(
  p_worker_profile_id uuid,
  p_category_id uuid,
  p_profile_photo_path text default null,
  p_extra_specialty_ids uuid[] default '{}',
  p_portfolio_paths text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  worker_owner_id uuid;
  update_id uuid;
  portfolio_index integer;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if coalesce(array_length(p_extra_specialty_ids, 1), 0) > 12 then
    raise exception 'A worker can have at most twelve extra specialities.';
  end if;

  if coalesce(array_length(p_portfolio_paths, 1), 0) > 4 then
    raise exception 'A worker can have at most four portfolio images.';
  end if;

  select profile_id
  into worker_owner_id
  from public.worker_profiles
  where id = p_worker_profile_id
    and profile_id = current_user_id
    and verification_status = 'approved'
  for update;

  if worker_owner_id is null then
    raise exception 'Only an approved worker can submit reviewed profile changes.';
  end if;

  if p_profile_photo_path is not null
    and split_part(p_profile_photo_path, '/', 1) <> current_user_id::text then
    raise exception 'The profile image must belong to the authenticated user.';
  end if;

  for portfolio_index in 1..coalesce(array_length(p_portfolio_paths, 1), 0) loop
    if split_part(p_portfolio_paths[portfolio_index], '/', 1) <> current_user_id::text then
      raise exception 'Portfolio images must belong to the authenticated user.';
    end if;
  end loop;

  if exists (
    select 1
    from public.worker_profile_updates
    where worker_profile_id = p_worker_profile_id
      and status = 'pending'
  ) then
    raise exception 'You already have profile changes waiting for admin review.';
  end if;

  insert into public.worker_profile_updates (
    worker_profile_id,
    category_id,
    profile_photo_path,
    extra_specialty_ids,
    portfolio_paths
  ) values (
    p_worker_profile_id,
    p_category_id,
    p_profile_photo_path,
    coalesce(p_extra_specialty_ids, '{}'),
    case
      when coalesce(array_length(p_portfolio_paths, 1), 0) > 0
        then p_portfolio_paths
      else null
    end
  )
  returning id into update_id;

  perform public.create_notification(
    current_user_id,
    'application_submitted',
    'Profile changes submitted',
    'Your reviewed profile changes are waiting for admin review.',
    jsonb_build_object(
      'worker_profile_id', p_worker_profile_id,
      'worker_profile_update_id', update_id,
      'dedupe_key', 'application_submitted:profile_update:' || update_id::text || ':submitted'
    )
  );

  return p_worker_profile_id;
end;
$$;

create or replace function public.bc_approve_worker_profile_update(
  p_update_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  update_record public.worker_profile_updates%rowtype;
  worker_owner_id uuid;
  portfolio_index integer;
begin
  if not public.is_admin(current_user_id) then
    raise exception 'Admin authorization is required.';
  end if;

  select *
  into update_record
  from public.worker_profile_updates
  where id = p_update_id
    and status = 'pending'
  for update;

  if update_record.id is null then
    raise exception 'Pending worker profile update not found.';
  end if;

  select profile_id
  into worker_owner_id
  from public.worker_profiles
  where id = update_record.worker_profile_id
  for update;

  if worker_owner_id is null then
    raise exception 'Worker profile not found.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);

  update public.worker_profiles
  set category_id = update_record.category_id,
      profile_photo_path = coalesce(
        update_record.profile_photo_path,
        profile_photo_path
      ),
      extra_specialty_ids = update_record.extra_specialty_ids
  where id = update_record.worker_profile_id;

  if update_record.portfolio_paths is not null then
    delete from public.worker_portfolio
    where worker_profile_id = update_record.worker_profile_id;

    for portfolio_index in 1..array_length(update_record.portfolio_paths, 1) loop
      insert into public.worker_portfolio (
        worker_profile_id,
        storage_path,
        display_order
      ) values (
        update_record.worker_profile_id,
        update_record.portfolio_paths[portfolio_index],
        portfolio_index
      );
    end loop;
  end if;

  update public.worker_profile_updates
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = current_user_id
  where id = update_record.id;

  perform public.create_notification(
    worker_owner_id,
    'application_approved',
    'Profile changes approved',
    'Your Beauty Connect profile changes are now live.',
    jsonb_build_object(
      'worker_profile_id', update_record.worker_profile_id,
      'worker_profile_update_id', update_record.id,
      'dedupe_key', 'application_approved:profile_update:' || update_record.id::text || ':approved'
    )
  );

  perform public.log_admin_activity(
    'worker_profile_update_approved',
    'worker_profile_updates',
    update_record.id,
    jsonb_build_object('worker_profile_id', update_record.worker_profile_id)
  );
end;
$$;

create or replace function public.bc_reject_worker_profile_update(
  p_update_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  update_record public.worker_profile_updates%rowtype;
  worker_owner_id uuid;
begin
  if not public.is_admin(current_user_id) then
    raise exception 'Admin authorization is required.';
  end if;

  select *
  into update_record
  from public.worker_profile_updates
  where id = p_update_id
    and status = 'pending'
  for update;

  if update_record.id is null then
    raise exception 'Pending worker profile update not found.';
  end if;

  select profile_id
  into worker_owner_id
  from public.worker_profiles
  where id = update_record.worker_profile_id;

  if worker_owner_id is null then
    raise exception 'Worker profile not found.';
  end if;

  perform set_config('app.beauty_connect_internal', 'on', true);

  update public.worker_profile_updates
  set status = 'rejected',
      reviewed_at = now(),
      reviewed_by = current_user_id
  where id = update_record.id;

  perform public.create_notification(
    worker_owner_id,
    'application_rejected',
    'Profile changes need changes',
    coalesce(
      nullif(trim(p_reason), ''),
      'Your requested profile changes were not approved. Please review them and try again.'
    ),
    jsonb_build_object(
      'worker_profile_id', update_record.worker_profile_id,
      'worker_profile_update_id', update_record.id,
      'dedupe_key', 'application_rejected:profile_update:' || update_record.id::text || ':rejected'
    )
  );

  perform public.log_admin_activity(
    'worker_profile_update_rejected',
    'worker_profile_updates',
    update_record.id,
    jsonb_build_object(
      'worker_profile_id', update_record.worker_profile_id,
      'reason', p_reason
    )
  );
end;
$$;
