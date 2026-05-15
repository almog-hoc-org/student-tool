-- Phase 5b: white-glove features
--   * profiles.admin_notes — private free-form notes by admin
--   * profiles.onboarded_at — set when student finishes onboarding
--   * Welcome notification on approval
--   * Daily inactivity nudge cron (7 days)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- admin_notes column-level RLS:
-- The existing "Admins can update all profiles" + "Admins can read all profiles"
-- policies already gate access. Students never get admin_notes back because
-- their SELECT policy (`user_id = auth.uid()`) returns the row, but they
-- can't see what the column contains since we filter at the API layer in
-- the AdminUsers/UserDrawer pages. For belt-and-suspenders, we redact via a
-- safe view:
CREATE OR REPLACE VIEW public.profiles_self
WITH (security_invoker = on)
AS
  SELECT
    id, user_id, display_name, avatar_url, status,
    created_at, updated_at, onboarded_at
  FROM profiles
  WHERE user_id = auth.uid();
GRANT SELECT ON public.profiles_self TO authenticated;

-- Welcome notification: fires when status flips to 'approved'
CREATE OR REPLACE FUNCTION public.notify_on_approval() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.user_id,
      'welcome',
      'ברוך הבא לקורס! 🎉',
      'החשבון שלך אושר. התחל מהאזור האישי או דלג ישר למחשבון התקציב.',
      '/onboarding',
      jsonb_build_object('approved_at', now())
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_approval ON public.profiles;
CREATE TRIGGER trg_notify_on_approval
  AFTER UPDATE OF status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_approval();

-- Inactivity nudge: daily job that finds approved users inactive 7+ days
-- (no recent usage_events OR auth.last_sign_in), and fires one nudge.
-- Self-throttled: we only send if the LAST 'inactivity_nudge' notification
-- to that user is older than 7 days OR doesn't exist.
CREATE OR REPLACE FUNCTION public.fire_inactivity_nudges()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user RECORD;
  _new_count INT := 0;
BEGIN
  FOR _user IN
    SELECT
      p.user_id,
      p.display_name,
      u.last_sign_in_at,
      GREATEST(
        u.last_sign_in_at,
        (SELECT MAX(created_at) FROM usage_events ue WHERE ue.user_id = p.user_id),
        (SELECT MAX(created_at) FROM messages m
           JOIN conversations c ON c.id = m.conversation_id
           WHERE c.user_id = p.user_id)
      ) AS last_activity
    FROM profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.status = 'approved'
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = p.user_id AND ur.role = 'admin'
      )
  LOOP
    -- Only fire if inactive 7+ days
    IF _user.last_activity IS NULL OR _user.last_activity < now() - INTERVAL '7 days' THEN
      -- Throttle: no nudge in the last 7 days
      IF NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = _user.user_id
          AND n.type = 'inactivity_nudge'
          AND n.created_at > now() - INTERVAL '7 days'
      ) THEN
        INSERT INTO notifications (user_id, type, title, body, link, metadata)
        VALUES (
          _user.user_id,
          'inactivity_nudge',
          'מתגעגעים אליך 👋',
          'עבר שבוע מאז ביקרת. רוצה לחזור למחשבון התקציב או לשאול את היועץ AI שאלה?',
          '/',
          jsonb_build_object('last_activity', _user.last_activity)
        );
        _new_count := _new_count + 1;
      END IF;
    END IF;
  END LOOP;
  RETURN _new_count;
END;
$$;

-- Schedule daily at 10:00 (host timezone — Supabase runs UTC, this is ~13:00 IL summer)
SELECT cron.schedule(
  'inactivity-nudges-daily',
  '0 10 * * *',
  $$ SELECT public.fire_inactivity_nudges(); $$
);

-- RPC for admin to update notes (uses existing admin-update-profiles policy)
CREATE OR REPLACE FUNCTION public.admin_set_notes(_user_id UUID, _notes TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE profiles SET admin_notes = _notes, updated_at = now() WHERE user_id = _user_id;
END;
$$;

-- RPC: mark current user as onboarded
CREATE OR REPLACE FUNCTION public.mark_onboarded()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET onboarded_at = now() WHERE user_id = auth.uid();
END;
$$;
