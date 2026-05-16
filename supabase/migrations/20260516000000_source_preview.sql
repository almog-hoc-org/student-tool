-- Source preview: let students click "מבוסס על: <name>" in chat and read the
-- actual course content the AI used.
--
-- 1. Loosen knowledge_chunks RLS — authenticated users can read.
--    Rationale: the AI already cites these as sources in answers; allowing the
--    student to see the full source makes attribution real, not decorative.
--    Admins still own write access.
-- 2. Extend match_chunks to return source_id so the UI can fetch all chunks
--    of a given source on demand.

CREATE POLICY "Authenticated users can read knowledge"
  ON public.knowledge_chunks FOR SELECT TO authenticated
  USING (TRUE);

DROP FUNCTION IF EXISTS public.match_chunks(vector, FLOAT, INT);

CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  source_id TEXT,
  source_file TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    kc.id,
    kc.source_id,
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
