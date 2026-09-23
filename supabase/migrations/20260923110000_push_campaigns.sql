-- Push campaigns are deliberately separate from transactional notification
-- creation. They snapshot recipients, schedule delivery occurrences, and use
-- the existing notification_push_subscriptions table only at delivery time.

alter type public.notification_type add value if not exists 'push_campaign';

do $$
begin
  create type public.push_campaign_target as enum ('worker', 'employer', 'both');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.push_campaign_type as enum ('general', 'promote_worker');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.push_campaign_status as enum (
    'draft',
    'scheduled',
    'active',
    'paused',
    'completed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.push_campaign_audience_mode as enum ('all', 'percentage');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.push_campaign_specialty_scope as enum ('any', 'main', 'extra');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.push_campaign_delivery_status as enum (
    'pending',
    'processing',
    'sent',
    'failed'
  );
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.push_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  body text not null,
  target public.push_campaign_target not null,
  campaign_type public.push_campaign_type not null default 'general',
  status public.push_campaign_status not null default 'draft',
  audience_mode public.push_campaign_audience_mode not null default 'all',
  audience_percentage integer not null default 100,
  audience_estimated_count integer not null default 0,
  audience_selected_count integer not null default 0,
  campaign_period_days integer not null,
  sends_per_recipient integer not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  delivery_window_start time not null default '08:00',
  delivery_window_end time not null default '20:00',
  delivery_timezone text not null default 'Africa/Nairobi',
  county text,
  specialty_id uuid references public.categories(id) on delete restrict,
  specialty_scope public.push_campaign_specialty_scope not null default 'any',
  promoted_worker_profile_id uuid references public.worker_profiles(id) on delete set null,
  worker_destination text,
  employer_destination text,
  recipient_count integer not null default 0,
  scheduled_delivery_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_campaign_title_length check (char_length(title) between 2 and 160),
  constraint push_campaign_body_length check (char_length(body) between 1 and 1000),
  constraint push_campaign_audience_percentage check (audience_percentage between 1 and 100),
  constraint push_campaign_period_days check (campaign_period_days in (1, 2, 7, 14, 30)),
  constraint push_campaign_sends_positive check (sends_per_recipient between 1 and 30),
  constraint push_campaign_dates_ordered check (ends_at > starts_at),
  constraint push_campaign_delivery_window_ordered check (delivery_window_end > delivery_window_start),
  constraint push_campaign_audience_counts_non_negative check (
    audience_estimated_count >= 0
    and audience_selected_count >= 0
    and recipient_count >= 0
    and scheduled_delivery_count >= 0
    and sent_count >= 0
    and failed_count >= 0
  ),
  constraint push_campaign_target_type check (
    (campaign_type = 'general' and promoted_worker_profile_id is null)
    or (campaign_type = 'promote_worker' and target = 'employer' and promoted_worker_profile_id is not null)
  ),
  constraint push_campaign_destination_paths check (
    (worker_destination is null or worker_destination in ('/worker/home', '/worker/status', '/worker/profile'))
    and (employer_destination is null or employer_destination in ('/employer/home', '/employer/workers', '/employer/profile'))
  ),
  constraint push_campaign_promoted_worker_destination check (
    campaign_type <> 'promote_worker' or employer_destination is null
  ),
  constraint push_campaign_supported_county check (
    county is null or county in (
      'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
      'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega',
      'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu',
      'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni',
      'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang''a',
      'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
      'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
      'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu',
      'Vihiga', 'Wajir', 'West Pokot'
    )
  )
);

drop trigger if exists set_push_campaigns_updated_at on public.push_campaigns;
create trigger set_push_campaigns_updated_at
before update on public.push_campaigns
for each row execute function public.set_updated_at();

create index if not exists push_campaigns_manage_idx
on public.push_campaigns (status, starts_at desc, created_at desc);

create table if not exists public.push_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.push_campaigns(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.profile_role not null,
  created_at timestamptz not null default now(),
  constraint push_campaign_recipient_role check (role in ('worker', 'employer')),
  constraint push_campaign_recipient_unique unique (campaign_id, profile_id)
);

create index if not exists push_campaign_recipients_campaign_idx
on public.push_campaign_recipients (campaign_id, role, profile_id);

