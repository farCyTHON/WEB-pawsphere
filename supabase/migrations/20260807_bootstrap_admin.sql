begin;

-- Allow the first admin to be promoted from the Supabase SQL Editor.
-- Previously protect_profile_privileged_fields() only checked is_admin(),
-- which uses auth.uid() and is always false in the SQL Editor (no JWT).
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- SQL Editor / migrations run as postgres (or supabase_admin), not as a
  -- logged-in app user. Those sessions must be able to bootstrap the first admin.
  if session_user in ('postgres', 'supabase_admin')
     or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if (
    new.id is distinct from old.id
    or new.role is distinct from old.role
    or new.verification_status is distinct from old.verification_status
  ) and not public.is_admin() then
    raise exception 'Only administrators can change role or verification status';
  end if;

  return new;
end;
$$;

-- Promote a specific account to admin (edit the email, then run this file).
-- Safe to re-run.
update public.profiles
set
  role = 'admin',
  verification_status = 'approved'
where email = 'nahid88@gmail.com';

commit;
