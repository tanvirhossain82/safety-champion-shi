/*
# Allow admins to manage user profiles

1. Security Changes
- Adds UPDATE and DELETE policies on `public.profiles` so an admin can manage any user's role, department, and name.
- Existing self-update and self-select policies are preserved.
- The admin check uses the existing `is_admin(auth.uid())` helper already used by the SELECT policy.

2. Impact
- Admins can now update or delete any profile row (needed for User Management and Role Assignment modules).
- Non-admin users keep their existing self-only access.
- No new tables, columns, or grants are introduced.

3. Important Notes
- Policies are dropped first to keep the migration idempotent.
- Only `authenticated` role is granted these capabilities.
*/

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));
