// Supabase Edge Function: ingest-content
// Admin-only. Chunks user-supplied text, embeds each chunk via Gemini
// text-embedding-004 (768 dims), upserts into knowledge_chunks.
//
// POST body:
//   {
//     source_file: string,            // display name shown to admin (and as RAG citation)
//     source_id?: string,             // dedup key — same id replaces previous chunks
//     content: string,                // raw text (markdown OK)
//     metadata?: Record<string, any>  // free-form
//   }
//
// Response: { ok: true, source_id, chunks_inserted }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMBED_MODEL = Deno.env.get("GEMINI_EMBED_MODEL") || "text-embedding-004";
const CHUNK_WORDS = 280;
const CHUNK_OVERLAP = 40;

interface Body {
  source_file: string;
  source_id?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return json({ error: "unauthorized" }, 401);

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  if (!roles?.some((r: { role: string }) => r.role === "admin")) {
    return json({ error: "admin role required" }, 403);
  }

  let body: Body;
  try { body = await req.json(); } catch { return json({ error: "invalid JSON" }, 400); }

  if (!body.source_file?.trim() || !body.content?.trim()) {
    return json({ error: "source_file and content are required" }, 400);
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) return json({ error: "GEMINI_API_KEY not configured" }, 503);

  const sourceId = body.source_id || crypto.randomUUID();

  // Service-role client for DB writes (bypasses RLS)
  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Replace any previous chunks for this source_id
  await service.from("knowledge_chunks").delete().eq("source_id", sourceId);

  const chunks = chunkText(body.content);
  if (chunks.length === 0) return json({ error: "content too short" }, 400);

  const rows = [];
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embed(chunks[i], geminiKey);
    rows.push({
      source_file: body.source_file.trim(),
      source_id: sourceId,
      chunk_index: i,
      content: chunks[i],
      embedding,
      metadata: body.metadata ?? {},
    });
  }

  const { error } = await service.from("knowledge_chunks").insert(rows);
  if (error) return json({ error: `db insert failed: ${error.message}` }, 500);

  return json({ ok: true, source_id: sourceId, chunks_inserted: rows.length });
});

function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const out: string[] = [];
  let i = 0;
  while (i < words.length) {
    out.push(words.slice(i, i + CHUNK_WORDS).join(" "));
    if (i + CHUNK_WORDS >= words.length) break;
    i += CHUNK_WORDS - CHUNK_OVERLAP;
  }
  return out;
}

async function embed(text: string, key: string): Promise<number[]> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
      }),
    },
  );
  if (!r.ok) throw new Error(`Gemini embed ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.embedding.values as number[];
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
