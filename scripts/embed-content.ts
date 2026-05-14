/**
 * Embed all published lessons into course_chunks for RAG.
 *
 * Usage:
 *   SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   OPENAI_API_KEY=...           (or GEMINI_API_KEY)
 *   npx tsx scripts/embed-content.ts
 *
 * Idempotent: re-embeds only lessons whose content was updated since
 * last embedding, OR all lessons if you pass --force.
 *
 * Chunking: 400 tokens per chunk with 50 token overlap, naive whitespace
 * splitting (good enough for Hebrew prose; switch to a sentence splitter
 * if you start ingesting structured content).
 */

import { createClient } from '@supabase/supabase-js';

const CHUNK_TARGET_WORDS = 300;   // approximate token count for Hebrew text
const CHUNK_OVERLAP_WORDS = 40;

interface Lesson {
  id: string;
  title: string;
  summary: string | null;
  body_md: string | null;
  transcript: string | null;
  updated_at: string;
}

function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const slice = words.slice(i, i + CHUNK_TARGET_WORDS);
    chunks.push(slice.join(' '));
    if (i + CHUNK_TARGET_WORDS >= words.length) break;
    i += CHUNK_TARGET_WORDS - CHUNK_OVERLAP_WORDS;
  }
  return chunks;
}

function buildLessonText(lesson: Lesson): string {
  const parts = [
    `שיעור: ${lesson.title}`,
    lesson.summary ?? '',
    lesson.body_md ?? '',
    lesson.transcript ?? '',
  ].filter(Boolean);
  return parts.join('\n\n');
}

async function embed(texts: string[]): Promise<number[][]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (openaiKey) {
    const r = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
    });
    if (!r.ok) throw new Error(`OpenAI embedding failed: ${r.status} ${await r.text()}`);
    const j = await r.json();
    return j.data.map((d: { embedding: number[] }) => d.embedding);
  }

  if (geminiKey) {
    // Gemini API requires one-at-a-time for embedContent
    const embeddings: number[][] = [];
    for (const text of texts) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] },
          }),
        },
      );
      if (!r.ok) throw new Error(`Gemini embedding failed: ${r.status} ${await r.text()}`);
      const j = await r.json();
      embeddings.push(j.embedding.values);
    }
    return embeddings;
  }

  throw new Error('Set OPENAI_API_KEY or GEMINI_API_KEY.');
}

async function main() {
  const force = process.argv.includes('--force');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('Loading published lessons...');
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, title, summary, body_md, transcript, updated_at')
    .eq('is_published', true);

  if (error || !lessons) {
    console.error('Failed to load lessons:', error);
    process.exit(1);
  }

  console.log(`Found ${lessons.length} published lessons.`);

  for (const lesson of lessons as Lesson[]) {
    const text = buildLessonText(lesson);
    if (text.trim().length < 100) {
      console.log(`  skip ${lesson.title} (too short)`);
      continue;
    }

    // Check if this lesson's chunks are stale.
    if (!force) {
      const { data: existing } = await supabase
        .from('course_chunks')
        .select('id, created_at')
        .eq('lesson_id', lesson.id)
        .limit(1)
        .maybeSingle();

      if (existing && existing.created_at >= lesson.updated_at) {
        console.log(`  skip ${lesson.title} (chunks fresh)`);
        continue;
      }
    }

    const chunks = chunkText(text);
    console.log(`  ${lesson.title}: ${chunks.length} chunks`);

    // Clear existing chunks for this lesson, then insert fresh.
    await supabase.from('course_chunks').delete().eq('lesson_id', lesson.id);

    const embeddings = await embed(chunks);
    const rows = chunks.map((content, idx) => ({
      lesson_id: lesson.id,
      chunk_index: idx,
      content,
      tokens: content.split(/\s+/).length,
      embedding: embeddings[idx] as unknown as string, // pgvector accepts array literal
    }));

    const { error: insertErr } = await supabase.from('course_chunks').insert(rows);
    if (insertErr) {
      console.error(`    insert failed: ${insertErr.message}`);
    }
  }

  console.log('Done. Run `ANALYZE course_chunks;` in SQL editor to update index statistics.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
