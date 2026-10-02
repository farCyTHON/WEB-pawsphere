begin;

-- Approving an application updates pets.status, which fires pets_set_updated_at.
-- The live pets table was created without updated_at, so that trigger failed
-- with: record "new" has no field "updated_at".
alter table public.pets
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists pets_set_updated_at on public.pets;
create trigger pets_set_updated_at
before update on public.pets
for each row execute function public.set_updated_at();

commit;
