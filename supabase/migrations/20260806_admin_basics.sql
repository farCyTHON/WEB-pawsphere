begin;

-- Soft-hide listings instead of deleting pets.
alter table public.pets
  add column if not exists is_hidden boolean not null default false;

create index if not exists pets_is_hidden_idx
on public.pets (is_hidden)
where is_hidden = true;

-- Platform settings (single-row config).
create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  platform_name text not null default 'PawSphere',
  contact_email text not null default 'support@pawsphere.bd',
  maintenance_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, platform_name, contact_email, maintenance_mode)
values (1, 'PawSphere', 'support@pawsphere.bd', false)
on conflict (id) do nothing;

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select_authenticated" on public.app_settings;
drop policy if exists "app_settings_select_admin" on public.app_settings;
create policy "app_settings_select_admin"
on public.app_settings for select
to authenticated
using (public.is_admin());

drop policy if exists "app_settings_update_admin" on public.app_settings;
create policy "app_settings_update_admin"
on public.app_settings for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke all on public.app_settings from anon;
grant select on public.app_settings to authenticated;
grant update on public.app_settings to authenticated;

-- Hide soft-hidden pets from public browse RPCs.
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
    and p.is_hidden = false
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
    and p.is_hidden = false
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
    and p.is_hidden = false
  order by p.created_at desc
  limit greatest(1, least(result_limit, 12));
$$;

-- Admin can list every adoption application.
create or replace function public.get_admin_applications()
returns table (
  id uuid,
  pet_id uuid,
  owner_id uuid,
  shelter_id uuid,
  status text,
  remarks text,
  housing_type text,
  has_yard boolean,
  other_pets text,
  adoption_experience text,
  notes text,
  created_at timestamptz,
  pet_name text,
  pet_image text,
  shelter_name text,
  applicant_name text,
  applicant_email text,
  applicant_phone text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  select
    a.id, a.pet_id, a.owner_id, a.shelter_id, a.status, a.remarks,
    a.housing_type, a.has_yard, a.other_pets, a.adoption_experience,
    a.notes, a.created_at, p.name, p.image_url, s.shelter_name,
    owner.full_name, owner.email, owner.phone
  from public.adoption_applications a
  join public.pets p on p.id = a.pet_id
  join public.shelters s on s.id = a.shelter_id
  join public.profiles owner on owner.id = a.owner_id
  order by a.created_at desc;
end;
$$;

revoke all on function public.get_admin_applications() from public;
grant execute on function public.get_admin_applications() to authenticated;

-- Hide soft-hidden pets from new adoption applications.
create or replace function public.can_apply_for_pet(
  target_pet_id uuid,
  target_shelter_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.pets
    where id = target_pet_id
      and shelter_id = target_shelter_id
      and lower(status) = 'available'
      and is_hidden = false
  );
$$;

commit;
