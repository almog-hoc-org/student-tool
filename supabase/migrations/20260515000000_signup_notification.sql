-- Phase 5: Notify admins when a new student signs up.
-- Fires after a profiles row is inserted (handle_new_user inserts both
-- profiles and user_roles rows during signup), one notification per admin.

CREATE OR REPLACE FUNCTION public.notify_admins_on_signup() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT;
  _display TEXT;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = NEW.user_id;
  _display := COALESCE(NULLIF(NEW.display_name, ''), _email, 'תלמיד חדש');

  INSERT INTO notifications (user_id, type, title, body, link, metadata)
  SELECT
    ur.user_id,
    'new_signup',
    'תלמיד חדש נרשם',
    _display || CASE
      WHEN NEW.status = 'pending' THEN ' ממתין לאישור'
      ELSE ''
    END,
    '/admin/users',
    jsonb_build_object('new_user_id', NEW.user_id, 'email', _email, 'status', NEW.status)
  FROM user_roles ur
  WHERE ur.role = 'admin'
    AND ur.user_id != NEW.user_id;  -- don't notify the admin about themselves

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_on_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_signup();
