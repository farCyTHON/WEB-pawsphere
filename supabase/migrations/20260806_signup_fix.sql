begin;

-- The old Auth trigger caused "Database error saving new user" when profile /
-- shelter / vet inserts failed (e.g. NULL into NOT NULL via nullif()).
-- Profile creation is now handled in the app after auth.signUp succeeds.
drop trigger if exists on_auth_user_created on auth.users;

-- Keep the function around as a no-op so older references do not break.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  return new;
end;
$$;

-- Allow authenticated users to insert their own profile / role rows.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "shelters_insert_own" on public.shelters;
create policy "shelters_insert_own"
on public.shelters for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "veterinarians_insert_own" on public.veterinarians;
create policy "veterinarians_insert_own"
on public.veterinarians for insert
to authenticated
with check (id = auth.uid());

grant insert on public.profiles to authenticated;
grant insert on public.shelters to authenticated;
grant insert on public.veterinarians to authenticated;

-- Fallback for email-confirmation signups (no session yet): a security-definer
-- RPC that creates the profile using the newly created auth user id.
create or replace function public.complete_signup(
  p_user_id uuid,
  p_role text,
  p_full_name text,
  p_phone text,
  p_email text,
  p_shelter_name text default null,
  p_address text default null,
  p_registration_number text default null,
  p_clinic_name text default null,
  p_specialty text default null,
  p_license_number text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_status text;
begin
  if p_role not in ('owner', 'shelter', 'vet') then
    raise exception 'Invalid public registration role';
  end if;

  if not exists (
    select 1
    from auth.users
    where id = p_user_id
      and created_at > now() - interval '1 hour'
  ) then
    raise exception 'Auth user not found or signup window expired';
  end if;

  -- Prefer the signed-in user; allow the just-created user id when there is
  -- no session yet (email confirmation enabled).
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Cannot create a profile for another user';
  end if;

  if exists (select 1 from public.profiles where id = p_user_id) then
    return;
  end if;

  selected_status := case
    when p_role = 'owner' then 'approved'
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
    p_user_id,
    coalesce(nullif(trim(p_email), ''), ''),
    coalesce(nullif(trim(p_full_name), ''), 'User'),
    coalesce(nullif(trim(p_phone), ''), ''),
    p_role,
    selected_status
  );

  if p_role = 'shelter' then
    insert into public.shelters (
      id,
      shelter_name,
      address,
      registration_number
    )
    values (
      p_user_id,
      coalesce(nullif(trim(p_shelter_name), ''), 'Shelter'),
      coalesce(nullif(trim(p_address), ''), 'Address pending'),
      coalesce(nullif(trim(p_registration_number), ''), p_user_id::text)
    );
  elsif p_role = 'vet' then
    insert into public.veterinarians (
      id,
      clinic_name,
      specialty,
      license_number
    )
    values (
      p_user_id,
      coalesce(nullif(trim(p_clinic_name), ''), 'Clinic'),
      coalesce(nullif(trim(p_specialty), ''), 'General'),
      coalesce(nullif(trim(p_license_number), ''), p_user_id::text)
    );
  end if;
end;
$$;

revoke all on function public.complete_signup(
  uuid, text, text, text, text, text, text, text, text, text, text
) from public;
grant execute on function public.complete_signup(
  uuid, text, text, text, text, text, text, text, text, text, text
) to anon, authenticated;

commit;
