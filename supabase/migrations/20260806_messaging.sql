begin;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type text not null
    check (conversation_type in ('owner_shelter', 'owner_vet')),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  participant_id uuid not null references public.profiles (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete set null,
  appointment_id uuid references public.appointments (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (conversation_type, owner_id, participant_id, pet_id)
);

alter table public.conversations add column if not exists conversation_type text;
alter table public.conversations add column if not exists owner_id uuid references public.profiles (id);
alter table public.conversations add column if not exists participant_id uuid references public.profiles (id);
alter table public.conversations add column if not exists pet_id uuid references public.pets (id);
alter table public.conversations add column if not exists appointment_id uuid references public.appointments (id);
alter table public.conversations add column if not exists created_at timestamptz default now();
alter table public.conversations add column if not exists updated_at timestamptz default now();

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages add column if not exists conversation_id uuid references public.conversations (id);
alter table public.messages add column if not exists sender_id uuid references public.profiles (id);
alter table public.messages add column if not exists content text;
alter table public.messages add column if not exists created_at timestamptz default now();

create index if not exists conversations_owner_idx
on public.conversations (owner_id, updated_at desc);

create index if not exists conversations_participant_idx
on public.conversations (participant_id, updated_at desc);

create index if not exists messages_conversation_idx
on public.messages (conversation_id, created_at asc);

create unique index if not exists conversations_owner_vet_unique
on public.conversations (owner_id, participant_id)
where conversation_type = 'owner_vet';

create unique index if not exists conversations_owner_shelter_pet_unique
on public.conversations (owner_id, participant_id, pet_id)
where conversation_type = 'owner_shelter' and pet_id is not null;

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create or replace function public.user_in_conversation(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = target_conversation_id
      and (c.owner_id = auth.uid() or c.participant_id = auth.uid() or public.is_admin())
  );
$$;

create or replace function public.can_start_conversation(
  target_type text,
  target_owner_id uuid,
  target_participant_id uuid,
  target_pet_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when target_type = 'owner_shelter' then exists (
      select 1
      from public.adoption_applications a
      where a.owner_id = target_owner_id
        and a.shelter_id = target_participant_id
        and (target_pet_id is null or a.pet_id = target_pet_id)
    )
    when target_type = 'owner_vet' then exists (
      select 1
      from public.appointments a
      where a.owner_id = target_owner_id
        and a.vet_id = target_participant_id
    )
    else false
  end;
$$;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversation_members_view" on public.conversations;
create policy "conversation_members_view"
on public.conversations for select
to authenticated
using (
  owner_id = auth.uid()
  or participant_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "conversation_members_insert" on public.conversations;
create policy "conversation_members_insert"
on public.conversations for insert
to authenticated
with check (
  (owner_id = auth.uid() or participant_id = auth.uid())
  and public.can_start_conversation(
    conversation_type,
    owner_id,
    participant_id,
    pet_id
  )
);

drop policy if exists "message_members_view" on public.messages;
create policy "message_members_view"
on public.messages for select
to authenticated
using (public.user_in_conversation(conversation_id));

drop policy if exists "message_members_insert" on public.messages;
create policy "message_members_insert"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.user_in_conversation(conversation_id)
  and nullif(trim(content), '') is not null
);

grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;

create or replace function public.create_conversation(
  target_type text,
  target_participant_id uuid,
  target_pet_id uuid default null,
  target_appointment_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_role text;
  resolved_owner_id uuid;
  resolved_participant_id uuid;
  existing_id uuid;
  new_id uuid;
begin
  if target_type not in ('owner_shelter', 'owner_vet') then
    raise exception 'Invalid conversation type';
  end if;

  select role into current_role
  from public.profiles
  where id = auth.uid();

  if current_role = 'owner' then
    resolved_owner_id := auth.uid();
    resolved_participant_id := target_participant_id;
  elsif current_role in ('shelter', 'vet') then
    resolved_owner_id := target_participant_id;
    resolved_participant_id := auth.uid();
  else
    raise exception 'Only owners, shelters, and veterinarians can start conversations';
  end if;

  if not public.can_start_conversation(
    target_type,
    resolved_owner_id,
    resolved_participant_id,
    target_pet_id
  ) then
    raise exception 'You are not allowed to start this conversation';
  end if;

  select c.id into existing_id
  from public.conversations c
  where c.conversation_type = target_type
    and c.owner_id = resolved_owner_id
    and c.participant_id = resolved_participant_id
    and (
      (target_pet_id is null and c.pet_id is null)
      or c.pet_id = target_pet_id
    )
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  insert into public.conversations (
    conversation_type, owner_id, participant_id, pet_id, appointment_id
  )
  values (
    target_type,
    resolved_owner_id,
    resolved_participant_id,
    target_pet_id,
    target_appointment_id
  )
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.get_user_conversations()
returns table (
  id uuid,
  conversation_type text,
  owner_id uuid,
  participant_id uuid,
  pet_id uuid,
  appointment_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  other_user_id uuid,
  other_user_name text,
  other_user_role text,
  pet_name text,
  last_message text,
  last_message_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.conversation_type,
    c.owner_id,
    c.participant_id,
    c.pet_id,
    c.appointment_id,
    c.created_at,
    c.updated_at,
    other.id,
    other.full_name,
    other.role,
    p.name,
    (
      select m.content
      from public.messages m
      where m.conversation_id = c.id
      order by m.created_at desc
      limit 1
    ),
    (
      select m.created_at
      from public.messages m
      where m.conversation_id = c.id
      order by m.created_at desc
      limit 1
    )
  from public.conversations c
  join public.profiles other
    on other.id = case
      when c.owner_id = auth.uid() then c.participant_id
      else c.owner_id
    end
  left join public.pets p on p.id = c.pet_id
  where c.owner_id = auth.uid() or c.participant_id = auth.uid()
  order by coalesce(
    (
      select m.created_at
      from public.messages m
      where m.conversation_id = c.id
      order by m.created_at desc
      limit 1
    ),
    c.updated_at
  ) desc;
$$;

create or replace function public.get_conversation_messages(target_conversation_id uuid)
returns table (
  id uuid,
  conversation_id uuid,
  sender_id uuid,
  content text,
  created_at timestamptz,
  sender_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id, m.conversation_id, m.sender_id, m.content, m.created_at, p.full_name
  from public.messages m
  join public.profiles p on p.id = m.sender_id
  where m.conversation_id = target_conversation_id
    and public.user_in_conversation(target_conversation_id)
  order by m.created_at asc;
$$;

create or replace function public.send_message(
  target_conversation_id uuid,
  message_content text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not public.user_in_conversation(target_conversation_id) then
    raise exception 'Conversation not found or access denied';
  end if;

  if nullif(trim(message_content), '') is null then
    raise exception 'Message cannot be empty';
  end if;

  insert into public.messages (conversation_id, sender_id, content)
  values (target_conversation_id, auth.uid(), trim(message_content))
  returning id into new_id;

  update public.conversations
  set updated_at = now()
  where id = target_conversation_id;

  return new_id;
end;
$$;

create or replace function public.get_message_contacts()
returns table (
  participant_id uuid,
  participant_name text,
  participant_role text,
  conversation_type text,
  pet_id uuid,
  pet_name text,
  context_label text
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select id, role from public.profiles where id = auth.uid()
  )
  select distinct
    case when me.role = 'owner' then a.shelter_id else a.owner_id end as participant_id,
    case when me.role = 'owner' then s.shelter_name else owner.full_name end as participant_name,
    case when me.role = 'owner' then 'shelter' else 'owner' end as participant_role,
    'owner_shelter'::text as conversation_type,
    a.pet_id,
    p.name as pet_name,
    'Adoption · ' || p.name as context_label
  from public.adoption_applications a
  join me on true
  join public.pets p on p.id = a.pet_id
  join public.shelters s on s.id = a.shelter_id
  join public.profiles owner on owner.id = a.owner_id
  where (me.role = 'owner' and a.owner_id = me.id)
     or (me.role = 'shelter' and a.shelter_id = me.id)

  union all

  select distinct
    case when me.role = 'owner' then apt.vet_id else apt.owner_id end,
    case
      when me.role = 'owner' then coalesce(vet_profile.full_name, 'Veterinarian')
      else owner.full_name
    end,
    case when me.role = 'owner' then 'vet' else 'owner' end,
    'owner_vet'::text,
    null::uuid,
    apt.pet_name,
    'Appointment · ' || apt.pet_name
  from public.appointments apt
  join me on true
  join public.profiles owner on owner.id = apt.owner_id
  join public.profiles vet_profile on vet_profile.id = apt.vet_id
  where (me.role = 'owner' and apt.owner_id = me.id)
     or (me.role = 'vet' and apt.vet_id = me.id)
  order by participant_name, context_label;
$$;

revoke all on function public.user_in_conversation(uuid) from public;
revoke all on function public.can_start_conversation(text, uuid, uuid, uuid) from public;
revoke all on function public.create_conversation(text, uuid, uuid, uuid) from public;
revoke all on function public.get_user_conversations() from public;
revoke all on function public.get_conversation_messages(uuid) from public;
revoke all on function public.send_message(uuid, text) from public;
revoke all on function public.get_message_contacts() from public;

grant execute on function public.user_in_conversation(uuid) to authenticated;
grant execute on function public.can_start_conversation(text, uuid, uuid, uuid) to authenticated;
grant execute on function public.create_conversation(text, uuid, uuid, uuid) to authenticated;
grant execute on function public.get_user_conversations() to authenticated;
grant execute on function public.get_conversation_messages(uuid) to authenticated;
grant execute on function public.send_message(uuid, text) to authenticated;
grant execute on function public.get_message_contacts() to authenticated;

commit;
