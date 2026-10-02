begin;

-- Authorizes the private Supabase Realtime Broadcast channels used for
-- one-to-one video call signaling. Channel topics are named "call:<conversationId>"
-- and reuse the existing conversation membership check, so only the two
-- participants of a conversation can join or send on that channel.
-- No call data is stored: SDP offers/answers and ICE candidates stay ephemeral.

create or replace function public.can_join_call_channel(topic text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when topic ~* '^call:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.user_in_conversation(substring(topic from 6)::uuid)
    else false
  end;
$$;

revoke all on function public.can_join_call_channel(text) from public;
grant execute on function public.can_join_call_channel(text) to authenticated;

drop policy if exists "call_signaling_read" on realtime.messages;
create policy "call_signaling_read"
on realtime.messages for select
to authenticated
using (
  extension = 'broadcast'
  and public.can_join_call_channel(realtime.topic())
);

drop policy if exists "call_signaling_send" on realtime.messages;
create policy "call_signaling_send"
on realtime.messages for insert
to authenticated
with check (
  extension = 'broadcast'
  and public.can_join_call_channel(realtime.topic())
);

commit;
