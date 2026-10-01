begin;

alter table public.pets
  add column if not exists personality text[] not null default '{}';

alter table public.pets
  add column if not exists image_urls text[] not null default '{}';

create or replace function public.get_available_pets(
  search_query text default null,
  species_filter text default null,
  gender_filter text default null,
  vaccinated_filter boolean default null,
  min_age numeric default null,
  max_age numeric default null,
  page_number integer default 1,
  page_size integer default 12
)
returns table (
  id uuid,
  name text,
  species text,
  breed text,
  age numeric,
  gender text,
  vaccinated boolean,
  health_notes text,
  status text,
  image_url text,
  image_urls text[],
  personality text[],
  shelter_id uuid,
  shelter_name text,
  shelter_address text,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.name,
    p.species,
    p.breed,
    p.age,
    p.gender,
    p.vaccinated,
    p.health_notes,
    p.status,
    p.image_url,
    p.image_urls,
    p.personality,
    p.shelter_id,
    s.shelter_name,
    s.address as shelter_address,
    count(*) over() as total_count
  from public.pets p
  join public.shelters s on s.id = p.shelter_id
  where lower(p.status) = 'available'
    and (
      search_query is null
      or p.name ilike '%' || search_query || '%'
      or p.breed ilike '%' || search_query || '%'
    )
    and (species_filter is null or p.species = species_filter)
    and (gender_filter is null or p.gender = gender_filter)
    and (vaccinated_filter is null or p.vaccinated = vaccinated_filter)
    and (min_age is null or p.age >= min_age)
    and (max_age is null or p.age <= max_age)
  order by p.created_at desc
  limit greatest(1, least(page_size, 50))
  offset greatest(0, page_number - 1) * greatest(1, least(page_size, 50));
$$;

create or replace function public.get_public_pet(pet_id uuid)
returns table (
  id uuid,
  name text,
  species text,
  breed text,
  age numeric,
  gender text,
  vaccinated boolean,
  health_notes text,
  status text,
  image_url text,
  image_urls text[],
  personality text[],
  shelter_id uuid,
  shelter_name text,
  shelter_address text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.name,
    p.species,
    p.breed,
    p.age,
    p.gender,
    p.vaccinated,
    p.health_notes,
    p.status,
    p.image_url,
    p.image_urls,
    p.personality,
    p.shelter_id,
    s.shelter_name,
    s.address as shelter_address
  from public.pets p
  join public.shelters s on s.id = p.shelter_id
  where p.id = pet_id
    and lower(p.status) = 'available'
  limit 1;
$$;

create or replace function public.get_related_pets(
  current_pet_id uuid,
  species_filter text,
  result_limit integer default 4
)
returns table (
  id uuid,
  name text,
  species text,
  breed text,
  age numeric,
  gender text,
  vaccinated boolean,
  health_notes text,
  status text,
  image_url text,
  image_urls text[],
  personality text[],
  shelter_id uuid,
  shelter_name text,
  shelter_address text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.name,
    p.species,
    p.breed,
    p.age,
    p.gender,
    p.vaccinated,
    p.health_notes,
    p.status,
    p.image_url,
    p.image_urls,
    p.personality,
    p.shelter_id,
    s.shelter_name,
    s.address as shelter_address
  from public.pets p
  join public.shelters s on s.id = p.shelter_id
  where p.id <> current_pet_id
    and p.species = species_filter
    and lower(p.status) = 'available'
  order by p.created_at desc
  limit greatest(1, least(result_limit, 12));
$$;

revoke all on function public.get_available_pets(text, text, text, boolean, numeric, numeric, integer, integer) from public;
revoke all on function public.get_public_pet(uuid) from public;
revoke all on function public.get_related_pets(uuid, text, integer) from public;

grant execute on function public.get_available_pets(text, text, text, boolean, numeric, numeric, integer, integer) to anon, authenticated;
grant execute on function public.get_public_pet(uuid) to anon, authenticated;
grant execute on function public.get_related_pets(uuid, text, integer) to anon, authenticated;

commit;
