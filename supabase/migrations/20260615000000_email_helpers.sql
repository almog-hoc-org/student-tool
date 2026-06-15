-- Helpers for the notify-email edge function (signup/approval loop).
-- Both SECURITY DEFINER so the function can read auth.users via service role.

-- Emails of all admins (for new-signup notification).
CREATE OR REPLACE FUNCTION public.admin_emails()
RETURNS TABLE(email TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email::TEXT
  FROM user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  WHERE ur.role = 'admin';
$$;

-- Resolve a user id from an email (case-insensitive) — used to verify a
-- pending profile exists before notifying admins.
CREATE OR REPLACE FUNCTION public.user_id_by_email(_email TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.admin_emails() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.user_id_by_email(TEXT) FROM anon, authenticated;
