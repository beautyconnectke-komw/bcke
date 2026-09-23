alter table public.notifications
  add column if not exists dedupe_key text;

create unique index if not exists notifications_profile_dedupe_idx
on public.notifications (profile_id, dedupe_key)
where dedupe_key is not null;

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
      new.id is distinct from old.id
      or new.profile_id is distinct from old.profile_id
      or new.type is distinct from old.type
      or new.title is distinct from old.title
      or new.body is distinct from old.body
      or new.data is distinct from old.data
      or new.dedupe_key is distinct from old.dedupe_key
      or new.created_at is distinct from old.created_at
    )
  then
    raise exception 'Users can only update notification read state.';
  end if;

  return new;
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

create type public.notification_delivery_channel as enum ('push');
create type public.notification_delivery_status as enum (
  'sending',
  'sent',
  'failed'
);

create table public.notification_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_push_endpoint_length check (char_length(endpoint) between 20 and 2000),
  constraint notification_push_key_length check (char_length(p256dh) between 20 and 500),
  constraint notification_push_auth_length check (char_length(auth) between 10 and 500),
  constraint notification_push_subscription_unique_endpoint unique (profile_id, endpoint)
);

create trigger set_notification_push_subscriptions_updated_at
before update on public.notification_push_subscriptions
for each row execute function public.set_updated_at();

create index notification_push_subscriptions_profile_idx
on public.notification_push_subscriptions (profile_id, last_seen_at desc);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  subscription_id uuid not null references public.notification_push_subscriptions(id) on delete cascade,
  channel public.notification_delivery_channel not null,
  status public.notification_delivery_status not null default 'sending',
  attempt_count integer not null default 1,
  last_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  constraint notification_delivery_attempts_positive check (attempt_count > 0),
  constraint notification_delivery_unique_channel unique (
    notification_id,
    subscription_id,
    channel
  )
);

create index notification_deliveries_notification_idx
on public.notification_deliveries (notification_id, channel, status);

alter table public.notification_push_subscriptions enable row level security;
alter table public.notification_deliveries enable row level security;

revoke all on public.notification_push_subscriptions from anon;
revoke all on public.notification_deliveries from anon;

create policy "Users can view their own push subscriptions"
on public.notification_push_subscriptions for select
using (profile_id = auth.uid());

create policy "Users can create their own push subscriptions"
on public.notification_push_subscriptions for insert
with check (profile_id = auth.uid());

create policy "Users can update their own push subscriptions"
on public.notification_push_subscriptions for update
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Users can delete their own push subscriptions"
on public.notification_push_subscriptions for delete
using (profile_id = auth.uid());

create policy "Users can view their own notification deliveries"
on public.notification_deliveries for select
using (
  exists (
    select 1
    from public.notifications notification
    where notification.id = notification_deliveries.notification_id
      and notification.profile_id = auth.uid()
  )
);

create policy "Admins can manage notification push subscriptions"
on public.notification_push_subscriptions for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admins can manage notification deliveries"
on public.notification_deliveries for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

grant select, insert, update, delete
on public.notification_push_subscriptions
to authenticated;
grant select on public.notification_deliveries to authenticated;
grant all on public.notification_push_subscriptions, public.notification_deliveries
to service_role;

create or replace function public.bc_claim_notification_push_delivery(
  p_notification_id uuid,
  p_subscription_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  delivery_id uuid;
begin
  if not public.is_service_role() then
    raise exception 'Service authorization is required.';
  end if;

  insert into public.notification_deliveries (
    notification_id,
    subscription_id,
    channel,
    status,
    attempt_count,
    last_attempt_at,
    last_error
  )
  values (
    p_notification_id,
    p_subscription_id,
    'push',
    'sending',
    1,
    now(),
    null
  )
  on conflict (notification_id, subscription_id, channel)
  do update set
    status = 'sending',
    attempt_count = notification_deliveries.attempt_count + 1,
    last_attempt_at = now(),
    last_error = null
  where notification_deliveries.status <> 'sent'
    and (
      notification_deliveries.status <> 'sending'
      or notification_deliveries.last_attempt_at < now() - interval '5 minutes'
    )
  returning id into delivery_id;

  return delivery_id;
end;
$$;

revoke execute on function public.bc_claim_notification_push_delivery(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.bc_claim_notification_push_delivery(uuid, uuid)
to service_role;

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
  recent_unique_employers bigint;
  weekly_key text;
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

  select count(distinct view.employer_profile_id)
  into recent_unique_employers
  from public.worker_profile_views view
  where view.worker_profile_id = p_worker_profile_id
    and view.viewed_at >= v_now - interval '7 days';

  if recent_unique_employers >= 3
    and not exists (
      select 1
      from public.notifications notification
      where notification.profile_id = worker_owner_id
        and notification.type = 'profile_views_aggregated'
        and notification.created_at >= v_now - interval '7 days'
    )
  then
    weekly_key := to_char(date_trunc('week', v_now), 'IYYY-IW');

    perform public.create_notification(
      worker_owner_id,
      'profile_views_aggregated',
      recent_unique_employers::text || ' employers viewed your profile',
      'Your profile is getting attention from employers. Open your profile to review your reach.',
      jsonb_build_object(
        'worker_profile_id', p_worker_profile_id,
        'profile_view_count', recent_unique_employers,
        'window_days', 7,
        'dedupe_key', 'profile_views:' || p_worker_profile_id::text || ':' || weekly_key
      )
    );
  end if;

  return true;
end;
$$;

revoke execute on function public.create_notification(
  uuid,
  public.notification_type,
  text,
  text,
  jsonb
) from public, anon, authenticated;

grant execute on function public.bc_record_worker_profile_view(uuid)
to authenticated;