create table if not exists public.push_campaign_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.push_campaigns(id) on delete cascade,
  recipient_id uuid not null references public.push_campaign_recipients(id) on delete cascade,
  occurrence_no integer not null,
  scheduled_for timestamptz not null,
  status public.push_campaign_delivery_status not null default 'pending',
  attempt_count integer not null default 0,
  claimed_at timestamptz,
  notification_id uuid references public.notifications(id) on delete set null,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  constraint push_campaign_delivery_occurrence_positive check (occurrence_no > 0),
  constraint push_campaign_delivery_attempts_non_negative check (attempt_count >= 0),
  constraint push_campaign_delivery_unique_occurrence unique (campaign_id, recipient_id, occurrence_no)
);

create index if not exists push_campaign_deliveries_due_idx
on public.push_campaign_deliveries (status, scheduled_for)
where status = 'pending';

create index if not exists push_campaign_deliveries_campaign_idx
on public.push_campaign_deliveries (campaign_id, status, scheduled_for);

create table if not exists public.push_campaign_profile_visits (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.push_campaigns(id) on delete cascade,
  worker_profile_id uuid not null references public.worker_profiles(id) on delete cascade,
  employer_profile_id uuid not null references public.employer_profiles(id) on delete cascade,
  visit_day date not null default ((now() at time zone 'Africa/Nairobi')::date),
  visited_at timestamptz not null default now(),
  constraint push_campaign_profile_visit_unique_day unique (
    campaign_id,
    worker_profile_id,
    employer_profile_id,
    visit_day
  )
);

create index if not exists push_campaign_profile_visits_campaign_idx
on public.push_campaign_profile_visits (campaign_id, visited_at desc);

alter table public.push_campaigns enable row level security;
alter table public.push_campaign_recipients enable row level security;
alter table public.push_campaign_deliveries enable row level security;
alter table public.push_campaign_profile_visits enable row level security;

revoke all on public.push_campaigns, public.push_campaign_recipients, public.push_campaign_deliveries from anon;
revoke all on public.push_campaign_profile_visits from anon;

drop policy if exists "Admins can manage push campaigns" on public.push_campaigns;
create policy "Admins can manage push campaigns"
on public.push_campaigns for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can inspect push campaign recipients" on public.push_campaign_recipients;
create policy "Admins can inspect push campaign recipients"
on public.push_campaign_recipients for select
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can inspect push campaign deliveries" on public.push_campaign_deliveries;
create policy "Admins can inspect push campaign deliveries"
on public.push_campaign_deliveries for select
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can inspect push campaign profile visits" on public.push_campaign_profile_visits;
create policy "Admins can inspect push campaign profile visits"
on public.push_campaign_profile_visits for select
using (public.is_admin(auth.uid()));

grant select on public.push_campaigns, public.push_campaign_recipients, public.push_campaign_deliveries to authenticated;
grant all on public.push_campaigns, public.push_campaign_recipients, public.push_campaign_deliveries to service_role;
grant select on public.push_campaign_profile_visits to authenticated;
grant all on public.push_campaign_profile_visits to service_role;

