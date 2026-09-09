create table if not exists public.employer_gallery (
  id uuid primary key default gen_random_uuid(),
  employer_profile_id uuid not null references public.employer_profiles(id) on delete cascade,
  storage_bucket text not null default 'employer-images',
  storage_path text not null,
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employer_gallery_order_range check (display_order between 1 and 12),
  constraint employer_gallery_bucket check (storage_bucket = 'employer-images'),
  unique (employer_profile_id, display_order),
  unique (storage_bucket, storage_path)
);

create trigger set_employer_gallery_updated_at
before update on public.employer_gallery
for each row execute function public.set_updated_at();

create or replace function public.enforce_employer_gallery_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.employer_gallery
    where employer_profile_id = new.employer_profile_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) >= 12 then
    raise exception 'Employers can have a maximum of twelve salon images.';
  end if;

  return new;
end;
$$;

create trigger enforce_employer_gallery_limit
before insert or update on public.employer_gallery
for each row execute function public.enforce_employer_gallery_limit();

alter table public.employer_gallery enable row level security;

drop policy if exists "Employers can manage their own gallery"
  on public.employer_gallery;
create policy "Employers can manage their own gallery"
on public.employer_gallery for all
using (
  exists (
    select 1
    from public.employer_profiles employer
    where employer.id = employer_gallery.employer_profile_id
      and employer.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.employer_profiles employer
    where employer.id = employer_gallery.employer_profile_id
      and employer.profile_id = auth.uid()
  )
);

drop policy if exists "Admins can manage employer gallery"
  on public.employer_gallery;
create policy "Admins can manage employer gallery"
on public.employer_gallery for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
