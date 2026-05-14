-- Phase 1.3: Support tickets as first-class entities.
-- Replaces the localStorage+user_data JSONB blob pattern that used tool_key='support_requests'.

-- 1. Enums
CREATE TYPE public.support_status AS ENUM ('open', 'in_progress', 'awaiting_user', 'resolved', 'closed');
CREATE TYPE public.support_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- 2. Main ticket table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  tool TEXT,
  priority public.support_priority NOT NULL DEFAULT 'normal',
  status public.support_status NOT NULL DEFAULT 'open',
  context_path TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id, created_at DESC);
CREATE INDEX idx_support_tickets_admin ON public.support_tickets(assigned_admin_id) WHERE assigned_admin_id IS NOT NULL;
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority_open ON public.support_tickets(priority, created_at DESC) WHERE status IN ('open', 'in_progress', 'awaiting_user');

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all tickets"
  ON public.support_tickets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Thread messages
CREATE TABLE public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  author_role TEXT NOT NULL CHECK (author_role IN ('student', 'admin')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_messages_ticket ON public.support_ticket_messages(ticket_id, created_at ASC);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages on their own tickets"
  ON public.support_ticket_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can post messages to their own tickets"
  ON public.support_ticket_messages FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND author_role = 'student'
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all messages"
  ON public.support_ticket_messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can post admin messages"
  ON public.support_ticket_messages FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND auth.uid() = author_id
    AND author_role = 'admin'
  );

-- 4. Status / assignment history (audit log)
CREATE TABLE public.support_ticket_history (
  id BIGSERIAL PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  field TEXT NOT NULL,            -- 'status' | 'assigned_admin_id' | 'priority'
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_history_ticket ON public.support_ticket_history(ticket_id, created_at DESC);

ALTER TABLE public.support_ticket_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read history of their tickets"
  ON public.support_ticket_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Admins can read all history"
  ON public.support_ticket_history FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Trigger: write history rows when ticket fields change
CREATE OR REPLACE FUNCTION public.support_ticket_audit() RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO support_ticket_history (ticket_id, changed_by, field, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'status', OLD.status::TEXT, NEW.status::TEXT);
    END IF;
    IF OLD.assigned_admin_id IS DISTINCT FROM NEW.assigned_admin_id THEN
      INSERT INTO support_ticket_history (ticket_id, changed_by, field, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'assigned_admin_id', OLD.assigned_admin_id::TEXT, NEW.assigned_admin_id::TEXT);
    END IF;
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO support_ticket_history (ticket_id, changed_by, field, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'priority', OLD.priority::TEXT, NEW.priority::TEXT);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_support_ticket_audit
  AFTER UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.support_ticket_audit();

-- 6. Admin RPCs

CREATE OR REPLACE FUNCTION public.support_assign_ticket(_ticket_id UUID, _admin_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE support_tickets
  SET assigned_admin_id = _admin_id,
      status = CASE WHEN status = 'open' THEN 'in_progress'::support_status ELSE status END
  WHERE id = _ticket_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.support_update_status(_ticket_id UUID, _status support_status)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE support_tickets
  SET status = _status,
      resolved_at = CASE WHEN _status IN ('resolved', 'closed') THEN now() ELSE NULL END
  WHERE id = _ticket_id;
END;
$$;

-- 7. Aggregate view for admin queue (joins user info)
CREATE OR REPLACE VIEW public.support_tickets_admin_view
WITH (security_invoker = on)
AS
  SELECT
    t.id,
    t.user_id,
    t.assigned_admin_id,
    t.subject,
    t.description,
    t.issue_type,
    t.tool,
    t.priority,
    t.status,
    t.context_path,
    t.resolved_at,
    t.created_at,
    t.updated_at,
    p.display_name AS user_display_name,
    u.email AS user_email,
    ap.display_name AS assigned_admin_display_name,
    (SELECT COUNT(*) FROM support_ticket_messages m WHERE m.ticket_id = t.id) AS message_count,
    (SELECT MAX(created_at) FROM support_ticket_messages m WHERE m.ticket_id = t.id) AS last_message_at
  FROM support_tickets t
  LEFT JOIN profiles p ON p.user_id = t.user_id
  LEFT JOIN auth.users u ON u.id = t.user_id
  LEFT JOIN profiles ap ON ap.user_id = t.assigned_admin_id;

GRANT SELECT ON public.support_tickets_admin_view TO authenticated;
