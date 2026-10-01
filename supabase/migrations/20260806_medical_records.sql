begin;

create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments (id) on delete set null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  vet_id uuid not null references public.veterinarians (id) on delete cascade,
  pet_name text not null,
  diagnosis text not null,
  prescription text not null,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Support projects that already created medical_records with fewer columns.
alter table public.medical_records add column if not exists appointment_id uuid references public.appointments (id) on delete set null;
alter table public.medical_records add column if not exists owner_id uuid references public.profiles (id);
alter table public.medical_records add column if not exists vet_id uuid references public.veterinarians (id);
alter table public.medical_records add column if not exists pet_name text;
alter table public.medical_records add column if not exists diagnosis text;
alter table public.medical_records add column if not exists prescription text;
alter table public.medical_records add column if not exists follow_up_date date;
alter table public.medical_records add column if not exists created_at timestamptz default now();
alter table public.medical_records add column if not exists updated_at timestamptz default now();

create table if not exists public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  pet_name text not null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  vet_id uuid references public.veterinarians (id) on delete set null,
  vaccine_name text not null,
  vaccination_date date not null,
  next_due_date date,
  veterinarian_name text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vaccinations add column if not exists pet_name text;
alter table public.vaccinations add column if not exists owner_id uuid references public.profiles (id);
alter table public.vaccinations add column if not exists vet_id uuid references public.veterinarians (id);
alter table public.vaccinations add column if not exists vaccine_name text;
alter table public.vaccinations add column if not exists vaccination_date date;
alter table public.vaccinations add column if not exists next_due_date date;
alter table public.vaccinations add column if not exists veterinarian_name text default '';
alter table public.vaccinations add column if not exists notes text default '';
alter table public.vaccinations add column if not exists created_at timestamptz default now();
alter table public.vaccinations add column if not exists updated_at timestamptz default now();

create index if not exists medical_records_owner_idx
on public.medical_records (owner_id, created_at desc);

create index if not exists medical_records_vet_idx
on public.medical_records (vet_id, created_at desc);

create index if not exists vaccinations_owner_idx
on public.vaccinations (owner_id, vaccination_date desc);

drop trigger if exists medical_records_set_updated_at on public.medical_records;
create trigger medical_records_set_updated_at
before update on public.medical_records
for each row execute function public.set_updated_at();

drop trigger if exists vaccinations_set_updated_at on public.vaccinations;
create trigger vaccinations_set_updated_at
before update on public.vaccinations
for each row execute function public.set_updated_at();

-- A veterinarian may only touch records for pets they have appointments for.
create or replace function public.vet_treats_pet(
  target_owner_id uuid,
  target_pet_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.appointments a
    where a.vet_id = auth.uid()
      and a.owner_id = target_owner_id
      and lower(a.pet_name) = lower(target_pet_name)
  );
$$;

alter table public.medical_records enable row level security;
alter table public.vaccinations enable row level security;

