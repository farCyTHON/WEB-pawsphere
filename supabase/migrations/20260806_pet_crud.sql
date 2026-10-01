begin;

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  name text not null,
  species text not null,
  breed text not null,
  age numeric not null check (age > 0),
  gender text not null,
  vaccinated boolean not null default false,
  health_notes text not null default '',
  status text not null default 'Available'
    check (status in ('Available', 'Reserved', 'Adopted')),
  image_url text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pets_shelter_id_idx
on public.pets (shelter_id);

drop trigger if exists pets_set_updated_at on public.pets;
create trigger pets_set_updated_at
before update on public.pets
for each row execute function public.set_updated_at();

alter table public.pets enable row level security;

drop policy if exists "pets_select_own_or_admin" on public.pets;
create policy "pets_select_own_or_admin"
on public.pets for select
to authenticated
using (shelter_id = auth.uid() or public.is_admin());

drop policy if exists "pets_insert_own_or_admin" on public.pets;
create policy "pets_insert_own_or_admin"
on public.pets for insert
to authenticated
with check (shelter_id = auth.uid() or public.is_admin());

drop policy if exists "pets_update_own_or_admin" on public.pets;
create policy "pets_update_own_or_admin"
on public.pets for update
to authenticated
using (shelter_id = auth.uid() or public.is_admin())
with check (shelter_id = auth.uid() or public.is_admin());

drop policy if exists "pets_delete_own_or_admin" on public.pets;
create policy "pets_delete_own_or_admin"
on public.pets for delete
to authenticated
using (shelter_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.pets to authenticated;

insert into storage.buckets (id, name, public)
values ('pets', 'pets', true)
on conflict (id) do update set public = true;

drop policy if exists "pet_images_public_read" on storage.objects;
create policy "pet_images_public_read"
on storage.objects for select
to public
using (bucket_id = 'pets');

drop policy if exists "shelters_upload_pet_images" on storage.objects;
create policy "shelters_upload_pet_images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'pets'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

drop policy if exists "shelters_update_pet_images" on storage.objects;
create policy "shelters_update_pet_images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'pets'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
)
with check (
  bucket_id = 'pets'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

drop policy if exists "shelters_delete_pet_images" on storage.objects;
create policy "shelters_delete_pet_images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'pets'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

commit;
