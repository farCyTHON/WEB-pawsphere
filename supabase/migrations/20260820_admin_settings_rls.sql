begin;

-- Admin settings are admin-only. Replace the previous authenticated-wide
-- SELECT policy without adding a duplicate or disabling RLS.
drop policy if exists "app_settings_select_authenticated" on public.app_settings;
drop policy if exists "app_settings_select_admin" on public.app_settings;
create policy "app_settings_select_admin"
on public.app_settings for select
to authenticated
using (public.is_admin());

commit;
