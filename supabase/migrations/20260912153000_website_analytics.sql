create table if not exists public.website_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  session_id text not null,
  path text not null,
  created_at timestamptz not null default now(),
  constraint website_visits_visitor_id_length check (char_length(visitor_id) between 16 and 128),
  constraint website_visits_session_id_length check (char_length(session_id) between 16 and 128),
  constraint website_visits_path_length check (char_length(path) between 1 and 512),
  constraint website_visits_path_format check (path like '/%')
);

create index if not exists website_visits_created_at_idx
on public.website_visits (created_at desc);

create index if not exists website_visits_visitor_created_idx
on public.website_visits (visitor_id, created_at desc);

alter table public.website_visits enable row level security;

drop policy if exists "Public can record website visits"
  on public.website_visits;
create policy "Public can record website visits"
on public.website_visits for insert
to anon, authenticated
with check (
  char_length(visitor_id) between 16 and 128
  and char_length(session_id) between 16 and 128
  and char_length(path) between 1 and 512
  and path like '/%'
);

drop policy if exists "Admins can view website visits"
  on public.website_visits;
create policy "Admins can view website visits"
on public.website_visits for select
to authenticated
using (public.is_admin(auth.uid()));

grant insert on public.website_visits to anon, authenticated;
grant select on public.website_visits to authenticated;
