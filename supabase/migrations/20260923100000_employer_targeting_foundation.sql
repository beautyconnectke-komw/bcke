-- Employer targeting foundation
--
-- Employer location and speciality values used to live in free-text fields.
-- Keep those fields intact while adding the same category-id shape already used
-- by worker_profiles. The legacy values below are migration evidence only;
-- future targeting must use county, town, category_id, and
-- extra_specialty_ids.

alter table public.employer_profiles
  add column if not exists county text,
  add column if not exists town text,
  add column if not exists category_id uuid references public.categories(id) on delete restrict,
  add column if not exists extra_specialty_ids uuid[] not null default '{}';

create or replace function public.bc_uuid_array_has_unique_non_null_values(
  p_values uuid[]
)
returns boolean
language sql
immutable
parallel safe
as $$
  select
    coalesce(cardinality(p_values), 0) = (
      select count(*)
      from (
        select distinct value
        from unnest(coalesce(p_values, '{}'::uuid[])) as values(value)
      ) distinct_values
    )
    and not exists (
      select 1
      from unnest(coalesce(p_values, '{}'::uuid[])) as values(value)
      where value is null
    );
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employer_profiles_county_supported'
      and conrelid = 'public.employer_profiles'::regclass
  ) then
    alter table public.employer_profiles
      add constraint employer_profiles_county_supported check (
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
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'employer_profiles_town_length'
      and conrelid = 'public.employer_profiles'::regclass
  ) then
    alter table public.employer_profiles
      add constraint employer_profiles_town_length check (
        town is null or char_length(town) between 2 and 120
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'employer_profiles_extra_specialties_limit'
      and conrelid = 'public.employer_profiles'::regclass
  ) then
    alter table public.employer_profiles
      add constraint employer_profiles_extra_specialties_limit check (
        cardinality(extra_specialty_ids) <= 12
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'employer_profiles_extra_specialties_unique'
      and conrelid = 'public.employer_profiles'::regclass
  ) then
    alter table public.employer_profiles
      add constraint employer_profiles_extra_specialties_unique check (
        public.bc_uuid_array_has_unique_non_null_values(extra_specialty_ids)
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'employer_profiles_main_specialty_not_extra'
      and conrelid = 'public.employer_profiles'::regclass
  ) then
    alter table public.employer_profiles
      add constraint employer_profiles_main_specialty_not_extra check (
        category_id is null or not (category_id = any(extra_specialty_ids))
      );
  end if;
end;
$$;

create index if not exists employer_profiles_targeting_county_idx
on public.employer_profiles (county, town)
where is_suspended = false;

create index if not exists employer_profiles_targeting_category_idx
on public.employer_profiles (category_id)
where is_suspended = false;

create index if not exists employer_profiles_targeting_extra_specialties_idx
on public.employer_profiles using gin (extra_specialty_ids)
where is_suspended = false;

create or replace function public.enforce_employer_specialty_catalogue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.category_id is not null and not exists (
    select 1 from public.categories where id = new.category_id
  ) then
    raise exception 'The employer main speciality must come from the speciality catalogue.';
  end if;

  if exists (
    select 1
    from unnest(coalesce(new.extra_specialty_ids, '{}'::uuid[])) as selected(category_id)
    where selected.category_id is null
       or not exists (
         select 1 from public.categories category
         where category.id = selected.category_id
       )
  ) then
    raise exception 'Every employer extra speciality must come from the speciality catalogue.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_employer_specialty_catalogue
  on public.employer_profiles;
create trigger enforce_employer_specialty_catalogue
before insert or update of category_id, extra_specialty_ids
on public.employer_profiles
for each row execute function public.enforce_employer_specialty_catalogue();

-- These two tables are admin-only migration reports. They do not participate
-- in audience targeting and are intentionally not used as a second source of
-- employer location or speciality data.
create table if not exists public.employer_specialty_migration_issues (
  employer_profile_id uuid primary key references public.employer_profiles(id) on delete cascade,
  source_field text not null default 'salon_info.services',
  source_value text not null,
  unmatched_values text[] not null,
  created_at timestamptz not null default now()
);

