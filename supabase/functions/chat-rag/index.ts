// Supabase Edge Function — RAG chat backend.
//
// Endpoint: POST /functions/v1/chat-rag
// Body: { message: string, threadId?: string, lessonId?: string }
// Returns: { reply: string, sources: SourceRef[], threadId: string }
//
// Provider selection (in priority order):
//   1. OPENAI_API_KEY → uses gpt-4o-mini for completion, text-embedding-3-small for embedding
//   2. GEMINI_API_KEY → uses gemini-1.5-flash for completion, text-embedding-004 for embedding
//      (requires re-running the migration with vector(768) instead of vector(1536))
//
// Auth: requires a valid user JWT (passes through Authorization header).
// Edge function inherits user identity for RLS via the createClient initialization.

// deno-lint-ignore-file no-explicit-any

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SYSTEM_PROMPT = `אתה יועץ בקורס "הדרך לדירה" — קורס השקעות נדל"ן בישראל.
ענה בעברית, ברורה ומקצועית. תן תשובות קצרות (2-4 פסקאות).
המשתמש לומד את הקורס; השתמש אך ורק בקטעי הידע שצורפו כדי לענות. אם המידע לא מספיק — כתוב במפורש שהשאלה חורגת מתוכן הקורס וה צע למשתמש לפנות לתמיכה.
התייחס לחישובים מספריים בזהירות ואל תיתן ייעוץ פיננסי ספציפי.`;

interface ChatRequest {
  message: string;
  threadId?: string;
  lessonId?: string;
}

interface SourceRef {
  lesson_title: string;
  lesson_slug: string;
  module_slug: string;
  course_slug: string;
  similarity: number;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return cors(new Response('ok'));
  }

  try {
    const body = (await req.json()) as ChatRequest;
    if (!body.message?.trim()) {
      return cors(new Response(JSON.stringify({ error: 'message required' }), { status: 400 }));
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return cors(new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }));
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return cors(new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }));
    }

    const userId = userData.user.id;
    const threadId = body.threadId ?? crypto.randomUUID();

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    if (!openaiKey && !geminiKey) {
      return cors(new Response(
        JSON.stringify({ error: 'no provider configured. set OPENAI_API_KEY or GEMINI_API_KEY in Supabase secrets' }),
        { status: 503 },
      ));
    }

    // 1. Embed the user's message
    const embedding = openaiKey
      ? await embedOpenAI(body.message, openaiKey)
      : await embedGemini(body.message, geminiKey!);

    // 2. Vector similarity search
    const { data: matches, error: matchErr } = await supabase.rpc('match_course_chunks', {
      query_embedding: embedding as any,
      match_count: 5,
      min_similarity: 0.4,
    });

    if (matchErr) {
      return cors(new Response(JSON.stringify({ error: 'search failed: ' + matchErr.message }), { status: 500 }));
    }

    const context = (matches ?? [])
      .map((m: any, i: number) => `[קטע ${i + 1}] (${m.lesson_title})\n${m.content}`)
      .join('\n\n');

    const sources: SourceRef[] = (matches ?? []).map((m: any) => ({
      lesson_title: m.lesson_title,
      lesson_slug: m.lesson_slug,
      module_slug: m.module_slug,
      course_slug: m.course_slug,
      similarity: m.similarity,
    }));

    // 3. Get recent thread context (last 6 messages)
    const { data: recent } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(6);

    const history = (recent ?? []).reverse();

    // 4. Build prompt and call LLM
    const prompt = `${SYSTEM_PROMPT}\n\n===\nקטעים רלוונטיים מהקורס:\n${context || '(אין קטעים רלוונטיים)'}\n===\n`;

    const reply = openaiKey
      ? await chatOpenAI(prompt, history, body.message, openaiKey)
      : await chatGemini(prompt, history, body.message, geminiKey!);

    // 5. Persist both messages
    await supabase.from('chat_messages').insert([
      { user_id: userId, thread_id: threadId, role: 'user', content: body.message },
      { user_id: userId, thread_id: threadId, role: 'assistant', content: reply, sources },
    ]);

    return cors(new Response(JSON.stringify({ reply, sources, threadId }), {
      headers: { 'Content-Type': 'application/json' },
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return cors(new Response(JSON.stringify({ error: msg }), { status: 500 }));
  }
});

function cors(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, apikey');
  return new Response(res.body, { status: res.status, headers });
}

async function embedOpenAI(text: string, apiKey: string): Promise<number[]> {
  const r = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });
  if (!r.ok) throw new Error(`OpenAI embedding failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return j.data[0].embedding;
}

async function embedGemini(text: string, apiKey: string): Promise<number[]> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
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
  return j.embedding.values;
}

async function chatOpenAI(
  system: string,
  history: { role: string; content: string }[],
  user: string,
  apiKey: string,
): Promise<string> {
  const messages = [
    { role: 'system', content: system },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: user },
  ];
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
    }),
  });
  if (!r.ok) throw new Error(`OpenAI chat failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return j.choices[0].message.content.trim();
}

async function chatGemini(
  system: string,
  history: { role: string; content: string }[],
  user: string,
  apiKey: string,
): Promise<string> {
  const contents = [
    ...history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: user }] },
  ];
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: { temperature: 0.3 },
      }),
    },
  );
  if (!r.ok) throw new Error(`Gemini chat failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return j.candidates[0].content.parts[0].text.trim();
}
