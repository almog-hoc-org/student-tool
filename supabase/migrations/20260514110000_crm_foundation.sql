-- Phase 1.4: CRM foundation tables.
-- student_activity: unified activity log; replaces the thin usage_events table for analytics.
-- profiles.last_active_at: denormalized last-activity timestamp.
-- profiles.at_risk_flag + reason: surfaced on admin user list, populated by cron.
-- notifications: in-app notification store, source of truth for NotificationCenter.

-- 1. student_activity table
CREATE TABLE public.student_activity (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,    -- 'tool_used' | 'lesson_viewed' | 'lesson_completed' | 'chat_message' | 'support_opened' | 'login' | 'enrollment'
  resource_id TEXT,               -- lesson_id / tool_key / ticket_id / course_id
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_activity_user_time ON public.student_activity(user_id, created_at DESC);
CREATE INDEX idx_student_activity_type ON public.student_activity(activity_type, created_at DESC);

ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own activity"
  ON public.student_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own activity"
  ON public.student_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all activity"
  ON public.student_activity FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Extend profiles with at-risk + last-activity
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS at_risk_flag BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS at_risk_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_at_risk ON public.profiles(at_risk_flag) WHERE at_risk_flag = true;

-- 3. Trigger: update profiles.last_active_at on any student_activity insert
CREATE OR REPLACE FUNCTION public.update_last_active() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET last_active_at = NEW.created_at,
      at_risk_flag = FALSE,
      at_risk_reason = NULL
  WHERE user_id = NEW.user_id
    AND (last_active_at IS NULL OR last_active_at < NEW.created_at);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_last_active
  AFTER INSERT ON public.student_activity
  FOR EACH ROW EXECUTE FUNCTION public.update_last_active();

-- 4. Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  category TEXT,        -- 'support_reply' | 'announcement' | 'reminder' | 'achievement' | 'admin_push'
  link TEXT,            -- in-app path to navigate to on click
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
  ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_all
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark read)"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications for any user"
  ON public.notifications FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can read all notifications"
  ON public.notifications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Update admin_list_users to include last_active_at and at_risk
DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  status user_status,
  roles app_role[],
  created_at TIMESTAMPTZ,
  last_sign_in TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  at_risk_flag BOOLEAN,
  at_risk_reason TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    u.email::TEXT,
    p.display_name,
    p.avatar_url,
    p.status,
    COALESCE(ARRAY_AGG(ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') AS roles,
    p.created_at,
    u.last_sign_in_at,
    p.last_active_at,
    p.at_risk_flag,
    p.at_risk_reason
  FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN user_roles ur ON ur.user_id = p.user_id
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY p.user_id, u.email, p.display_name, p.avatar_url, p.status, p.created_at, u.last_sign_in_at, p.last_active_at, p.at_risk_flag, p.at_risk_reason
  ORDER BY p.created_at DESC
$$;

-- 6. Trigger: when admin posts a ticket message, auto-create a notification for the student
CREATE OR REPLACE FUNCTION public.notify_on_admin_ticket_reply() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ticket_user_id UUID;
  _ticket_subject TEXT;
BEGIN
  IF NEW.author_role = 'admin' THEN
    SELECT user_id, subject INTO _ticket_user_id, _ticket_subject
    FROM support_tickets WHERE id = NEW.ticket_id;

    IF _ticket_user_id IS NOT NULL AND _ticket_user_id != NEW.author_id THEN
      INSERT INTO notifications (user_id, title, body, category, link)
      VALUES (
        _ticket_user_id,
        'תגובה חדשה לפנייתך',
        'בנושא: ' || _ticket_subject,
        'support_reply',
        '/support'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_admin_reply
  AFTER INSERT ON public.support_ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_admin_ticket_reply();

-- 7. Trigger: notify admins when a new high/urgent ticket is opened
CREATE OR REPLACE FUNCTION public.notify_admins_on_urgent_ticket() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.priority IN ('high', 'urgent') THEN
    INSERT INTO notifications (user_id, title, body, category, link)
    SELECT
      ur.user_id,
      'פנייה חדשה ' || (CASE WHEN NEW.priority = 'urgent' THEN 'דחופה' ELSE 'בעדיפות גבוהה' END),
      NEW.subject,
      'support_reply',
      '/admin/support'
    FROM user_roles ur
    WHERE ur.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_on_urgent
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_urgent_ticket();
