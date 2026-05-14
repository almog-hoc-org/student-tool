-- Phase 3: Broadcasts, notifications, activity timeline

-- ============================================================
-- 1. notifications — DB-backed (replaces localStorage)
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,                       -- 'broadcast' | 'reply' | 'system' | 'sla_breach'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
  ON public.notifications (user_id, read_at, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications (mark read/dismiss)"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all notifications"
  ON public.notifications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. broadcasts — admin sends to filtered audience
-- ============================================================
CREATE TABLE public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  target_filter JSONB NOT NULL DEFAULT '{}', -- {status, cohort, inactive_days_gte, role}
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_recipients INT NOT NULL DEFAULT 0
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read broadcasts"
  ON public.broadcasts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 3. RPCs
-- ============================================================

-- Reply notification trigger: when admin posts a 'human' message,
-- notify the conversation owner.
CREATE OR REPLACE FUNCTION public.notify_conversation_owner_on_human_msg()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner UUID;
BEGIN
  IF NEW.role <> 'human' THEN
    RETURN NEW;
  END IF;
  SELECT user_id INTO _owner FROM conversations WHERE id = NEW.conversation_id;
  IF _owner IS NULL OR _owner = NEW.author_id THEN
    RETURN NEW;
  END IF;
  INSERT INTO notifications (user_id, type, title, body, link, metadata)
  VALUES (
    _owner,
    'reply',
    'נציג ענה לשאלה שלך',
    LEFT(NEW.content, 140),
    '/chat',
    jsonb_build_object('conversation_id', NEW.conversation_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_human_reply
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_conversation_owner_on_human_msg();

-- Admin: send broadcast — inserts notifications for filtered users.
-- target_filter supports keys:
--   status: 'pending' | 'approved' | 'rejected'
--   cohort: TEXT (matches profiles via invite_code cohort... future-proof; falls back to all)
--   inactive_days_gte: INT  (users whose last_sign_in_at is older than N days OR null)
--   role: 'admin' | 'student'
CREATE OR REPLACE FUNCTION public.admin_send_broadcast(
  _title TEXT,
  _body TEXT,
  _link TEXT,
  _target_filter JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _broadcast_id UUID;
  _count INT;
  _status TEXT := _target_filter ->> 'status';
  _role TEXT := _target_filter ->> 'role';
  _inactive_days TEXT := _target_filter ->> 'inactive_days_gte';
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO broadcasts (title, body, link, target_filter, sent_by)
  VALUES (_title, _body, _link, _target_filter, auth.uid())
  RETURNING id INTO _broadcast_id;

  WITH targets AS (
    SELECT DISTINCT p.user_id
    FROM profiles p
    JOIN auth.users u ON u.id = p.user_id
    LEFT JOIN user_roles ur ON ur.user_id = p.user_id
    WHERE (_status IS NULL OR p.status::text = _status)
      AND (_role IS NULL OR ur.role::text = _role)
      AND (
        _inactive_days IS NULL
        OR u.last_sign_in_at IS NULL
        OR u.last_sign_in_at < now() - (_inactive_days || ' days')::interval
      )
  ),
  inserted AS (
    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    SELECT
      t.user_id,
      'broadcast',
      _title,
      _body,
      _link,
      jsonb_build_object('broadcast_id', _broadcast_id)
    FROM targets t
    RETURNING 1
  )
  SELECT count(*) INTO _count FROM inserted;

  UPDATE broadcasts SET total_recipients = _count WHERE id = _broadcast_id;
  RETURN _broadcast_id;
END;
$$;

-- Admin: preview broadcast count without sending
CREATE OR REPLACE FUNCTION public.admin_broadcast_preview_count(_target_filter JSONB)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INT;
  _status TEXT := _target_filter ->> 'status';
  _role TEXT := _target_filter ->> 'role';
  _inactive_days TEXT := _target_filter ->> 'inactive_days_gte';
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT count(DISTINCT p.user_id) INTO _count
  FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE (_status IS NULL OR p.status::text = _status)
    AND (_role IS NULL OR ur.role::text = _role)
    AND (
      _inactive_days IS NULL
      OR u.last_sign_in_at IS NULL
      OR u.last_sign_in_at < now() - (_inactive_days || ' days')::interval
    );
  RETURN COALESCE(_count, 0);
END;
$$;

-- Admin: user activity timeline (events + chat + snapshots)
CREATE OR REPLACE FUNCTION public.admin_user_activity(_user_id UUID, _limit INT DEFAULT 100)
RETURNS TABLE (
  event_kind TEXT,        -- 'usage' | 'message' | 'snapshot' | 'notification'
  event_type TEXT,
  tool_key TEXT,
  content TEXT,
  occurred_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH events AS (
    SELECT 'usage'::TEXT AS event_kind, ue.event_type, ue.tool_key,
           NULL::TEXT AS content, ue.created_at AS occurred_at
    FROM usage_events ue WHERE ue.user_id = _user_id
    UNION ALL
    SELECT 'message'::TEXT, m.role::TEXT, NULL,
           LEFT(m.content, 120), m.created_at
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE c.user_id = _user_id
    UNION ALL
    SELECT 'snapshot'::TEXT, 'saved', s.tool_key, s.name, s.created_at
    FROM calculation_snapshots s WHERE s.user_id = _user_id
    UNION ALL
    SELECT 'notification'::TEXT, n.type, NULL, n.title, n.created_at
    FROM notifications n WHERE n.user_id = _user_id
  )
  SELECT * FROM events
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY occurred_at DESC
  LIMIT _limit
$$;

-- Admin: dashboard KPIs aggregate
CREATE OR REPLACE FUNCTION public.admin_dashboard_kpis()
RETURNS TABLE (
  total_users INT,
  approved_users INT,
  pending_users INT,
  active_7d INT,
  inactive_14d INT,
  open_conversations INT,
  awaiting_human INT,
  avg_response_seconds NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM profiles)::INT,
    (SELECT count(*) FROM profiles WHERE status = 'approved')::INT,
    (SELECT count(*) FROM profiles WHERE status = 'pending')::INT,
    (SELECT count(DISTINCT u.id) FROM auth.users u
       WHERE u.last_sign_in_at >= now() - INTERVAL '7 days')::INT,
    (SELECT count(*) FROM profiles p
       JOIN auth.users u ON u.id = p.user_id
       WHERE p.status = 'approved'
         AND (u.last_sign_in_at IS NULL OR u.last_sign_in_at < now() - INTERVAL '14 days'))::INT,
    (SELECT count(*) FROM conversations WHERE status = 'open')::INT,
    (SELECT count(*) FROM conversations WHERE status = 'awaiting_human')::INT,
    (SELECT EXTRACT(EPOCH FROM AVG(human_reply.created_at - escalation.created_at))::NUMERIC
       FROM messages escalation
       JOIN LATERAL (
         SELECT m.created_at FROM messages m
         WHERE m.conversation_id = escalation.conversation_id
           AND m.role = 'human'
           AND m.created_at > escalation.created_at
         ORDER BY m.created_at LIMIT 1
       ) human_reply ON true
       WHERE escalation.role = 'system'
         AND escalation.metadata ->> 'event' = 'escalation')
  WHERE public.has_role(auth.uid(), 'admin');
$$;

-- Mark notification read
CREATE OR REPLACE FUNCTION public.mark_notification_read(_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE notifications
  SET read_at = COALESCE(read_at, now())
  WHERE id = _id AND user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INT;
BEGIN
  WITH upd AS (
    UPDATE notifications SET read_at = now()
    WHERE user_id = auth.uid() AND read_at IS NULL
    RETURNING 1
  )
  SELECT count(*) INTO _count FROM upd;
  RETURN _count;
END;
$$;

-- ============================================================
-- 4. Realtime: enable on conversations, messages, notifications
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
