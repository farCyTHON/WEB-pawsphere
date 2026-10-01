begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text not null,
  role text not null check (role in ('owner', 'shelter', 'vet', 'admin')),
  verification_status text not null default 'approved'
    check (verification_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shelters (
  id uuid primary key references public.profiles (id) on delete cascade,
  shelter_name text not null,
  address text not null,
  registration_number text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.veterinarians (
  id uuid primary key references public.profiles (id) on delete cascade,
  clinic_name text not null,
  specialty text not null,
  license_number text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing projects may already have tables with these names. CREATE TABLE IF
-- NOT EXISTS does not add missing columns, so make the expected auth schema
-- additive before installing the triggers.
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists verification_status text default 'approved';
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

alter table public.shelters add column if not exists shelter_name text;
alter table public.shelters add column if not exists address text;
alter table public.shelters add column if not exists registration_number text;
alter table public.shelters add column if not exists created_at timestamptz default now();
alter table public.shelters add column if not exists updated_at timestamptz default now();

alter table public.veterinarians add column if not exists clinic_name text;
alter table public.veterinarians add column if not exists specialty text;
alter table public.veterinarians add column if not exists license_number text;
alter table public.veterinarians add column if not exists created_at timestamptz default now();
alter table public.veterinarians add column if not exists updated_at timestamptz default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists shelters_set_updated_at on public.shelters;
create trigger shelters_set_updated_at
before update on public.shelters
for each row execute function public.set_updated_at();

drop trigger if exists veterinarians_set_updated_at on public.veterinarians;
create trigger veterinarians_set_updated_at
before update on public.veterinarians
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- SQL Editor / migrations run as postgres (no auth.uid()), so allow those
  -- sessions to bootstrap the first admin without a chicken-and-egg block.
  if session_user in ('postgres', 'supabase_admin')
     or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if (
    new.id is distinct from old.id
    or new.role is distinct from old.role
    or new.verification_status is distinct from old.verification_status
  ) and not public.is_admin() then
    raise exception 'Only administrators can change role or verification status';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_privileged_fields on public.profiles;
create trigger profiles_protect_privileged_fields
before update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_role text := new.raw_user_meta_data ->> 'role';
  selected_status text;
begin
  if selected_role not in ('owner', 'shelter', 'vet') then
    raise exception 'Invalid public registration role';
  end if;

  selected_status := case
    when selected_role = 'owner' then 'approved'
    else 'pending'
  end;

  insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    verification_status
  )
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    selected_role,
    selected_status
  );

  if selected_role = 'shelter' then
    insert into public.shelters (
      id,
      shelter_name,
      address,
      registration_number
    )
    values (
      new.id,
      nullif(trim(new.raw_user_meta_data ->> 'shelter_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'address'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'registration_number'), '')
    );
  elsif selected_role = 'vet' then
    insert into public.veterinarians (
      id,
      clinic_name,
      specialty,
      license_number
    )
    values (
      new.id,
      nullif(trim(new.raw_user_meta_data ->> 'clinic_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'specialty'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'license_number'), '')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.shelters enable row level security;
alter table public.veterinarians enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "shelters_select_own_or_admin" on public.shelters;
create policy "shelters_select_own_or_admin"
on public.shelters for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "shelters_update_own_or_admin" on public.shelters;
create policy "shelters_update_own_or_admin"
on public.shelters for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "veterinarians_select_own_or_admin" on public.veterinarians;
create policy "veterinarians_select_own_or_admin"
on public.veterinarians for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "veterinarians_update_own_or_admin" on public.veterinarians;
create policy "veterinarians_update_own_or_admin"
on public.veterinarians for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

revoke all on public.profiles from anon;
revoke all on public.shelters from anon;
revoke all on public.veterinarians from anon;

grant select, update on public.profiles to authenticated;
grant select, update on public.shelters to authenticated;
grant select, update on public.veterinarians to authenticated;

commit;