drop policy if exists "medical_records_participants_view" on public.medical_records;
create policy "medical_records_participants_view"
on public.medical_records for select
to authenticated
using (
  owner_id = auth.uid()
  or vet_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "vaccinations_participants_view" on public.vaccinations;
create policy "vaccinations_participants_view"
on public.vaccinations for select
to authenticated
using (
  owner_id = auth.uid()
  or public.vet_treats_pet(owner_id, pet_name)
  or public.is_admin()
);

drop policy if exists "vets_insert_vaccinations" on public.vaccinations;
create policy "vets_insert_vaccinations"
on public.vaccinations for insert
to authenticated
with check (
  vet_id = auth.uid()
  and public.vet_treats_pet(owner_id, pet_name)
);

drop policy if exists "vets_update_vaccinations" on public.vaccinations;
create policy "vets_update_vaccinations"
on public.vaccinations for update
to authenticated
using (vet_id = auth.uid())
with check (
  vet_id = auth.uid()
  and public.vet_treats_pet(owner_id, pet_name)
);

drop policy if exists "vets_delete_vaccinations" on public.vaccinations;
create policy "vets_delete_vaccinations"
on public.vaccinations for delete
to authenticated
using (vet_id = auth.uid());

grant select on public.medical_records to authenticated;
grant select, insert, update, delete on public.vaccinations to authenticated;

create or replace function public.create_medical_record(
  target_appointment_id uuid,
  record_diagnosis text,
  record_prescription text,
  record_follow_up_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  appointment_row public.appointments;
  new_record_id uuid;
begin
  if nullif(trim(record_diagnosis), '') is null then
    raise exception 'Diagnosis is required';
  end if;

  if nullif(trim(record_prescription), '') is null then
    raise exception 'Prescription is required';
  end if;

  select * into appointment_row
  from public.appointments
  where id = target_appointment_id
    and vet_id = auth.uid();

  if not found then
    raise exception 'Appointment not found or access denied';
  end if;

  insert into public.medical_records (
    appointment_id, owner_id, vet_id, pet_name,
    diagnosis, prescription, follow_up_date
  )
  values (
    appointment_row.id,
    appointment_row.owner_id,
    appointment_row.vet_id,
    appointment_row.pet_name,
    trim(record_diagnosis),
    trim(record_prescription),
    record_follow_up_date
  )
  returning id into new_record_id;

  if appointment_row.status <> 'completed' then
    update public.appointments
    set status = 'completed'
    where id = appointment_row.id;
  end if;

  return new_record_id;
end;
$$;

create or replace function public.get_owner_medical_records()
returns table (
  id uuid,
  appointment_id uuid,
  owner_id uuid,
  vet_id uuid,
  pet_name text,
  diagnosis text,
  prescription text,
  follow_up_date date,
  created_at timestamptz,
  owner_name text,
  owner_email text,
  owner_phone text,
  vet_name text,
  clinic_name text,
  appointment_date timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id, r.appointment_id, r.owner_id, r.vet_id, r.pet_name,
    r.diagnosis, r.prescription, r.follow_up_date, r.created_at,
    owner.full_name, owner.email, owner.phone,
    vet_profile.full_name, vet.clinic_name, a.appointment_date
  from public.medical_records r
  join public.profiles owner on owner.id = r.owner_id
  join public.profiles vet_profile on vet_profile.id = r.vet_id
  join public.veterinarians vet on vet.id = r.vet_id
  left join public.appointments a on a.id = r.appointment_id
  where r.owner_id = auth.uid()
  order by r.created_at desc;
$$;

create or replace function public.get_vet_medical_records()
returns table (
  id uuid,
  appointment_id uuid,
  owner_id uuid,
  vet_id uuid,
  pet_name text,
  diagnosis text,
  prescription text,
  follow_up_date date,
  created_at timestamptz,
  owner_name text,
  owner_email text,
  owner_phone text,
  vet_name text,
  clinic_name text,
  appointment_date timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id, r.appointment_id, r.owner_id, r.vet_id, r.pet_name,
    r.diagnosis, r.prescription, r.follow_up_date, r.created_at,
    owner.full_name, owner.email, owner.phone,
    vet_profile.full_name, vet.clinic_name, a.appointment_date
  from public.medical_records r
  join public.profiles owner on owner.id = r.owner_id
  join public.profiles vet_profile on vet_profile.id = r.vet_id
  join public.veterinarians vet on vet.id = r.vet_id
  left join public.appointments a on a.id = r.appointment_id
  where r.vet_id = auth.uid()
  order by r.created_at desc;
$$;

create or replace function public.get_vaccinations()
returns table (
  id uuid,
  pet_name text,
  owner_id uuid,
  vet_id uuid,
  vaccine_name text,
  vaccination_date date,
  next_due_date date,
  veterinarian_name text,
  notes text,
  created_at timestamptz,
  owner_name text,
  owner_email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    v.id, v.pet_name, v.owner_id, v.vet_id, v.vaccine_name,
    v.vaccination_date, v.next_due_date, v.veterinarian_name,
    v.notes, v.created_at, owner.full_name, owner.email
  from public.vaccinations v
  join public.profiles owner on owner.id = v.owner_id
  where v.owner_id = auth.uid()
    or v.vet_id = auth.uid()
    or public.vet_treats_pet(v.owner_id, v.pet_name)
  order by v.vaccination_date desc;
$$;

create or replace function public.get_vet_patients()
returns table (
  owner_id uuid,
  pet_name text,
  owner_name text,
  owner_email text,
  owner_phone text,
  total_appointments bigint,
  last_visit timestamptz,
  next_visit timestamptz,
  last_diagnosis text,
  next_follow_up date,
  vaccination_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.owner_id,
    a.pet_name,
    owner.full_name,
    owner.email,
    owner.phone,
    count(*),
    max(a.appointment_date) filter (where a.status = 'completed'),
    min(a.appointment_date) filter (
      where a.status in ('pending', 'approved') and a.appointment_date > now()
    ),
    (
      select r.diagnosis
      from public.medical_records r
      where r.vet_id = auth.uid()
        and r.owner_id = a.owner_id
        and lower(r.pet_name) = lower(a.pet_name)
      order by r.created_at desc
      limit 1
    ),
    (
      select min(r.follow_up_date)
      from public.medical_records r
      where r.vet_id = auth.uid()
        and r.owner_id = a.owner_id
        and lower(r.pet_name) = lower(a.pet_name)
        and r.follow_up_date >= current_date
    ),
    (
      select count(*)
      from public.vaccinations v
      where v.owner_id = a.owner_id
        and lower(v.pet_name) = lower(a.pet_name)
    )
  from public.appointments a
  join public.profiles owner on owner.id = a.owner_id
  where a.vet_id = auth.uid()
  group by a.owner_id, a.pet_name, owner.full_name, owner.email, owner.phone
  order by max(a.appointment_date) desc;
$$;

create or replace function public.get_medical_timeline(
  filter_pet_name text default null
)
returns table (
  event_type text,
  event_date timestamptz,
  pet_name text,
  title text,
  description text,
  actor text
)
language sql
stable
security definer
set search_path = ''
as $$
  with visible_appointments as (
    select a.*, vet_profile.full_name as vet_name, owner.full_name as owner_name
    from public.appointments a
    join public.profiles vet_profile on vet_profile.id = a.vet_id
    join public.profiles owner on owner.id = a.owner_id
    where a.owner_id = auth.uid() or a.vet_id = auth.uid()
  ),
  visible_records as (
    select r.*, vet_profile.full_name as vet_name
    from public.medical_records r
    join public.profiles vet_profile on vet_profile.id = r.vet_id
    where r.owner_id = auth.uid() or r.vet_id = auth.uid()
  ),
  visible_vaccinations as (
    select v.*
    from public.vaccinations v
    where v.owner_id = auth.uid()
      or v.vet_id = auth.uid()
      or public.vet_treats_pet(v.owner_id, v.pet_name)
  ),
  events as (
    select
      'appointment_booked' as event_type, a.created_at as event_date,
      a.pet_name, 'Appointment booked' as title,
      a.reason as description, a.vet_name as actor
    from visible_appointments a

    union all
    select
      'appointment_completed', a.appointment_date, a.pet_name,
      'Appointment completed', a.reason, a.vet_name
    from visible_appointments a
    where a.status = 'completed'

    union all
    select
      'diagnosis_added', r.created_at, r.pet_name,
      'Diagnosis added', r.diagnosis, r.vet_name
    from visible_records r

    union all
    select
      'prescription_issued', r.created_at, r.pet_name,
      'Prescription issued', r.prescription, r.vet_name
    from visible_records r

    union all
    select
      'vaccination_added', v.vaccination_date::timestamptz, v.pet_name,
      'Vaccination added',
      v.vaccine_name || case
        when nullif(trim(v.notes), '') is null then ''
        else ' — ' || v.notes
      end,
      v.veterinarian_name
    from visible_vaccinations v

    union all
    select
      'follow_up_scheduled', r.follow_up_date::timestamptz, r.pet_name,
      'Follow-up scheduled',
      'Follow-up visit planned for ' || to_char(r.follow_up_date, 'DD Mon YYYY'),
      r.vet_name
    from visible_records r
    where r.follow_up_date is not null
  )
  select
    e.event_type, e.event_date, e.pet_name,
    e.title, e.description, e.actor
  from events e
  where filter_pet_name is null
    or lower(e.pet_name) = lower(filter_pet_name)
  order by e.event_date desc;
$$;

revoke all on function public.vet_treats_pet(uuid, text) from public;
revoke all on function public.create_medical_record(uuid, text, text, date) from public;
revoke all on function public.get_owner_medical_records() from public;
revoke all on function public.get_vet_medical_records() from public;
revoke all on function public.get_vaccinations() from public;
revoke all on function public.get_vet_patients() from public;
revoke all on function public.get_medical_timeline(text) from public;

grant execute on function public.vet_treats_pet(uuid, text) to authenticated;
grant execute on function public.create_medical_record(uuid, text, text, date) to authenticated;
grant execute on function public.get_owner_medical_records() to authenticated;
grant execute on function public.get_vet_medical_records() to authenticated;
grant execute on function public.get_vaccinations() to authenticated;
grant execute on function public.get_vet_patients() to authenticated;
grant execute on function public.get_medical_timeline(text) to authenticated;

commit;
