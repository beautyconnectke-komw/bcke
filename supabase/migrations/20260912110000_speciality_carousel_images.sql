alter table public.categories
  add column if not exists image_path text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'categories_image_path_length'
  ) then
    alter table public.categories
      add constraint categories_image_path_length
      check (image_path is null or char_length(image_path) between 1 and 500);
  end if;
end;
$$;

insert into storage.buckets (id, name, public)
values ('speciality-images', 'speciality-images', true)
on conflict (id) do nothing;

create policy "Public speciality images are readable"
on storage.objects for select
using (bucket_id = 'speciality-images');

create policy "Admins can manage speciality images"
on storage.objects for all
to authenticated
using (bucket_id = 'speciality-images' and public.is_admin(auth.uid()))
with check (bucket_id = 'speciality-images' and public.is_admin(auth.uid()));

create or replace function public.bc_get_speciality_carousel()
returns setof public.categories
language sql
stable
security definer
set search_path = public
as $$
  select categories.*
  from public.categories
  left join (
    select
      worker_profiles.category_id,
      count(employer_requests.id)::integer as request_count
    from public.worker_profiles
    join public.employer_requests
      on employer_requests.worker_profile_id = worker_profiles.id
    where worker_profiles.verification_status = 'approved'
      and worker_profiles.is_suspended = false
    group by worker_profiles.category_id
  ) demand on demand.category_id = categories.id
  where categories.is_active = true
  order by
    coalesce(demand.request_count, 0) desc,
    categories.display_order asc,
    categories.name asc
  limit 200;
$$;

revoke execute on function public.bc_get_speciality_carousel() from public;
grant execute on function public.bc_get_speciality_carousel() to anon, authenticated;
