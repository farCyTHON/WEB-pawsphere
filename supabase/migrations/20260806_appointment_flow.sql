begin;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  vet_id uuid not null references public.veterinarians (id) on delete cascade,
  pet_name text not null,
  appointment_date timestamptz not null,
  reason text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'cancelled', 'completed')),
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Support projects that already have an older appointments table.
alter table public.appointments add column if not exists owner_id uuid references public.profiles (id);
alter table public.appointments add column if not exists vet_id uuid references public.veterinarians (id);
alter table public.appointments add column if not exists pet_name text;
alter table public.appointments add column if not exists appointment_date timestamptz;
alter table public.appointments add column if not exists reason text;
alter table public.appointments add column if not exists status text default 'pending';
alter table public.appointments add column if not exists remarks text;
alter table public.appointments add column if not exists created_at timestamptz default now();
alter table public.appointments add column if not exists updated_at timestamptz default now();

create index if not exists appointments_owner_idx
on public.appointments (owner_id, appointment_date desc);

create index if not exists appointments_vet_idx
on public.appointments (vet_id, appointment_date desc);

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create or replace function public.validate_future_appointment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.appointment_date <= now() then
    raise exception 'Appointment date must be in the future';
  end if;
  if nullif(trim(new.pet_name), '') is null then
    raise exception 'Pet name is required';
  end if;
  if nullif(trim(new.reason), '') is null then
    raise exception 'Reason for visit is required';
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_validate_booking on public.appointments;
create trigger appointments_validate_booking
before insert or update of appointment_date, pet_name, reason
on public.appointments
for each row execute function public.validate_future_appointment();

alter table public.appointments enable row level security;

drop policy if exists "appointment_participants_view" on public.appointments;
create policy "appointment_participants_view"
on public.appointments for select
to authenticated
using (
  owner_id = auth.uid()
  or vet_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "owners_create_appointments" on public.appointments;
create policy "owners_create_appointments"
on public.appointments for insert
to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  )
);

grant select, insert on public.appointments to authenticated;

create or replace function public.get_available_veterinarians()
returns table (
  id uuid,
  full_name text,
  clinic_name text,
  specialty text
)
language sql
stable
security definer
set search_path = ''
as $$
  select v.id, p.full_name, v.clinic_name, v.specialty
  from public.veterinarians v
  join public.profiles p on p.id = v.id
  where p.verification_status = 'approved'
  order by p.full_name;
$$;

create or replace function public.get_owner_appointments()
returns table (
  id uuid,
  owner_id uuid,
  vet_id uuid,
  pet_name text,
  appointment_date timestamptz,
  reason text,
  status text,
  remarks text,
  created_at timestamptz,
  owner_name text,
  owner_email text,
  owner_phone text,
  vet_name text,
  clinic_name text,
  specialty text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.id, a.owner_id, a.vet_id, a.pet_name, a.appointment_date,
    a.reason, a.status, a.remarks, a.created_at,
    owner.full_name, owner.email, owner.phone,
    vet_profile.full_name, vet.clinic_name, vet.specialty
  from public.appointments a
  join public.profiles owner on owner.id = a.owner_id
  join public.profiles vet_profile on vet_profile.id = a.vet_id
  join public.veterinarians vet on vet.id = a.vet_id
  where a.owner_id = auth.uid()
  order by a.appointment_date desc;
$$;

create or replace function public.get_vet_appointments()
returns table (
  id uuid,
  owner_id uuid,
  vet_id uuid,
  pet_name text,
  appointment_date timestamptz,
  reason text,
  status text,
  remarks text,
  created_at timestamptz,
  owner_name text,
  owner_email text,
  owner_phone text,
  vet_name text,
  clinic_name text,
  specialty text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.id, a.owner_id, a.vet_id, a.pet_name, a.appointment_date,
    a.reason, a.status, a.remarks, a.created_at,
    owner.full_name, owner.email, owner.phone,
    vet_profile.full_name, vet.clinic_name, vet.specialty
  from public.appointments a
  join public.profiles owner on owner.id = a.owner_id
  join public.profiles vet_profile on vet_profile.id = a.vet_id
  join public.veterinarians vet on vet.id = a.vet_id
  where a.vet_id = auth.uid()
  order by a.appointment_date desc;
$$;

create or replace function public.get_appointment(appointment_id uuid)
returns table (
  id uuid,
  owner_id uuid,
  vet_id uuid,
  pet_name text,
  appointment_date timestamptz,
  reason text,
  status text,
  remarks text,
  created_at timestamptz,
  owner_name text,
  owner_email text,
  owner_phone text,
  vet_name text,
  clinic_name text,
  specialty text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.id, a.owner_id, a.vet_id, a.pet_name, a.appointment_date,
    a.reason, a.status, a.remarks, a.created_at,
    owner.full_name, owner.email, owner.phone,
    vet_profile.full_name, vet.clinic_name, vet.specialty
  from public.appointments a
  join public.profiles owner on owner.id = a.owner_id
  join public.profiles vet_profile on vet_profile.id = a.vet_id
  join public.veterinarians vet on vet.id = a.vet_id
  where a.id = appointment_id
    and (
      a.owner_id = auth.uid()
      or a.vet_id = auth.uid()
      or public.is_admin()
    )
  limit 1;
$$;

create or replace function public.update_appointment_status(
  appointment_id uuid,
  next_status text,
  status_remarks text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if next_status not in ('pending', 'approved', 'cancelled', 'completed') then
    raise exception 'Invalid appointment status';
  end if;

  update public.appointments
  set status = next_status, remarks = status_remarks
  where id = appointment_id
    and (vet_id = auth.uid() or public.is_admin())
    and (
      (status = 'pending' and next_status in ('approved', 'cancelled'))
      or (status = 'approved' and next_status in ('cancelled', 'completed'))
    );

  if not found then
    raise exception 'Appointment not found or access denied';
  end if;
end;
$$;

create or replace function public.reschedule_appointment(
  appointment_id uuid,
  new_appointment_date timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new_appointment_date <= now() then
    raise exception 'Appointment date must be in the future';
  end if;

  update public.appointments
  set appointment_date = new_appointment_date, status = 'approved'
  where id = appointment_id
    and (vet_id = auth.uid() or public.is_admin())
    and status in ('pending', 'approved');

  if not found then
    raise exception 'Appointment not found or access denied';
  end if;
end;
$$;

create or replace function public.cancel_owner_appointment(
  appointment_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.appointments
  set status = 'cancelled'
  where id = appointment_id
    and owner_id = auth.uid()
    and status in ('pending', 'approved');

  if not found then
    raise exception 'Appointment cannot be cancelled';
  end if;
end;
$$;

revoke all on function public.get_available_veterinarians() from public;
revoke all on function public.get_owner_appointments() from public;
revoke all on function public.get_vet_appointments() from public;
revoke all on function public.get_appointment(uuid) from public;
revoke all on function public.update_appointment_status(uuid, text, text) from public;
revoke all on function public.reschedule_appointment(uuid, timestamptz) from public;
revoke all on function public.cancel_owner_appointment(uuid) from public;

grant execute on function public.get_available_veterinarians() to authenticated;
grant execute on function public.get_owner_appointments() to authenticated;
grant execute on function public.get_vet_appointments() to authenticated;
grant execute on function public.get_appointment(uuid) to authenticated;
grant execute on function public.update_appointment_status(uuid, text, text) to authenticated;
grant execute on function public.reschedule_appointment(uuid, timestamptz) to authenticated;
grant execute on function public.cancel_owner_appointment(uuid) to authenticated;

commit;
