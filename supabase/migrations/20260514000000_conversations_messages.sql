-- Phase 2: Conversations, messages, calculation snapshots
-- Purpose: persist AI chat + enable human-in-the-loop escalation + named calc saves

-- ============================================================
-- 1. Enums
-- ============================================================
CREATE TYPE public.conversation_status AS ENUM ('open', 'awaiting_human', 'resolved');
CREATE TYPE public.message_role AS ENUM ('user', 'ai', 'human', 'system');

-- ============================================================
-- 2. conversations
-- ============================================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  status public.conversation_status NOT NULL DEFAULT 'open',
  priority SMALLINT NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_user_status ON public.conversations (user_id, status);
CREATE INDEX idx_conversations_status_last_msg ON public.conversations (status, last_message_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conversations"
  ON public.conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all conversations"
  ON public.conversations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all conversations"
  ON public.conversations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. messages
-- ============================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role public.message_role NOT NULL,
  content TEXT NOT NULL,
  tokens_used INT,
  author_id UUID REFERENCES auth.users(id),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_created ON public.messages (conversation_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- User reads/inserts messages for their conversations
CREATE POLICY "Users read own conversation messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert messages in own conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
    AND role = 'user'
  );

CREATE POLICY "Admins read all messages"
  ON public.messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bump conversation.last_message_at on new message
CREATE OR REPLACE FUNCTION public.bump_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_last_message();

-- ============================================================
-- 4. calculation_snapshots — named calc saves (history)
-- ============================================================
CREATE TABLE public.calculation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_key TEXT NOT NULL,
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_snapshots_user_tool ON public.calculation_snapshots (user_id, tool_key, created_at DESC);

ALTER TABLE public.calculation_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own snapshots"
  ON public.calculation_snapshots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all snapshots"
  ON public.calculation_snapshots FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 5. RPCs
-- ============================================================

-- Escalate to human: marks conversation awaiting_human + system message
CREATE OR REPLACE FUNCTION public.conversation_escalate_to_human(_conversation_id UUID, _reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner UUID;
BEGIN
  SELECT user_id INTO _owner FROM conversations WHERE id = _conversation_id;
  IF _owner IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;
  IF _owner <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE conversations
  SET status = 'awaiting_human', priority = GREATEST(priority, 1)
  WHERE id = _conversation_id;

  INSERT INTO messages (conversation_id, role, content, author_id, metadata)
  VALUES (
    _conversation_id,
    'system',
    COALESCE(_reason, 'התלמיד ביקש מענה אנושי'),
    auth.uid(),
    jsonb_build_object('event', 'escalation')
  );
END;
$$;

-- Admin: list conversations with user info
CREATE OR REPLACE FUNCTION public.admin_list_conversations(
  _status conversation_status DEFAULT NULL,
  _limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_display_name TEXT,
  title TEXT,
  status conversation_status,
  priority SMALLINT,
  assigned_to UUID,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  message_count BIGINT,
  last_message_preview TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.user_id,
    u.email::TEXT,
    p.display_name,
    c.title,
    c.status,
    c.priority,
    c.assigned_to,
    c.last_message_at,
    c.created_at,
    (SELECT count(*) FROM messages m WHERE m.conversation_id = c.id),
    (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1)
  FROM conversations c
  JOIN auth.users u ON u.id = c.user_id
  LEFT JOIN profiles p ON p.user_id = c.user_id
  WHERE public.has_role(auth.uid(), 'admin')
    AND (_status IS NULL OR c.status = _status)
  ORDER BY
    CASE WHEN c.status = 'awaiting_human' THEN 0 ELSE 1 END,
    c.last_message_at DESC
  LIMIT _limit
$$;

-- Admin: assign conversation to a CS rep
CREATE OR REPLACE FUNCTION public.admin_assign_conversation(_conversation_id UUID, _assignee UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE conversations SET assigned_to = _assignee WHERE id = _conversation_id;
END;
$$;

-- Admin: reply as human + mark resolved (optional)
CREATE OR REPLACE FUNCTION public.admin_reply(
  _conversation_id UUID,
  _content TEXT,
  _resolve BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _msg_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO messages (conversation_id, role, content, author_id)
  VALUES (_conversation_id, 'human', _content, auth.uid())
  RETURNING id INTO _msg_id;

  IF _resolve THEN
    UPDATE conversations SET status = 'resolved' WHERE id = _conversation_id;
  ELSE
    UPDATE conversations SET status = 'open' WHERE id = _conversation_id AND status = 'awaiting_human';
  END IF;

  RETURN _msg_id;
END;
$$;
