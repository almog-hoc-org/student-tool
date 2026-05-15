-- Fix: column reference 'created_at' was ambiguous in PL/pgSQL FOR loop.
-- Qualify all created_at references in the subqueries.

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
        (SELECT MAX(ue.created_at) FROM usage_events ue WHERE ue.user_id = p.user_id),
        (SELECT MAX(m.created_at) FROM messages m
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
    IF _user.last_activity IS NULL OR _user.last_activity < now() - INTERVAL '7 days' THEN
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
