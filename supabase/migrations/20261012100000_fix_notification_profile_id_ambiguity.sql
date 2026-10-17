-- The notification recipient parameter is named profile_id, which conflicts
-- with the notifications.profile_id column when it is referenced unqualified
-- in the INSERT values list. Use the resolved recipient variable instead.
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
    recipient_profile_id,
    notification_type,
    title,
    body,
    notification_data,
    notification_dedupe_key
  )
  -- Do not name the conflict target here.  `profile_id` is also the
  -- function parameter name, and PL/pgSQL can report that target as
  -- ambiguous while compiling the statement.
  on conflict do nothing
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

revoke execute on function public.create_notification(
  uuid,
  public.notification_type,
  text,
  text,
  jsonb
) from public, anon, authenticated;
