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

drop policy if exists "Workers can view employers that requested them"
on public.employer_profiles;

create policy "Workers can view employers that requested them"
on public.employer_profiles for select
using (public.worker_can_view_employer_profile(id));