create table if not exists public.employer_location_migration_issues (
  employer_profile_id uuid primary key references public.employer_profiles(id) on delete cascade,
  source_location text,
  source_address_line text,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.employer_specialty_migration_issues enable row level security;
alter table public.employer_location_migration_issues enable row level security;

drop policy if exists "Admins can inspect employer specialty migration issues"
  on public.employer_specialty_migration_issues;
create policy "Admins can inspect employer specialty migration issues"
on public.employer_specialty_migration_issues for select
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can inspect employer location migration issues"
  on public.employer_location_migration_issues;
create policy "Admins can inspect employer location migration issues"
on public.employer_location_migration_issues for select
using (public.is_admin(auth.uid()));

create or replace function public.bc_normalize_legacy_specialty_label(
  p_label text
)
returns text
language sql
immutable
parallel safe
as $$
  select trim(regexp_replace(lower(coalesce(p_label, '')), '[^a-z0-9]+', ' ', 'g'));
$$;

create or replace function public.bc_legacy_specialty_category_id(
  p_label text
)
returns uuid
language plpgsql
stable
set search_path = public
as $$
declare
  normalized_label text := public.bc_normalize_legacy_specialty_label(p_label);
  matched_category_ids uuid[];
  matched_category_id uuid;
begin
  if normalized_label = '' then
    return null;
  end if;

  -- Exact catalogue name/slug matches are preferred. The aliases below are
  -- deliberately narrow: they cover common legacy shorthand without guessing
  -- that an arbitrary service description is a speciality.
  -- PostgreSQL has no min(uuid) aggregate. Collect the candidates instead
  -- so an exact match is accepted only when it resolves to one catalogue row.
  select array_agg(category.id order by category.id)
  into matched_category_ids
  from public.categories category
  where public.bc_normalize_legacy_specialty_label(category.name) = normalized_label
     or public.bc_normalize_legacy_specialty_label(category.slug) = normalized_label
  ;

  if cardinality(matched_category_ids) = 1 then
    return matched_category_ids[1];
  end if;

  select category.id
  into matched_category_id
  from public.categories category
  where category.slug = case normalized_label
    when 'hair' then 'hair-stylist'
    when 'nail' then 'nail-technician'
    when 'nails' then 'nail-technician'
    when 'lash' then 'lash-technician'
    when 'lashes' then 'lash-technician'
    when 'makeup' then 'makeup-artist'
    when 'braid' then 'braider'
    when 'braids' then 'braider'
    when 'hair braiding' then 'braider'
    else null
  end
  limit 1;

  return matched_category_id;
end;
$$;

-- Preserve the old location verbatim. Only an exact county label (optionally
-- followed by the word "county") is safe enough to migrate automatically;
-- town is intentionally left for employer confirmation.
with supported_counties(county) as (
  values
    ('Baringo'), ('Bomet'), ('Bungoma'), ('Busia'), ('Elgeyo-Marakwet'),
    ('Embu'), ('Garissa'), ('Homa Bay'), ('Isiolo'), ('Kajiado'),
    ('Kakamega'), ('Kericho'), ('Kiambu'), ('Kilifi'), ('Kirinyaga'),
    ('Kisii'), ('Kisumu'), ('Kitui'), ('Kwale'), ('Laikipia'), ('Lamu'),
    ('Machakos'), ('Makueni'), ('Mandera'), ('Marsabit'), ('Meru'),
    ('Migori'), ('Mombasa'), ('Murang''a'), ('Nairobi'), ('Nakuru'),
    ('Nandi'), ('Narok'), ('Nyamira'), ('Nyandarua'), ('Nyeri'),
    ('Samburu'), ('Siaya'), ('Taita-Taveta'), ('Tana River'),
    ('Tharaka-Nithi'), ('Trans Nzoia'), ('Turkana'), ('Uasin Gishu'),
    ('Vihiga'), ('Wajir'), ('West Pokot')
)
update public.employer_profiles employer
set county = supported_counties.county
from supported_counties
where employer.county is null
  and lower(trim(employer.location)) in (
    lower(supported_counties.county),
    lower(supported_counties.county || ' county')
  );

-- Backfill only recognized tokens from the legacy comma-separated services
-- value. The original JSON value is deliberately not changed. Since the old
-- field had no primary marker, the first recognized token becomes the main
-- speciality and the remaining distinct recognized tokens become extras.
with legacy as (
  select
    employer.id,
    employer.salon_info ->> 'services' as services
  from public.employer_profiles employer
  where jsonb_typeof(employer.salon_info -> 'services') = 'string'
    and nullif(trim(employer.salon_info ->> 'services'), '') is not null
), tokens as (
  select legacy.id, trim(token.value) as raw_value, token.ordinality
  from legacy
  cross join lateral regexp_split_to_table(legacy.services, '\s*,\s*')
    with ordinality as token(value, ordinality)
  where nullif(trim(token.value), '') is not null
), mapped as (
  select
    tokens.id,
    tokens.raw_value,
    tokens.ordinality,
    public.bc_legacy_specialty_category_id(tokens.raw_value) as category_id
  from tokens
), recognized_first as (
  select distinct on (id, category_id)
    id,
    category_id,
    ordinality
  from mapped
  where category_id is not null
  order by id, category_id, ordinality
), ranked as (
  select
    id,
    category_id,
    row_number() over (partition by id order by ordinality, category_id) as specialty_rank
  from recognized_first
), grouped as (
  select
    id,
    (array_agg(category_id order by specialty_rank))[1] as main_category_id,
    coalesce(
      array_agg(category_id order by specialty_rank)
        filter (where specialty_rank > 1),
      '{}'::uuid[]
    ) as extra_category_ids
  from ranked
  group by id
)
update public.employer_profiles employer
set category_id = grouped.main_category_id,
    extra_specialty_ids = grouped.extra_category_ids
from grouped
where employer.id = grouped.id
  and employer.category_id is null
  and cardinality(employer.extra_specialty_ids) = 0;

-- Persist every unmatched token for an admin to review. Recognized tokens are
-- still retained in structured fields, while the complete original string
-- remains in employer_profiles.salon_info.services.
with legacy as (
  select
    employer.id,
    employer.salon_info ->> 'services' as services
  from public.employer_profiles employer
  where jsonb_typeof(employer.salon_info -> 'services') = 'string'
    and nullif(trim(employer.salon_info ->> 'services'), '') is not null
), tokens as (
  select legacy.id, trim(token.value) as raw_value, token.ordinality
  from legacy
  cross join lateral regexp_split_to_table(legacy.services, '\s*,\s*')
    with ordinality as token(value, ordinality)
  where nullif(trim(token.value), '') is not null
), mapped as (
  select
    tokens.id,
    tokens.raw_value,
    tokens.ordinality,
    public.bc_legacy_specialty_category_id(tokens.raw_value) as category_id
  from tokens
), unmatched as (
  select
    id,
    array_agg(raw_value order by ordinality) filter (where category_id is null) as unmatched_values
  from mapped
  group by id
)
insert into public.employer_specialty_migration_issues (
  employer_profile_id,
  source_value,
  unmatched_values
)
select
  legacy.id,
  legacy.services,
  unmatched.unmatched_values
from unmatched
join legacy on legacy.id = unmatched.id
where cardinality(unmatched.unmatched_values) > 0
on conflict (employer_profile_id) do update
set source_value = excluded.source_value,
    unmatched_values = excluded.unmatched_values;

-- A null structured county/town is intentional when the old location was
-- ambiguous. This table makes those records explicit for staging review while
-- retaining the old location and address columns as the source evidence.
insert into public.employer_location_migration_issues (
  employer_profile_id,
  source_location,
  source_address_line,
  reason
)
select
  employer.id,
  employer.location,
  employer.address_line,
  'No exact supported-county match; county/town require employer confirmation.'
from public.employer_profiles employer
where employer.town is null
  and (employer.location is not null or employer.address_line is not null)
on conflict (employer_profile_id) do update
set source_location = excluded.source_location,
    source_address_line = excluded.source_address_line,
    reason = excluded.reason;

-- Replace the RPC with the structured fields. The legacy overload is revoked
-- below so callers cannot continue writing only free-text employer data.
create or replace function public.bc_create_employer_profile(
  p_business_name text,
  p_contact_person text default null,
  p_phone text default null,
  p_business_email text default null,
  p_description text default null,
  p_location text default null,
  p_address_line text default null,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_profile_image_path text default null,
  p_salon_info jsonb default '{}'::jsonb,
  p_county text default null,
  p_town text default null,
  p_category_id uuid default null,
  p_extra_specialty_ids uuid[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_role public.profile_role;
  employer_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_county is null or p_town is null or p_category_id is null then
    raise exception 'County, town, and main speciality are required for an employer profile.';
  end if;

  select role into existing_role
  from public.profiles
  where id = current_user_id;

  if existing_role is not null and existing_role <> 'employer' then
    raise exception 'This account is already registered as %.', existing_role;
  end if;

  insert into public.profiles (id, role, display_name, phone)
  values (current_user_id, 'employer', p_business_name, p_phone)
  on conflict (id) do update
    set display_name = excluded.display_name,
        phone = excluded.phone;

  insert into public.employer_profiles (
    profile_id,
    business_name,
    contact_person,
    phone,
    business_email,
    description,
    location,
    county,
    town,
    address_line,
    latitude,
    longitude,
    profile_image_path,
    salon_info,
    category_id,
    extra_specialty_ids
  )
  values (
    current_user_id,
    p_business_name,
    p_contact_person,
    p_phone,
    p_business_email,
    p_description,
    p_location,
    p_county,
    p_town,
    p_address_line,
    p_latitude,
    p_longitude,
    p_profile_image_path,
    coalesce(p_salon_info, '{}'::jsonb),
    p_category_id,
    coalesce(p_extra_specialty_ids, '{}'::uuid[])
  )
  on conflict (profile_id) do update
    set business_name = excluded.business_name,
        contact_person = excluded.contact_person,
        phone = excluded.phone,
        business_email = excluded.business_email,
        description = excluded.description,
        location = excluded.location,
        county = excluded.county,
        town = excluded.town,
        address_line = excluded.address_line,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        profile_image_path = excluded.profile_image_path,
        salon_info = excluded.salon_info,
        category_id = excluded.category_id,
        extra_specialty_ids = excluded.extra_specialty_ids
  returning id into employer_id;

  return employer_id;
end;
$$;

revoke execute on function public.bc_create_employer_profile(
  text, text, text, text, text, text, text, numeric, numeric, text, jsonb
) from public, authenticated;
revoke execute on function public.bc_create_employer_profile(
  text, text, text, text, text, text, text, numeric, numeric, text, jsonb,
  text, text, uuid, uuid[]
) from public;
grant execute on function public.bc_create_employer_profile(
  text, text, text, text, text, text, text, numeric, numeric, text, jsonb,
  text, text, uuid, uuid[]
) to authenticated;

drop view if exists public.public_employer_profiles;
create view public.public_employer_profiles as
select
  employer.id,
  employer.business_name,
  employer.phone,
  employer.business_email,
  employer.description,
  employer.location,
  employer.county,
  employer.town,
  employer.address_line,
  employer.profile_image_path,
  employer.salon_info,
  employer.category_id,
  category.name as category_name,
  category.slug as category_slug,
  employer.extra_specialty_ids,
  coalesce(
    (
      select array_agg(extra_category.name order by extra_category.name)
      from public.categories extra_category
      where extra_category.id = any(employer.extra_specialty_ids)
    ),
    '{}'::text[]
  ) as extra_specialty_names,
  employer.created_at,
  employer.updated_at
from public.employer_profiles employer
left join public.categories category on category.id = employer.category_id
where employer.is_suspended = false;

grant select on public.public_employer_profiles to anon, authenticated;
