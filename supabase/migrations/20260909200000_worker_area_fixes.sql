alter table public.worker_profiles
  add column if not exists experience_started_at timestamptz;

update public.worker_profiles
set experience_started_at = created_at
where experience_started_at is null;

create index if not exists worker_profiles_experience_started_idx
on public.worker_profiles (experience_started_at);

create or replace function public.bc_submit_worker_application(
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
  p_commission_expectation numeric default null,
  p_county text default null,
  p_town text default null,
  p_experience_months integer default 0,
  p_extra_specialty_ids uuid[] default '{}',
  p_portfolio_paths text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  worker_id uuid;
  next_display_order integer;
  portfolio_index integer;
begin
  if exists (
    select 1
    from public.worker_profiles
    where profile_id = auth.uid()
      and verification_status in ('pending_review', 'approved')
  ) then
    raise exception 'This worker profile is locked while it is under review or approved.';
  end if;

  worker_id := public.bc_create_worker_application(
    p_full_name,
    p_phone,
    p_location,
    p_category_id,
    p_profile_photo_path,
    p_years_experience,
    p_short_bio,
    p_work_experience,
    p_skills,
    p_compensation_model,
    p_salary_expectation,
    p_commission_expectation
  );

  perform set_config('app.beauty_connect_internal', 'on', true);
  update public.worker_profiles
  set county = p_county,
      town = p_town,
      experience_months = p_experience_months,
      extra_specialty_ids = coalesce(p_extra_specialty_ids, '{}'),
      experience_started_at = coalesce(experience_started_at, now())
  where id = worker_id;

  select coalesce(max(display_order), 0) + 1
  into next_display_order
  from public.worker_portfolio
  where worker_profile_id = worker_id;

  for portfolio_index in 1..coalesce(array_length(p_portfolio_paths, 1), 0) loop
    if split_part(p_portfolio_paths[portfolio_index], '/', 1) <> auth.uid()::text then
      raise exception 'Portfolio images must belong to the authenticated user.';
    end if;

    insert into public.worker_portfolio (
      worker_profile_id,
      storage_path,
      display_order
    ) values (
      worker_id,
      p_portfolio_paths[portfolio_index],
      next_display_order + portfolio_index - 1
    );
  end loop;

  return worker_id;
end;
$$;

revoke execute on function public.bc_submit_worker_application(
  text, text, text, uuid, text, integer, text, text, text[],
  public.compensation_model, numeric, numeric, text, text, integer, uuid[], text[]
) from public;
grant execute on function public.bc_submit_worker_application(
  text, text, text, uuid, text, integer, text, text, text[],
  public.compensation_model, numeric, numeric, text, text, integer, uuid[], text[]
) to authenticated;

revoke execute on function public.bc_create_worker_application(
  text, text, text, uuid, text, integer, text, text, text[],
  public.compensation_model, numeric, numeric
) from authenticated;

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
  worker_owner_id uuid;
  portfolio_index integer;
begin
  select profile_id
  into worker_owner_id
  from public.worker_profiles
  where id = p_worker_profile_id
    and profile_id = auth.uid()
    and verification_status = 'approved';

  if worker_owner_id is null then
    raise exception 'Only an approved worker can submit reviewed profile changes.';
  end if;

  if p_profile_photo_path is not null
    and split_part(p_profile_photo_path, '/', 1) <> auth.uid()::text then
    raise exception 'The profile image must belong to the authenticated user.';
  end if;

  for portfolio_index in 1..coalesce(array_length(p_portfolio_paths, 1), 0) loop
    if split_part(p_portfolio_paths[portfolio_index], '/', 1) <> auth.uid()::text then
      raise exception 'Portfolio images must belong to the authenticated user.';
    end if;
  end loop;

  perform set_config('app.beauty_connect_internal', 'on', true);
  update public.worker_profiles
  set category_id = p_category_id,
      profile_photo_path = coalesce(p_profile_photo_path, profile_photo_path),
      extra_specialty_ids = coalesce(p_extra_specialty_ids, '{}'),
      verification_status = 'pending_review'
  where id = p_worker_profile_id;

  if coalesce(array_length(p_portfolio_paths, 1), 0) > 0 then
    delete from public.worker_portfolio
    where worker_profile_id = p_worker_profile_id;

    for portfolio_index in 1..array_length(p_portfolio_paths, 1) loop
      insert into public.worker_portfolio (
        worker_profile_id,
        storage_path,
        display_order
      ) values (
        p_worker_profile_id,
        p_portfolio_paths[portfolio_index],
        portfolio_index
      );
    end loop;
  end if;

  perform public.create_notification(
    auth.uid(),
    'application_submitted',
    'Profile changes submitted',
    'Your reviewed profile changes are waiting for admin review.',
    jsonb_build_object('worker_profile_id', p_worker_profile_id)
  );

  return p_worker_profile_id;
end;
$$;

revoke execute on function public.bc_submit_worker_reviewed_profile(
  uuid, uuid, text, uuid[], text[]
) from public;
grant execute on function public.bc_submit_worker_reviewed_profile(
  uuid, uuid, text, uuid[], text[]
) to authenticated;

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

  if tg_op = 'UPDATE'
    and old.verification_status not in ('draft', 'rejected')
    and (
      new.profile_id is distinct from old.profile_id
      or new.full_name is distinct from old.full_name
      or new.location is distinct from old.location
      or new.category_id is distinct from old.category_id
      or new.profile_photo_path is distinct from old.profile_photo_path
      or new.years_experience is distinct from old.years_experience
      or new.experience_months is distinct from old.experience_months
      or new.experience_started_at is distinct from old.experience_started_at
      or new.work_experience is distinct from old.work_experience
      or new.skills is distinct from old.skills
      or new.extra_specialty_ids is distinct from old.extra_specialty_ids
      or new.compensation_model is distinct from old.compensation_model
      or new.salary_expectation is distinct from old.salary_expectation
      or new.commission_expectation is distinct from old.commission_expectation
    )
    and not internal_operation
    and not public.is_admin(auth.uid())
    and not public.is_service_role()
  then
    raise exception 'This profile change requires admin review.';
  end if;

  if new.verification_status <> 'approved' and new.availability_status = 'matched' then
    raise exception 'Only approved workers can be marked as matched.';
  end if;

  return new;
end;
$$;

drop policy if exists "Workers can manage their own portfolio"
  on public.worker_portfolio;
drop policy if exists "Workers can view their own portfolio"
  on public.worker_portfolio;
create policy "Workers can view their own portfolio"
on public.worker_portfolio for select
using (
  exists (
    select 1
    from public.worker_profiles worker
    where worker.id = worker_portfolio.worker_profile_id
      and worker.profile_id = auth.uid()
  )
);

create policy "Workers can manage draft portfolio"
on public.worker_portfolio for all
using (
  exists (
    select 1
    from public.worker_profiles worker
    where worker.id = worker_portfolio.worker_profile_id
      and worker.profile_id = auth.uid()
      and worker.verification_status in ('draft', 'rejected')
  )
)
with check (
  exists (
    select 1
    from public.worker_profiles worker
    where worker.id = worker_portfolio.worker_profile_id
      and worker.profile_id = auth.uid()
      and worker.verification_status in ('draft', 'rejected')
  )
);

drop view if exists public.public_worker_profiles;
create view public.public_worker_profiles as
select
  wp.id,
  wp.full_name,
  wp.location,
  wp.profile_photo_path,
  wp.category_id,
  c.name as category_name,
  c.slug as category_slug,
  floor((
    wp.years_experience * 12
    + wp.experience_months
    + greatest(
      0,
      date_part('year', age(now(), coalesce(wp.experience_started_at, wp.created_at)))::integer * 12
      + date_part('month', age(now(), coalesce(wp.experience_started_at, wp.created_at)))::integer
    )
  ) / 12)::integer as years_experience,
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
  mod(
    wp.years_experience * 12
    + wp.experience_months
    + greatest(
      0,
      date_part('year', age(now(), coalesce(wp.experience_started_at, wp.created_at)))::integer * 12
      + date_part('month', age(now(), coalesce(wp.experience_started_at, wp.created_at)))::integer
    ),
    12
  )::integer as experience_months,
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

drop view if exists public.public_employer_profiles;
create view public.public_employer_profiles as
select
  ep.id,
  ep.business_name,
  ep.phone,
  ep.business_email,
  ep.description,
  ep.location,
  ep.address_line,
  ep.profile_image_path,
  ep.salon_info,
  ep.created_at,
  ep.updated_at
from public.employer_profiles ep
where ep.is_suspended = false;

grant select on public.public_worker_profiles to anon, authenticated;
grant select on public.public_employer_profiles to anon, authenticated;

drop policy if exists "Workers can view requested employer gallery"
  on public.employer_gallery;
create policy "Workers can view requested employer gallery"
on public.employer_gallery for select
using (
  exists (
    select 1
    from public.employer_requests request
    join public.worker_profiles worker on worker.id = request.worker_profile_id
    join public.employer_profiles employer on employer.id = request.employer_profile_id
    where request.employer_profile_id = employer_gallery.employer_profile_id
      and worker.profile_id = auth.uid()
      and employer.is_suspended = false
  )
);