create or replace function public.bc_push_campaign_eligible_profiles(
  p_target public.push_campaign_target,
  p_campaign_type public.push_campaign_type default 'general',
  p_county text default null,
  p_specialty_id uuid default null,
  p_specialty_scope public.push_campaign_specialty_scope default 'any',
  p_promoted_worker_profile_id uuid default null
)
returns table(profile_id uuid, role public.profile_role)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with worker_candidates as (
    select worker.profile_id, 'worker'::public.profile_role as role
    from public.worker_profiles worker
    join public.profiles profile on profile.id = worker.profile_id
    where p_target in ('worker'::public.push_campaign_target, 'both'::public.push_campaign_target)
      and profile.role = 'worker'
      and profile.account_deletion_scheduled_for is null
      and worker.verification_status = 'approved'
      and worker.is_suspended = false
      and worker.public_visible = true
      and exists (
        select 1
        from public.notification_push_subscriptions subscription
        where subscription.profile_id = worker.profile_id
          and subscription.last_seen_at >= now() - interval '90 days'
      )
      and (p_county is null or worker.county = p_county)
      and (
        p_specialty_id is null
        or (p_specialty_scope = 'any' and (
          worker.category_id = p_specialty_id
          or p_specialty_id = any(coalesce(worker.extra_specialty_ids, '{}'::uuid[]))
        ))
        or (p_specialty_scope = 'main' and worker.category_id = p_specialty_id)
        or (p_specialty_scope = 'extra' and p_specialty_id = any(coalesce(worker.extra_specialty_ids, '{}'::uuid[])))
      )
  ), employer_candidates as (
    select employer.profile_id, 'employer'::public.profile_role as role
    from public.employer_profiles employer
    join public.profiles profile on profile.id = employer.profile_id
    where p_target in ('employer'::public.push_campaign_target, 'both'::public.push_campaign_target)
      and profile.role = 'employer'
      and profile.account_deletion_scheduled_for is null
      and employer.is_suspended = false
      and exists (
        select 1
        from public.notification_push_subscriptions subscription
        where subscription.profile_id = employer.profile_id
          and subscription.last_seen_at >= now() - interval '90 days'
      )
      and (
        p_campaign_type = 'general'::public.push_campaign_type
        and (p_county is null or employer.county = p_county)
        and (
          p_specialty_id is null
          or (p_specialty_scope = 'any' and (
            employer.category_id = p_specialty_id
            or p_specialty_id = any(coalesce(employer.extra_specialty_ids, '{}'::uuid[]))
          ))
          or (p_specialty_scope = 'main' and employer.category_id = p_specialty_id)
          or (p_specialty_scope = 'extra' and p_specialty_id = any(coalesce(employer.extra_specialty_ids, '{}'::uuid[])))
        )
        or (
          p_campaign_type = 'promote_worker'::public.push_campaign_type
          and p_promoted_worker_profile_id is not null
          and exists (
            select 1
            from public.worker_profiles promoted_worker
            where promoted_worker.id = p_promoted_worker_profile_id
              and promoted_worker.verification_status = 'approved'
              and promoted_worker.is_suspended = false
              and promoted_worker.public_visible = true
              and promoted_worker.county is not null
              and employer.county = promoted_worker.county
              and (
                employer.category_id = promoted_worker.category_id
                or promoted_worker.category_id = any(coalesce(employer.extra_specialty_ids, '{}'::uuid[]))
                or employer.category_id = any(coalesce(promoted_worker.extra_specialty_ids, '{}'::uuid[]))
                or coalesce(employer.extra_specialty_ids, '{}'::uuid[])
                  && coalesce(promoted_worker.extra_specialty_ids, '{}'::uuid[])
              )
          )
        )
      )
  )
  select worker_candidates.profile_id, worker_candidates.role
  from worker_candidates
  union all
  select employer_candidates.profile_id, employer_candidates.role
  from employer_candidates;
$$;

revoke all on function public.bc_push_campaign_eligible_profiles(
  public.push_campaign_target,
  public.push_campaign_type,
  text,
  uuid,
  public.push_campaign_specialty_scope,
  uuid
) from public, anon, authenticated;

