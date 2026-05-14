-- Phase 4: RAG knowledge base (pgvector) + 24h SLA breach cron

-- ============================================================
-- 1. pgvector + knowledge_chunks
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file TEXT NOT NULL,
  source_id TEXT,                       -- e.g. drive file id (for dedup)
  chunk_index INT NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chunks_source ON public.knowledge_chunks (source_id, chunk_index);
-- Approximate nearest-neighbour index (ivfflat). Tune `lists` after seeding.
CREATE INDEX idx_chunks_embedding
  ON public.knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Admins can manage; chunks are NOT exposed to students directly.
-- The edge function uses service_role (bypasses RLS) so no public SELECT needed.
CREATE POLICY "Admins manage knowledge"
  ON public.knowledge_chunks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. match_chunks RPC — used by the chat-ai edge function for retrieval
-- ============================================================
CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  source_file TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    kc.id,
    kc.source_file,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- 3. SLA: cron job that flags conversations awaiting human > 24h
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.flag_sla_breaches()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin RECORD;
  _convo RECORD;
  _new_count INT := 0;
BEGIN
  FOR _convo IN
    SELECT c.id, c.user_id, c.last_message_at,
           p.display_name, u.email
    FROM conversations c
    JOIN auth.users u ON u.id = c.user_id
    LEFT JOIN profiles p ON p.user_id = c.user_id
    WHERE c.status = 'awaiting_human'
      AND c.last_message_at < now() - INTERVAL '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.type = 'sla_breach'
          AND n.metadata ->> 'conversation_id' = c.id::text
          AND n.created_at > c.last_message_at
      )
  LOOP
    FOR _admin IN
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO notifications (user_id, type, title, body, link, metadata)
      VALUES (
        _admin.user_id,
        'sla_breach',
        'פנייה ממתינה מעל 24 שעות',
        format('פנייה של %s ממתינה לתגובה', COALESCE(_convo.display_name, _convo.email)),
        '/admin/inbox',
        jsonb_build_object('conversation_id', _convo.id)
      );
      _new_count := _new_count + 1;
    END LOOP;
  END LOOP;
  RETURN _new_count;
END;
$$;

-- Run every hour
SELECT cron.schedule(
  'flag-sla-breaches-hourly',
  '5 * * * *',                    -- minute 5 of every hour
  $$ SELECT public.flag_sla_breaches(); $$
);
