-- Phase 4: Email channel + admin "push" capability.
-- Adds:
--   * notifications.email_sent_at — denormalized flag for the email-out worker
--   * admin_send_notification(user_id, title, body, category, link)
--     — RPC that admins use to push from the dashboard
--   * Optional cohort-scoped bulk push helper

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_notifications_pending_email
  ON public.notifications(created_at)
  WHERE email_sent_at IS NULL;

-- Single-target push from admin UI
CREATE OR REPLACE FUNCTION public.admin_send_notification(
  _user_id UUID,
  _title TEXT,
  _body TEXT,
  _category TEXT DEFAULT 'admin_push',
  _link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO notifications (user_id, title, body, category, link, sent_by)
  VALUES (_user_id, _title, _body, _category, _link, auth.uid())
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- Cohort-bulk push: insert one notification row per matching student
CREATE OR REPLACE FUNCTION public.admin_send_notification_to_cohort(
  _cohort TEXT,
  _title TEXT,
  _body TEXT,
  _category TEXT DEFAULT 'announcement',
  _link TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  WITH inserted AS (
    INSERT INTO notifications (user_id, title, body, category, link, sent_by)
    SELECT e.user_id, _title, _body, _category, _link, auth.uid()
    FROM enrollments e
    WHERE e.cohort = _cohort
    RETURNING id
  )
  SELECT COUNT(*)::INT INTO _count FROM inserted;
  RETURN _count;
END;
$$;

-- Bulk push to at-risk students
CREATE OR REPLACE FUNCTION public.admin_send_notification_to_at_risk(
  _title TEXT,
  _body TEXT,
  _category TEXT DEFAULT 'reminder',
  _link TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  WITH inserted AS (
    INSERT INTO notifications (user_id, title, body, category, link, sent_by)
    SELECT p.user_id, _title, _body, _category, _link, auth.uid()
    FROM profiles p
    WHERE p.at_risk_flag = TRUE AND p.status = 'approved'
    RETURNING id
  )
  SELECT COUNT(*)::INT INTO _count FROM inserted;
  RETURN _count;
END;
$$;

-- Compute at-risk flags (run via cron daily; can also be called manually by admin)
CREATE OR REPLACE FUNCTION public.compute_at_risk_flags()
RETURNS TABLE (flagged_count INT, cleared_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _flagged INT;
  _cleared INT;
BEGIN
  -- Inactive for 14+ days after approval AND has unfinished lessons
  UPDATE profiles p
  SET at_risk_flag = TRUE,
      at_risk_reason = 'אין פעילות ' || EXTRACT(DAY FROM now() - p.last_active_at)::TEXT || ' ימים'
  WHERE p.status = 'approved'
    AND p.last_active_at IS NOT NULL
    AND p.last_active_at < now() - INTERVAL '14 days'
    AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.user_id = p.user_id AND e.completed_at IS NULL
    )
    AND NOT p.at_risk_flag;
  GET DIAGNOSTICS _flagged = ROW_COUNT;

  -- Clear flag if student has activity in the last 7 days
  UPDATE profiles p
  SET at_risk_flag = FALSE, at_risk_reason = NULL
  WHERE p.at_risk_flag = TRUE
    AND p.last_active_at IS NOT NULL
    AND p.last_active_at >= now() - INTERVAL '7 days';
  GET DIAGNOSTICS _cleared = ROW_COUNT;

  RETURN QUERY SELECT _flagged, _cleared;
END;
$$;
