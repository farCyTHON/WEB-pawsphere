begin;

-- Persistent in-app notifications. Inserts are performed only by
-- security-definer triggers after the related write succeeds.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null
    check (type in ('adoption', 'appointment', 'message', 'vaccine')),
  body text not null,
  read_at timestamptz,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
on public.notifications (user_id)
where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

revoke all on public.notifications from public;
revoke all on public.notifications from anon;
grant select on public.notifications to authenticated;

create or replace function public.notify_user(
  target_user_id uuid,
  notification_type text,
  notification_body text,
  notification_entity_type text default null,
  notification_entity_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user_id is null then
    return;
  end if;
  if target_user_id = auth.uid() then
    return;
  end if;
  if notification_type not in ('adoption', 'appointment', 'message', 'vaccine') then
    return;
  end if;
  if nullif(trim(notification_body), '') is null then
    return;
  end if;

  insert into public.notifications (
    user_id, type, body, entity_type, entity_id
  )
  values (
    target_user_id,
    notification_type,
    trim(notification_body),
    notification_entity_type,
    notification_entity_id
  );
end;
$$;

create or replace function public.notify_adoption_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pet_label text;
begin
  select coalesce(nullif(trim(name), ''), 'a pet') into pet_label
  from public.pets
  where id = new.pet_id;

  if tg_op = 'INSERT' then
    perform public.notify_user(
      new.shelter_id,
      'adoption',
      'New adoption application for ' || pet_label || '.',
      'adoption_application',
      new.id
    );
    return new;
  end if;

  if new.status is distinct from old.status then
    perform public.notify_user(
      new.owner_id,
      'adoption',
      'Your adoption application for ' || pet_label
        || ' is now ' || replace(new.status, '_', ' ') || '.',
      'adoption_application',
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists adoption_notify_insert on public.adoption_applications;
create trigger adoption_notify_insert
after insert on public.adoption_applications
for each row execute function public.notify_adoption_event();

drop trigger if exists adoption_notify_update on public.adoption_applications;
create trigger adoption_notify_update
after update of status on public.adoption_applications
for each row execute function public.notify_adoption_event();

create or replace function public.notify_appointment_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  when_label text;
begin
  when_label := to_char(new.appointment_date, 'Mon DD at HH12:MI AM');

  if tg_op = 'INSERT' then
    perform public.notify_user(
      new.vet_id,
      'appointment',
      'New appointment request for ' || coalesce(nullif(trim(new.pet_name), ''), 'a pet')
        || ' on ' || when_label || '.',
      'appointment',
      new.id
    );
    return new;
  end if;

  if new.status is distinct from old.status
     or new.appointment_date is distinct from old.appointment_date then
    if auth.uid() is distinct from new.owner_id then
      perform public.notify_user(
        new.owner_id,
        'appointment',
        case
          when new.appointment_date is distinct from old.appointment_date then
            'Your appointment for ' || coalesce(nullif(trim(new.pet_name), ''), 'a pet')
              || ' was rescheduled to ' || when_label || '.'
          else
            'Your appointment for ' || coalesce(nullif(trim(new.pet_name), ''), 'a pet')
              || ' is now ' || new.status || '.'
        end,
        'appointment',
        new.id
      );
    end if;

    if auth.uid() is distinct from new.vet_id then
      perform public.notify_user(
        new.vet_id,
        'appointment',
        case
          when new.status = 'cancelled' then
            'An appointment for ' || coalesce(nullif(trim(new.pet_name), ''), 'a pet')
              || ' was cancelled.'
          when new.appointment_date is distinct from old.appointment_date then
            'An appointment for ' || coalesce(nullif(trim(new.pet_name), ''), 'a pet')
              || ' was rescheduled to ' || when_label || '.'
          else
            'An appointment for ' || coalesce(nullif(trim(new.pet_name), ''), 'a pet')
              || ' is now ' || new.status || '.'
        end,
        'appointment',
        new.id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists appointment_notify_insert on public.appointments;
create trigger appointment_notify_insert
after insert on public.appointments
for each row execute function public.notify_appointment_event();

drop trigger if exists appointment_notify_update on public.appointments;
create trigger appointment_notify_update
after update of status, appointment_date on public.appointments
for each row execute function public.notify_appointment_event();

create or replace function public.notify_message_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient_id uuid;
  sender_label text;
begin
  select case
    when c.owner_id = new.sender_id then c.participant_id
    else c.owner_id
  end
  into recipient_id
  from public.conversations c
  where c.id = new.conversation_id;

  select coalesce(nullif(trim(full_name), ''), 'Someone')
  into sender_label
  from public.profiles
  where id = new.sender_id;

  perform public.notify_user(
    recipient_id,
    'message',
    'New message from ' || sender_label || '.',
    'conversation',
    new.conversation_id
  );

  return new;
end;
$$;

drop trigger if exists message_notify_insert on public.messages;
create trigger message_notify_insert
after insert on public.messages
for each row execute function public.notify_message_event();

create or replace function public.notify_vaccine_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.next_due_date is null then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and new.next_due_date is not distinct from old.next_due_date then
    return new;
  end if;

  perform public.notify_user(
    new.owner_id,
    'vaccine',
    coalesce(nullif(trim(new.pet_name), ''), 'Your pet')
      || '''s ' || coalesce(nullif(trim(new.vaccine_name), ''), 'vaccination')
      || ' is due on ' || to_char(new.next_due_date, 'Mon DD, YYYY') || '.',
    'vaccination',
    new.id
  );

  return new;
end;
$$;

drop trigger if exists vaccination_notify on public.vaccinations;
create trigger vaccination_notify
after insert or update of next_due_date on public.vaccinations
for each row execute function public.notify_vaccine_event();

create or replace function public.notify_follow_up_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.follow_up_date is null then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and new.follow_up_date is not distinct from old.follow_up_date then
    return new;
  end if;

  perform public.notify_user(
    new.owner_id,
    'vaccine',
    'Follow-up for ' || coalesce(nullif(trim(new.pet_name), ''), 'your pet')
      || ' is scheduled for ' || to_char(new.follow_up_date, 'Mon DD, YYYY') || '.',
    'medical_record',
    new.id
  );

  return new;
end;
$$;

drop trigger if exists medical_follow_up_notify on public.medical_records;
create trigger medical_follow_up_notify
after insert or update of follow_up_date on public.medical_records
for each row execute function public.notify_follow_up_event();

create or replace function public.ensure_due_reminders()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into public.notifications (user_id, type, body, entity_type, entity_id)
  select
    v.owner_id,
    'vaccine',
    coalesce(nullif(trim(v.pet_name), ''), 'Your pet')
      || '''s ' || coalesce(nullif(trim(v.vaccine_name), ''), 'vaccination')
      || ' is due on ' || to_char(v.next_due_date, 'Mon DD, YYYY') || '.',
    'vaccination',
    v.id
  from public.vaccinations v
  where v.owner_id = auth.uid()
    and v.next_due_date is not null
    and v.next_due_date between current_date and current_date + 7
    and not exists (
      select 1
      from public.notifications n
      where n.user_id = v.owner_id
        and n.entity_type = 'vaccination'
        and n.entity_id = v.id
        and n.created_at > now() - interval '7 days'
    );

  insert into public.notifications (user_id, type, body, entity_type, entity_id)
  select
    m.owner_id,
    'vaccine',
    'Follow-up for ' || coalesce(nullif(trim(m.pet_name), ''), 'your pet')
      || ' is scheduled for ' || to_char(m.follow_up_date, 'Mon DD, YYYY') || '.',
    'medical_record',
    m.id
  from public.medical_records m
  where m.owner_id = auth.uid()
    and m.follow_up_date is not null
    and m.follow_up_date between current_date and current_date + 7
    and not exists (
      select 1
      from public.notifications n
      where n.user_id = m.owner_id
        and n.entity_type = 'medical_record'
        and n.entity_id = m.id
        and n.created_at > now() - interval '7 days'
    );
end;
$$;

create or replace function public.get_user_notifications()
returns table (
  id uuid,
  type text,
  body text,
  read_at timestamptz,
  entity_type text,
  entity_id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ensure_due_reminders();

  return query
  select
    n.id, n.type, n.body, n.read_at, n.entity_type, n.entity_id, n.created_at
  from public.notifications n
  where n.user_id = auth.uid()
  order by n.created_at desc
  limit 100;
end;
$$;

create or replace function public.mark_notification_read(target_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notifications
  set read_at = now()
  where id = target_notification_id
    and user_id = auth.uid()
    and read_at is null;
end;
$$;

create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notifications
  set read_at = now()
  where user_id = auth.uid()
    and read_at is null;
end;
$$;

revoke all on function public.notify_user(uuid, text, text, text, uuid) from public;
revoke all on function public.ensure_due_reminders() from public;
revoke all on function public.get_user_notifications() from public;
revoke all on function public.mark_notification_read(uuid) from public;
revoke all on function public.mark_all_notifications_read() from public;

grant execute on function public.get_user_notifications() to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

alter table public.notifications replica identity full;

-- Public signup must not be able to insert an admin profile (or a
-- pre-approved shelter/vet) through the direct-insert fallback.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (
  id = auth.uid()
  and role in ('owner', 'shelter', 'vet')
  and (
    (role = 'owner' and verification_status = 'approved')
    or (role in ('shelter', 'vet') and verification_status = 'pending')
  )
);

commit;