create or replace function public.bc_preview_push_campaign_audience(
  p_target public.push_campaign_target,
  p_campaign_type public.push_campaign_type default 'general',
  p_audience_percentage integer default 100,
  p_county text default null,
  p_specialty_id uuid default null,
  p_specialty_scope public.push_campaign_specialty_scope default 'any',
  p_promoted_worker_profile_id uuid default null
)
returns table(eligible_count bigint, selected_count bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  total_eligible bigint;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin authorization is required.';
  end if;

  if p_audience_percentage not between 1 and 100 then
    raise exception 'Audience percentage must be between 1 and 100.';
  end if;

  if p_campaign_type = 'promote_worker' and p_target <> 'employer' then
    raise exception 'Worker promotion campaigns must target employers.';
  end if;

  if p_county is not null and p_county not in (
    'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
    'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega',
    'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu',
    'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni',
    'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang''a',
    'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
    'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
    'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu',
    'Vihiga', 'Wajir', 'West Pokot'
  ) then
    raise exception 'County is not in the supported county list.';
  end if;

  select count(*)
  into total_eligible
  from public.bc_push_campaign_eligible_profiles(
    p_target,
    p_campaign_type,
    p_county,
    p_specialty_id,
    p_specialty_scope,
    p_promoted_worker_profile_id
  );

  return query
  select
    total_eligible,
    case
      when total_eligible = 0 then 0::bigint
      when p_audience_percentage = 100 then total_eligible
      else ceil(total_eligible * p_audience_percentage / 100.0)::bigint
    end;
end;
$$;

revoke all on function public.bc_preview_push_campaign_audience(
  public.push_campaign_target,
  public.push_campaign_type,
  integer,
  text,
  uuid,
  public.push_campaign_specialty_scope,
  uuid
) from public, anon;
grant execute on function public.bc_preview_push_campaign_audience(
  public.push_campaign_target,
  public.push_campaign_type,
  integer,
  text,
  uuid,
  public.push_campaign_specialty_scope,
  uuid
) to authenticated;

create or replace function public.bc_create_push_campaign(
  p_title text,
  p_body text,
  p_target public.push_campaign_target,
  p_campaign_type public.push_campaign_type,
  p_audience_mode public.push_campaign_audience_mode,
  p_audience_percentage integer,
  p_campaign_period_days integer,
  p_sends_per_recipient integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_delivery_window_start time,
  p_delivery_window_end time,
  p_delivery_timezone text,
  p_county text default null,
  p_specialty_id uuid default null,
  p_specialty_scope public.push_campaign_specialty_scope default 'any',
  p_promoted_worker_profile_id uuid default null,
  p_worker_destination text default null,
  p_employer_destination text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  campaign_id uuid;
  estimate record;
  expected_ends_at timestamptz;
begin
  if not public.is_admin(current_user_id) then
    raise exception 'Admin authorization is required.';
  end if;

  if char_length(trim(p_title)) not between 2 and 160 then
    raise exception 'Campaign title must be between 2 and 160 characters.';
  end if;
  if char_length(trim(p_body)) not between 1 and 1000 then
    raise exception 'Campaign message must be between 1 and 1000 characters.';
  end if;
  if p_campaign_period_days not in (1, 2, 7, 14, 30) then
    raise exception 'Campaign period is not supported.';
  end if;
  if p_sends_per_recipient not between 1 and 30 then
    raise exception 'Sends per recipient must be between 1 and 30.';
  end if;
  if p_starts_at < now() - interval '1 minute' then
    raise exception 'Campaign start cannot be in the past.';
  end if;

  expected_ends_at := p_starts_at + make_interval(days => p_campaign_period_days);
  if p_ends_at <> expected_ends_at then
    raise exception 'Campaign end must equal start plus the selected campaign period.';
  end if;
  if p_delivery_window_end <= p_delivery_window_start then
    raise exception 'Delivery window end must be after its start.';
  end if;
  if not exists (select 1 from pg_timezone_names where name = p_delivery_timezone) then
    raise exception 'Delivery timezone is not supported.';
  end if;
  if p_campaign_type = 'promote_worker' and p_target <> 'employer' then
    raise exception 'Worker promotion campaigns must target employers.';
  end if;
  if p_campaign_type = 'promote_worker' and p_employer_destination is not null then
    raise exception 'Promoted-worker destinations are generated automatically.';
  end if;

  select *
  into estimate
  from public.bc_preview_push_campaign_audience(
    p_target,
    p_campaign_type,
    case when p_audience_mode = 'all' then 100 else p_audience_percentage end,
    p_county,
    p_specialty_id,
    p_specialty_scope,
    p_promoted_worker_profile_id
  );

  insert into public.push_campaigns (
    created_by,
    title,
    body,
    target,
    campaign_type,
    audience_mode,
    audience_percentage,
    audience_estimated_count,
    audience_selected_count,
    campaign_period_days,
    sends_per_recipient,
    starts_at,
    ends_at,
    delivery_window_start,
    delivery_window_end,
    delivery_timezone,
    county,
    specialty_id,
    specialty_scope,
    promoted_worker_profile_id,
    worker_destination,
    employer_destination
  ) values (
    current_user_id,
    trim(p_title),
    trim(p_body),
    p_target,
    p_campaign_type,
    p_audience_mode,
    case when p_audience_mode = 'all' then 100 else p_audience_percentage end,
    estimate.eligible_count,
    estimate.selected_count,
    p_campaign_period_days,
    p_sends_per_recipient,
    p_starts_at,
    p_ends_at,
    p_delivery_window_start,
    p_delivery_window_end,
    p_delivery_timezone,
    p_county,
    p_specialty_id,
    p_specialty_scope,
    p_promoted_worker_profile_id,
    p_worker_destination,
    p_employer_destination
  ) returning id into campaign_id;

  perform public.log_admin_activity(
    'push_campaign_created',
    'push_campaigns',
    campaign_id,
    jsonb_build_object('target', p_target, 'campaign_type', p_campaign_type)
  );

  return campaign_id;
end;
$$;

revoke all on function public.bc_create_push_campaign(
  text, text, public.push_campaign_target, public.push_campaign_type,
  public.push_campaign_audience_mode, integer, integer, integer,
  timestamptz, timestamptz, time, time, text, text, uuid,
  public.push_campaign_specialty_scope, uuid, text, text
) from public, anon;
grant execute on function public.bc_create_push_campaign(
  text, text, public.push_campaign_target, public.push_campaign_type,
  public.push_campaign_audience_mode, integer, integer, integer,
  timestamptz, timestamptz, time, time, text, text, uuid,
  public.push_campaign_specialty_scope, uuid, text, text
) to authenticated;

create or replace function public.bc_campaign_scheduled_timestamp(
  p_campaign_id uuid,
  p_profile_id uuid,
  p_occurrence_no integer,
  p_sends_per_recipient integer,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_window_start time,
  p_window_end time,
  p_timezone text
)
returns timestamptz
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  nominal_at timestamptz;
  candidate_at timestamptz;
  nominal_local timestamp;
  candidate_local timestamp;
  window_start_local timestamp;
  window_end_local timestamp;
  window_day date;
  window_seconds bigint;
  offset_seconds bigint;
  step integer;
begin
  nominal_at := p_starts_at + (p_ends_at - p_starts_at) * (
    (p_occurrence_no::double precision - 0.5) / p_sends_per_recipient::double precision
  );
  nominal_local := nominal_at at time zone p_timezone;
  window_day := nominal_local::date;
  window_seconds := greatest(
    1,
    floor(extract(epoch from (p_window_end - p_window_start)))::bigint
  );
  offset_seconds := mod(
    abs(hashtext(p_campaign_id::text || ':' || p_profile_id::text || ':' || p_occurrence_no::text))::bigint,
    window_seconds
  );

  for step in 0..3 loop
    window_start_local := window_day + p_window_start;
    window_end_local := window_day + p_window_end;
    candidate_local := window_start_local + offset_seconds * interval '1 second';
    candidate_at := candidate_local at time zone p_timezone;

    if candidate_at >= p_starts_at and candidate_at <= p_ends_at then
      return candidate_at;
    end if;

    if candidate_at < p_starts_at then
      window_day := window_day + 1;
    else
      window_day := window_day - 1;
    end if;
  end loop;

  return greatest(p_starts_at, least(p_ends_at, candidate_at));
end;
$$;

revoke all on function public.bc_campaign_scheduled_timestamp(
  uuid, uuid, integer, integer, timestamptz, timestamptz, time, time, text
) from public, anon, authenticated;

create or replace function public.bc_activate_push_campaign(p_campaign_id uuid)
returns public.push_campaign_status
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  campaign public.push_campaigns%rowtype;
  eligible_count integer;
  selected_count integer;
  next_status public.push_campaign_status;
begin
  if not public.is_admin(current_user_id) then
    raise exception 'Admin authorization is required.';
  end if;

  select * into campaign
  from public.push_campaigns
  where id = p_campaign_id
  for update;

  if campaign.id is null then
    raise exception 'Campaign not found.';
  end if;
  if campaign.status <> 'draft' then
    raise exception 'Only draft campaigns can be activated.';
  end if;
  if campaign.ends_at <= now() then
    raise exception 'Campaign end must be in the future.';
  end if;

  select count(*)::integer
  into eligible_count
  from public.bc_push_campaign_eligible_profiles(
    campaign.target,
    campaign.campaign_type,
    campaign.county,
    campaign.specialty_id,
    campaign.specialty_scope,
    campaign.promoted_worker_profile_id
  );

  selected_count := case
    when eligible_count = 0 then 0
    when campaign.audience_percentage = 100 then eligible_count
    else ceil(eligible_count * campaign.audience_percentage / 100.0)::integer
  end;

  next_status := case
    when campaign.starts_at <= now() then 'active'::public.push_campaign_status
    else 'scheduled'::public.push_campaign_status
  end;

  with eligible as (
    select
      candidate.profile_id,
      candidate.role,
      row_number() over (
        order by md5(campaign.id::text || ':' || candidate.profile_id::text)
      ) as selection_rank
    from public.bc_push_campaign_eligible_profiles(
      campaign.target,
      campaign.campaign_type,
      campaign.county,
      campaign.specialty_id,
      campaign.specialty_scope,
      campaign.promoted_worker_profile_id
    ) candidate
  )
  insert into public.push_campaign_recipients (campaign_id, profile_id, role)
  select campaign.id, eligible.profile_id, eligible.role
  from eligible
  where eligible.selection_rank <= selected_count;

  insert into public.push_campaign_deliveries (
    campaign_id,
    recipient_id,
    occurrence_no,
    scheduled_for
  )
  select
    recipient.campaign_id,
    recipient.id,
    occurrence.occurrence_no,
    public.bc_campaign_scheduled_timestamp(
      campaign.id,
      recipient.profile_id,
      occurrence.occurrence_no,
      campaign.sends_per_recipient,
      campaign.starts_at,
      campaign.ends_at,
      campaign.delivery_window_start,
      campaign.delivery_window_end,
      campaign.delivery_timezone
    )
  from public.push_campaign_recipients recipient
  cross join lateral generate_series(1, campaign.sends_per_recipient) as occurrence(occurrence_no)
  where recipient.campaign_id = campaign.id;

  update public.push_campaigns
  set status = next_status,
      audience_estimated_count = eligible_count,
      audience_selected_count = selected_count,
      recipient_count = selected_count,
      scheduled_delivery_count = selected_count * campaign.sends_per_recipient
  where id = campaign.id;

  perform public.log_admin_activity(
    'push_campaign_activated',
    'push_campaigns',
    campaign.id,
    jsonb_build_object(
      'status', next_status,
      'audience_estimated_count', eligible_count,
      'recipient_count', selected_count
    )
  );

  return next_status;
end;
$$;

revoke all on function public.bc_activate_push_campaign(uuid) from public, anon;
grant execute on function public.bc_activate_push_campaign(uuid) to authenticated;

create or replace function public.bc_record_push_campaign_profile_visit(
  p_campaign_id uuid,
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

  if not exists (
    select 1
    from public.push_campaigns campaign
    where campaign.id = p_campaign_id
      and campaign.campaign_type = 'promote_worker'
      and campaign.promoted_worker_profile_id = p_worker_profile_id
      and campaign.status in ('scheduled', 'active', 'paused', 'completed')
  ) then
    return false;
  end if;

  if not exists (
    select 1
    from public.push_campaign_recipients recipient
    where recipient.campaign_id = p_campaign_id
      and recipient.profile_id = current_user_id
      and recipient.role = 'employer'
  ) then
    return false;
  end if;

  insert into public.push_campaign_profile_visits (
    campaign_id,
    worker_profile_id,
    employer_profile_id
  ) values (
    p_campaign_id,
    p_worker_profile_id,
    employer_id
  ) on conflict (campaign_id, worker_profile_id, employer_profile_id, visit_day)
  do nothing;

  return true;
end;
$$;

revoke all on function public.bc_record_push_campaign_profile_visit(uuid, uuid)
from public, anon;
grant execute on function public.bc_record_push_campaign_profile_visit(uuid, uuid)
to authenticated;

create or replace function public.bc_claim_push_campaign_deliveries(
  p_limit integer default 50
)
returns table(delivery_id uuid, campaign_id uuid, profile_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  stale_delivery record;
begin
  if not public.is_service_role() then
    raise exception 'Service authorization is required.';
  end if;

  update public.push_campaigns
  set status = 'active'
  where status = 'scheduled'
    and starts_at <= now()
    and ends_at > now();

  update public.push_campaigns
  set status = 'completed'
  where status in ('scheduled', 'active', 'paused')
    and ends_at <= now();

  -- A process that died while holding a claim is terminally failed. It is not
  -- retried automatically because the external push provider may have already
  -- accepted the request before the process stopped.
  for stale_delivery in
    select id, campaign_id
    from public.push_campaign_deliveries
    where status = 'processing'
      and claimed_at < now() - interval '30 minutes'
    for update skip locked
  loop
    update public.push_campaign_deliveries
    set status = 'failed',
        last_error = 'Scheduler claim expired before the delivery was finalized.'
    where id = stale_delivery.id
      and status = 'processing';

    update public.push_campaigns
    set failed_count = failed_count + 1
    where id = stale_delivery.campaign_id;
  end loop;

  return query
  with due as (
    select delivery.id
    from public.push_campaign_deliveries delivery
    join public.push_campaigns campaign on campaign.id = delivery.campaign_id
    where campaign.status = 'active'
      and delivery.status = 'pending'
      and delivery.scheduled_for <= now()
    order by delivery.scheduled_for, delivery.id
    limit greatest(1, least(coalesce(p_limit, 50), 200))
    for update of delivery skip locked
  )
  update public.push_campaign_deliveries delivery
  set status = 'processing',
      attempt_count = delivery.attempt_count + 1,
      claimed_at = now(),
      last_error = null
  from due, public.push_campaign_recipients recipient
  where delivery.id = due.id
    and recipient.id = delivery.recipient_id
  returning delivery.id, delivery.campaign_id, recipient.profile_id;
end;
$$;

revoke all on function public.bc_claim_push_campaign_deliveries(integer) from public, anon, authenticated;
grant execute on function public.bc_claim_push_campaign_deliveries(integer) to service_role;

create or replace function public.bc_create_push_campaign_notification(
  p_delivery_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  delivery public.push_campaign_deliveries%rowtype;
  campaign public.push_campaigns%rowtype;
  recipient public.push_campaign_recipients%rowtype;
  created_notification_id uuid;
  destination text;
begin
  if not public.is_service_role() then
    raise exception 'Service authorization is required.';
  end if;

  select * into delivery
  from public.push_campaign_deliveries
  where id = p_delivery_id
  for update;

  if delivery.id is null then
    raise exception 'Campaign delivery not found.';
  end if;
  if delivery.status <> 'processing' then
    return delivery.notification_id;
  end if;
  if delivery.notification_id is not null then
    return delivery.notification_id;
  end if;

  select * into campaign from public.push_campaigns where id = delivery.campaign_id;
  select * into recipient from public.push_campaign_recipients where id = delivery.recipient_id;

  destination := case
    when campaign.campaign_type = 'promote_worker'
      then '/employer/workers/' || campaign.promoted_worker_profile_id::text
        || '?campaign_id=' || campaign.id::text
    when recipient.role = 'worker'
      then coalesce(campaign.worker_destination, '/worker/home')
    else coalesce(campaign.employer_destination, '/employer/home')
  end;

  insert into public.notifications (
    profile_id,
    type,
    title,
    body,
    data,
    dedupe_key
  ) values (
    recipient.profile_id,
    'push_campaign',
    campaign.title,
    campaign.body,
    jsonb_build_object(
      'url', destination,
      'campaign_id', campaign.id,
      'campaign_delivery_id', delivery.id,
      'campaign_type', campaign.campaign_type,
      'promoted_worker_profile_id', campaign.promoted_worker_profile_id
    ),
    'push_campaign:' || delivery.id::text
  )
  on conflict (profile_id, dedupe_key) where dedupe_key is not null
  do nothing
  returning id into created_notification_id;

  if created_notification_id is null then
    select id into created_notification_id
    from public.notifications
    where profile_id = recipient.profile_id
      and dedupe_key = 'push_campaign:' || delivery.id::text;
  end if;

  update public.push_campaign_deliveries
  set notification_id = created_notification_id
  where id = delivery.id;

  return created_notification_id;
end;
$$;

revoke all on function public.bc_create_push_campaign_notification(uuid) from public, anon, authenticated;
grant execute on function public.bc_create_push_campaign_notification(uuid) to service_role;

create or replace function public.bc_finalize_push_campaign_delivery(
  p_delivery_id uuid,
  p_status public.push_campaign_delivery_status,
  p_last_error text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  delivery public.push_campaign_deliveries%rowtype;
begin
  if not public.is_service_role() then
    raise exception 'Service authorization is required.';
  end if;
  if p_status not in ('sent', 'failed') then
    raise exception 'Campaign delivery can only be finalized as sent or failed.';
  end if;

  select * into delivery
  from public.push_campaign_deliveries
  where id = p_delivery_id
  for update;

  if delivery.id is null or delivery.status <> 'processing' then
    return;
  end if;

  update public.push_campaign_deliveries
  set status = p_status,
      sent_at = case when p_status = 'sent' then now() else null end,
      last_error = left(p_last_error, 500)
  where id = delivery.id;

  if p_status = 'sent' then
    update public.push_campaigns
    set sent_count = sent_count + 1
    where id = delivery.campaign_id;
  else
    update public.push_campaigns
    set failed_count = failed_count + 1
    where id = delivery.campaign_id;
  end if;

  if not exists (
    select 1
    from public.push_campaign_deliveries pending
    where pending.campaign_id = delivery.campaign_id
      and pending.status in ('pending', 'processing')
  ) then
    update public.push_campaigns
    set status = 'completed'
    where id = delivery.campaign_id
      and status = 'active';
  end if;
end;
$$;

revoke all on function public.bc_finalize_push_campaign_delivery(
  uuid, public.push_campaign_delivery_status, text
) from public, anon, authenticated;
grant execute on function public.bc_finalize_push_campaign_delivery(
  uuid, public.push_campaign_delivery_status, text
) to service_role;

create or replace function public.bc_pause_push_campaign(p_campaign_id uuid)
returns public.push_campaign_status
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare next_status public.push_campaign_status;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Admin authorization is required.'; end if;
  update public.push_campaigns
  set status = 'paused'
  where id = p_campaign_id and status in ('scheduled', 'active')
  returning status into next_status;
  if next_status is null then raise exception 'Only scheduled or active campaigns can be paused.'; end if;
  return next_status;
end;
$$;

create or replace function public.bc_resume_push_campaign(p_campaign_id uuid)
returns public.push_campaign_status
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare next_status public.push_campaign_status;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Admin authorization is required.'; end if;
  update public.push_campaigns
  set status = case when ends_at <= now() then 'completed' else 'active' end
  where id = p_campaign_id and status = 'paused'
  returning status into next_status;
  if next_status is null then raise exception 'Only paused campaigns can be resumed.'; end if;
  return next_status;
end;
$$;

create or replace function public.bc_cancel_push_campaign(p_campaign_id uuid)
returns public.push_campaign_status
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare next_status public.push_campaign_status;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Admin authorization is required.'; end if;
  update public.push_campaigns
  set status = 'cancelled'
  where id = p_campaign_id and status not in ('completed', 'cancelled')
  returning status into next_status;
  if next_status is null then raise exception 'This campaign cannot be cancelled.'; end if;
  return next_status;
end;
$$;

create or replace function public.bc_duplicate_push_campaign(p_campaign_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  source_campaign public.push_campaigns%rowtype;
  duplicate_id uuid;
  estimate record;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Admin authorization is required.'; end if;
  select * into source_campaign from public.push_campaigns where id = p_campaign_id;
  if source_campaign.id is null then raise exception 'Campaign not found.'; end if;

  select * into estimate
  from public.bc_preview_push_campaign_audience(
    source_campaign.target,
    source_campaign.campaign_type,
    source_campaign.audience_percentage,
    source_campaign.county,
    source_campaign.specialty_id,
    source_campaign.specialty_scope,
    source_campaign.promoted_worker_profile_id
  );

  insert into public.push_campaigns (
    created_by, title, body, target, campaign_type, audience_mode,
    audience_percentage, audience_estimated_count, audience_selected_count,
    campaign_period_days, sends_per_recipient, starts_at, ends_at,
    delivery_window_start, delivery_window_end, delivery_timezone, county,
    specialty_id, specialty_scope, promoted_worker_profile_id, worker_destination, employer_destination
  ) values (
    auth.uid(), source_campaign.title, source_campaign.body, source_campaign.target,
    source_campaign.campaign_type, source_campaign.audience_mode,
    source_campaign.audience_percentage, estimate.eligible_count, estimate.selected_count,
    source_campaign.campaign_period_days, source_campaign.sends_per_recipient,
    now(), now() + make_interval(days => source_campaign.campaign_period_days),
    source_campaign.delivery_window_start, source_campaign.delivery_window_end,
    source_campaign.delivery_timezone, source_campaign.county, source_campaign.specialty_id,
    source_campaign.specialty_scope,
    source_campaign.promoted_worker_profile_id, source_campaign.worker_destination,
    source_campaign.employer_destination
  ) returning id into duplicate_id;
  return duplicate_id;
end;
$$;

revoke all on function public.bc_pause_push_campaign(uuid) from public, anon;
revoke all on function public.bc_resume_push_campaign(uuid) from public, anon;
revoke all on function public.bc_cancel_push_campaign(uuid) from public, anon;
revoke all on function public.bc_duplicate_push_campaign(uuid) from public, anon;
grant execute on function public.bc_pause_push_campaign(uuid) to authenticated;
grant execute on function public.bc_resume_push_campaign(uuid) to authenticated;
grant execute on function public.bc_cancel_push_campaign(uuid) to authenticated;
grant execute on function public.bc_duplicate_push_campaign(uuid) to authenticated;

create or replace function public.bc_get_push_campaign_analytics(p_campaign_id uuid)
returns table(
  intended_audience bigint,
  scheduled_recipients bigint,
  sent bigint,
  delivered bigint,
  failed bigint,
  profile_visits bigint,
  opened bigint,
  clicked bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'Admin authorization is required.'; end if;
  return query
  select
    campaign.audience_selected_count::bigint,
    (select count(*) from public.push_campaign_recipients recipient where recipient.campaign_id = campaign.id),
    (select count(*) from public.push_campaign_deliveries delivery where delivery.campaign_id = campaign.id and delivery.status = 'sent'),
    (select count(*) from public.push_campaign_deliveries delivery where delivery.campaign_id = campaign.id and delivery.status = 'sent'),
    (select count(*) from public.push_campaign_deliveries delivery where delivery.campaign_id = campaign.id and delivery.status = 'failed'),
    (select count(distinct visit.employer_profile_id) from public.push_campaign_profile_visits visit where visit.campaign_id = campaign.id),
    (select count(*) from public.notifications notification where notification.data ->> 'campaign_id' = campaign.id::text and notification.read_at is not null),
    (select count(*) from public.notifications notification where notification.data ->> 'campaign_id' = campaign.id::text and notification.read_at is not null)
  from public.push_campaigns campaign
  where campaign.id = p_campaign_id;
end;
$$;

revoke all on function public.bc_get_push_campaign_analytics(uuid) from public, anon;
grant execute on function public.bc_get_push_campaign_analytics(uuid) to authenticated;
