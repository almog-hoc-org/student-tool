-- Phase 3: pgvector + RAG infrastructure for the AI chat.
-- Stores embedded course content chunks and chat message history.

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Course content chunks (the corpus that grounds the chat)
-- Embedding dimension is parameterized at the application layer; we default
-- to 1536 (text-embedding-3-small / OpenAI). If switching to Gemini's
-- text-embedding-004 (768), drop and recreate this table.
CREATE TABLE public.course_chunks (
  id BIGSERIAL PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  tokens INT,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, chunk_index)
);

-- IVFFlat index for similarity search (cosine).
-- Note: lists=100 is appropriate for a few thousand rows.
-- Run `ANALYZE course_chunks;` after bulk embedding to update statistics.
CREATE INDEX idx_course_chunks_embedding
  ON public.course_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_course_chunks_lesson ON public.course_chunks(lesson_id);

ALTER TABLE public.course_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read chunks for published lessons"
  ON public.course_chunks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM lessons l
    JOIN modules m ON m.id = l.module_id
    JOIN courses c ON c.id = m.course_id
    WHERE l.id = lesson_id AND l.is_published AND c.is_published
  ) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage chunks"
  ON public.course_chunks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Similarity search RPC: returns top-K chunks with cosine distance + lesson info
CREATE OR REPLACE FUNCTION public.match_course_chunks(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  min_similarity FLOAT DEFAULT 0.0
)
RETURNS TABLE (
  chunk_id BIGINT,
  lesson_id UUID,
  lesson_title TEXT,
  lesson_slug TEXT,
  module_slug TEXT,
  course_slug TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id AS chunk_id,
    cc.lesson_id,
    l.title AS lesson_title,
    l.slug AS lesson_slug,
    m.slug AS module_slug,
    c.slug AS course_slug,
    cc.content,
    (1 - (cc.embedding <=> query_embedding))::FLOAT AS similarity
  FROM course_chunks cc
  JOIN lessons l ON l.id = cc.lesson_id
  JOIN modules m ON m.id = l.module_id
  JOIN courses c ON c.id = m.course_id
  WHERE l.is_published AND c.is_published
    AND (1 - (cc.embedding <=> query_embedding)) >= min_similarity
  ORDER BY cc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 3. Chat messages (per-user history; threadable)
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB,                     -- [{ lesson_slug, lesson_title, module_slug, course_slug, similarity }]
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_user_thread ON public.chat_messages(user_id, thread_id, created_at);
CREATE INDEX idx_chat_messages_user_recent ON public.chat_messages(user_id, created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all chat messages"
  ON public.chat_messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
