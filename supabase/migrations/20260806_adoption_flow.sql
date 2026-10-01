begin;

create table if not exists public.adoption_applications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  status text not null default 'pending'
    check (status in (
      'pending',
      'review',
      'interview',
      'approved',
      'meet_and_greet',
      'rejected',
      'completed'
    )),
  remarks text,
  housing_type text not null,
  has_yard boolean not null default false,
  other_pets text not null default '',
  adoption_experience text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists adoption_applications_one_active_per_pet_owner
on public.adoption_applications (pet_id, owner_id)
where status not in ('rejected', 'completed');

create index if not exists adoption_applications_owner_idx
on public.adoption_applications (owner_id, created_at desc);

create index if not exists adoption_applications_shelter_idx
on public.adoption_applications (shelter_id, created_at desc);

drop trigger if exists adoption_applications_set_updated_at
on public.adoption_applications;
create trigger adoption_applications_set_updated_at
before update on public.adoption_applications
for each row execute function public.set_updated_at();

create or replace function public.set_pet_status_from_adoption()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' and old.status is distinct from new.status then
    update public.pets set status = 'Reserved' where id = new.pet_id;
  elsif new.status = 'completed' and old.status is distinct from new.status then
    update public.pets set status = 'Adopted' where id = new.pet_id;
  elsif new.status = 'rejected' and old.status in ('approved', 'meet_and_greet') then
    update public.pets set status = 'Available' where id = new.pet_id;
  end if;
  return new;
end;
$$;

drop trigger if exists adoption_application_updates_pet
on public.adoption_applications;
create trigger adoption_application_updates_pet
after update of status on public.adoption_applications
for each row execute function public.set_pet_status_from_adoption();

alter table public.adoption_applications enable row level security;

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
  );
$$;

create policy "owners_insert_applications"
on public.adoption_applications for insert
to authenticated
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  )
  and public.can_apply_for_pet(pet_id, shelter_id)
);

create policy "owners_view_own_applications"
on public.adoption_applications for select
to authenticated
using (
  owner_id = auth.uid()
  or shelter_id = auth.uid()
  or public.is_admin()
);

create policy "shelters_update_own_applications"
on public.adoption_applications for update
to authenticated
using (shelter_id = auth.uid() or public.is_admin())
with check (shelter_id = auth.uid() or public.is_admin());

grant select, insert, update on public.adoption_applications to authenticated;

create or replace function public.get_owner_applications()
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
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.id, a.pet_id, a.owner_id, a.shelter_id, a.status, a.remarks,
    a.housing_type, a.has_yard, a.other_pets, a.adoption_experience,
    a.notes, a.created_at, p.name, p.image_url, s.shelter_name,
    owner.full_name, owner.email, owner.phone
  from public.adoption_applications a
  join public.pets p on p.id = a.pet_id
  join public.shelters s on s.id = a.shelter_id
  join public.profiles owner on owner.id = a.owner_id
  where a.owner_id = auth.uid()
  order by a.created_at desc;
$$;

create or replace function public.get_shelter_applications()
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
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.id, a.pet_id, a.owner_id, a.shelter_id, a.status, a.remarks,
    a.housing_type, a.has_yard, a.other_pets, a.adoption_experience,
    a.notes, a.created_at, p.name, p.image_url, s.shelter_name,
    owner.full_name, owner.email, owner.phone
  from public.adoption_applications a
  join public.pets p on p.id = a.pet_id
  join public.shelters s on s.id = a.shelter_id
  join public.profiles owner on owner.id = a.owner_id
  where a.shelter_id = auth.uid()
  order by a.created_at desc;
$$;

create or replace function public.get_adoption_application(application_id uuid)
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
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.id, a.pet_id, a.owner_id, a.shelter_id, a.status, a.remarks,
    a.housing_type, a.has_yard, a.other_pets, a.adoption_experience,
    a.notes, a.created_at, p.name, p.image_url, s.shelter_name,
    owner.full_name, owner.email, owner.phone
  from public.adoption_applications a
  join public.pets p on p.id = a.pet_id
  join public.shelters s on s.id = a.shelter_id
  join public.profiles owner on owner.id = a.owner_id
  where a.id = application_id
    and (
      a.owner_id = auth.uid()
      or a.shelter_id = auth.uid()
      or public.is_admin()
    )
  limit 1;
$$;

create or replace function public.update_adoption_application_status(
  application_id uuid,
  next_status text,
  status_remarks text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if next_status not in (
    'pending', 'review', 'interview', 'approved',
    'meet_and_greet', 'rejected', 'completed'
  ) then
    raise exception 'Invalid adoption status';
  end if;

  update public.adoption_applications
  set status = next_status, remarks = status_remarks
  where id = application_id
    and (shelter_id = auth.uid() or public.is_admin());

  if not found then
    raise exception 'Application not found or access denied';
  end if;
end;
$$;

revoke all on function public.get_owner_applications() from public;
revoke all on function public.get_shelter_applications() from public;
revoke all on function public.get_adoption_application(uuid) from public;
revoke all on function public.update_adoption_application_status(uuid, text, text) from public;
revoke all on function public.can_apply_for_pet(uuid, uuid) from public;

grant execute on function public.get_owner_applications() to authenticated;
grant execute on function public.get_shelter_applications() to authenticated;
grant execute on function public.get_adoption_application(uuid) to authenticated;
grant execute on function public.update_adoption_application_status(uuid, text, text) to authenticated;
grant execute on function public.can_apply_for_pet(uuid, uuid) to authenticated;

commit;
