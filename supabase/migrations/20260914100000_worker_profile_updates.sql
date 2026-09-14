do $$
begin
  create type public.worker_profile_update_status as enum (
    'pending',
    'approved',
    'rejected'
  );
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.worker_profile_updates (
  id uuid primary key default gen_random_uuid(),
  worker_profile_id uuid not null references public.worker_profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  profile_photo_path text,
  extra_specialty_ids uuid[] not null default '{}',
  portfolio_paths text[],
  status public.worker_profile_update_status not null default 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worker_profile_updates_extra_specialties_limit check (
    cardinality(extra_specialty_ids) <= 12
  ),
  constraint worker_profile_updates_portfolio_limit check (
    portfolio_paths is null or cardinality(portfolio_paths) <= 4
  )
);

create trigger set_worker_profile_updates_updated_at
before update on public.worker_profile_updates
for each row execute function public.set_updated_at();

create unique index if not exists worker_profile_updates_one_pending
on public.worker_profile_updates (worker_profile_id)
where status = 'pending';

create index if not exists worker_profile_updates_status_created_idx
on public.worker_profile_updates (status, created_at desc);

alter table public.worker_profile_updates enable row level security;

drop policy if exists "Workers can view their own profile updates"
  on public.worker_profile_updates;
create policy "Workers can view their own profile updates"
on public.worker_profile_updates for select
using (
  exists (
    select 1
    from public.worker_profiles worker
    where worker.id = worker_profile_updates.worker_profile_id
      and worker.profile_id = auth.uid()
  )
);

drop policy if exists "Admins can manage worker profile updates"
  on public.worker_profile_updates;
create policy "Admins can manage worker profile updates"
on public.worker_profile_updates for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

grant select on public.worker_profile_updates to authenticated;

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
      'worker_profile_update_id', update_id
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
      'worker_profile_update_id', update_record.id
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
      'worker_profile_update_id', update_record.id
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

revoke all on function public.bc_submit_worker_reviewed_profile(
  uuid, uuid, text, uuid[], text[]
) from public;
grant execute on function public.bc_submit_worker_reviewed_profile(
  uuid, uuid, text, uuid[], text[]
) to authenticated;

revoke all on function public.bc_approve_worker_profile_update(uuid) from public;
grant execute on function public.bc_approve_worker_profile_update(uuid)
  to authenticated;

revoke all on function public.bc_reject_worker_profile_update(uuid, text)
  from public;
grant execute on function public.bc_reject_worker_profile_update(uuid, text)
  to authenticated;
