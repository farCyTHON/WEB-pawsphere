begin;

alter table public.pets
  add column if not exists image_path text;

alter table public.pets
  alter column image_url drop not null;

alter table public.pets
  alter column age type numeric using age::numeric;

insert into public.shelters (id, shelter_name, address, registration_number)
select
  p.id,
  coalesce(nullif(trim(p.full_name), ''), 'Shelter'),
  'Address pending',
  p.id::text
from public.profiles p
where p.role = 'shelter'
  and not exists (
    select 1 from public.shelters s where s.id = p.id
  );

commit;
