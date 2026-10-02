begin;

-- Per-user read cursors so unread dots sync across browsers/devices.
create table if not exists public.conversation_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_reads_user_idx
on public.conversation_reads (user_id, last_read_at desc);

alter table public.conversation_reads enable row level security;

drop policy if exists "conversation_reads_select" on public.conversation_reads;
create policy "conversation_reads_select"
on public.conversation_reads for select
to authenticated
using (
  user_id = auth.uid()
  and public.user_in_conversation(conversation_id)
);

drop policy if exists "conversation_reads_insert" on public.conversation_reads;
create policy "conversation_reads_insert"
on public.conversation_reads for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.user_in_conversation(conversation_id)
);

drop policy if exists "conversation_reads_update" on public.conversation_reads;
create policy "conversation_reads_update"
on public.conversation_reads for update
to authenticated
using (
  user_id = auth.uid()
  and public.user_in_conversation(conversation_id)
)
with check (
  user_id = auth.uid()
  and public.user_in_conversation(conversation_id)
);

grant select, insert, update on public.conversation_reads to authenticated;

create or replace function public.mark_conversation_read(target_conversation_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  read_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Sign in to update read state';
  end if;

  if not public.user_in_conversation(target_conversation_id) then
    raise exception 'Conversation not found or access denied';
  end if;

  read_at := now();

  insert into public.conversation_reads (conversation_id, user_id, last_read_at)
  values (target_conversation_id, auth.uid(), read_at)
  on conflict (conversation_id, user_id)
  do update set last_read_at = excluded.last_read_at;

  return read_at;
end;
$$;

revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

drop function if exists public.get_user_conversations();

create function public.get_user_conversations()
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
  last_message_at timestamptz,
  last_sender_id uuid,
  last_read_at timestamptz,
  unread boolean
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
    last_msg.content,
    last_msg.created_at,
    last_msg.sender_id,
    r.last_read_at,
    (
      last_msg.created_at is not null
      and last_msg.sender_id is distinct from auth.uid()
      and (r.last_read_at is null or last_msg.created_at > r.last_read_at)
    ) as unread
  from public.conversations c
  join public.profiles other
    on other.id = case
      when c.owner_id = auth.uid() then c.participant_id
      else c.owner_id
    end
  left join public.pets p on p.id = c.pet_id
  left join lateral (
    select m.content, m.created_at, m.sender_id
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) last_msg on true
  left join public.conversation_reads r
    on r.conversation_id = c.id
    and r.user_id = auth.uid()
  where c.owner_id = auth.uid() or c.participant_id = auth.uid()
  order by coalesce(last_msg.created_at, c.updated_at) desc;
$$;

revoke all on function public.get_user_conversations() from public;
grant execute on function public.get_user_conversations() to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversation_reads'
  ) then
    alter publication supabase_realtime add table public.conversation_reads;
  end if;
end;
$$;

alter table public.conversation_reads replica identity full;

commit;
