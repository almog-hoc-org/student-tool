-- Standalone "ask the expert" entry point.
-- Creates a fresh conversation already pre-escalated to 'awaiting_human',
-- posts the student's question as the first message, and queues the
-- system row that AdminInbox's "average response time" KPI tracks.

CREATE OR REPLACE FUNCTION public.ask_human_expert(
  _subject TEXT,
  _body TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _body IS NULL OR length(trim(_body)) = 0 THEN
    RAISE EXCEPTION 'Body required';
  END IF;

  INSERT INTO conversations (user_id, title, status, priority)
  VALUES (auth.uid(), COALESCE(NULLIF(trim(_subject), ''), left(trim(_body), 60)), 'awaiting_human', 1)
  RETURNING id INTO _conversation_id;

  -- Student's actual question
  INSERT INTO messages (conversation_id, role, content, author_id)
  VALUES (_conversation_id, 'user', trim(_body), auth.uid());

  -- The escalation marker so the response-time KPI can measure correctly
  INSERT INTO messages (conversation_id, role, content, author_id, metadata)
  VALUES (
    _conversation_id,
    'system',
    'התלמיד פנה ישירות לנציג אנושי',
    auth.uid(),
    jsonb_build_object('event', 'escalation', 'origin', 'expert_card')
  );

  RETURN _conversation_id;
END;
$$;

-- Update the admin-reply notification so the student lands on the
-- right conversation (not just the latest)
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
    '/chat?conversation=' || NEW.conversation_id::text,
    jsonb_build_object('conversation_id', NEW.conversation_id)
  );
  RETURN NEW;
END;
$$;
