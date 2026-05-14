// Supabase Edge Function: chat-ai
// Receives a user message + conversation_id, persists user message,
// builds context (calc data + history + RAG when knowledge_chunks exist),
// calls Gemini, persists AI reply, returns reply.
//
// Env vars required:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-provided)
//   GEMINI_API_KEY  — set via: supabase secrets set GEMINI_API_KEY=...
//
// Optional:
//   GEMINI_CHAT_MODEL (default: gemini-2.5-flash)
//   GEMINI_EMBED_MODEL (default: text-embedding-004)

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CHAT_MODEL = Deno.env.get("GEMINI_CHAT_MODEL") || "gemini-2.5-flash";
const EMBED_MODEL = Deno.env.get("GEMINI_EMBED_MODEL") || "text-embedding-004";
const HISTORY_LIMIT = 10;
const RAG_TOP_K = 5;
const RAG_THRESHOLD = 0.72;

const SYSTEM_PROMPT_HE = `אתה יועץ AI של "הדרך לדירה" — קורס דיגיטלי על רכישת דירה והשקעות נדל"ן בישראל.

הנחיות:
- ענה בעברית, בטון מקצועי וחם.
- אם יש לך נתונים אישיים של המשתמש (תקציב, משכנתא, תוכנית עסקית) — השתמש בהם בתשובה.
- אם יש לך קטעים מתוכן הקורס — בסס את התשובה עליהם וצטט את שם המקור בסוף.
- אם המשתמש שואל דבר שאתה לא בטוח לגביו או שדורש פסיקה אישית (משפטית/פיננסית) — הצע לו לפתוח שיחה עם נציג אנושי דרך הכפתור "אני רוצה תשובה מאדם".
- שמור על תשובות תמציתיות (3-6 משפטים), עם bullets רק כשמתאים.
- אל תמציא מספרים. אם אין לך מידע מספרי מהמשתמש או מהקורס — אמור זאת.

המידע שאתה נותן הוא להעשרה בלבד ואינו ייעוץ פיננסי/משפטי מקצועי.`;

interface Body {
  conversation_id?: string;
  message: string;
  create_if_missing?: boolean;
  title?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return json({ error: "GEMINI_API_KEY not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing auth" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client for verifying user
    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Invalid auth" }, 401);
    }
    const userId = userData.user.id;

    // Admin client (bypasses RLS for inserts + cross-table reads)
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const body = (await req.json()) as Body;
    if (!body.message || !body.message.trim()) {
      return json({ error: "Empty message" }, 400);
    }

    // 1. Resolve / create conversation
    let conversationId = body.conversation_id;
    if (!conversationId) {
      if (!body.create_if_missing) {
        return json({ error: "conversation_id required" }, 400);
      }
      const { data: conv, error: convErr } = await admin
        .from("conversations")
        .insert({
          user_id: userId,
          title: body.title || body.message.slice(0, 60),
        })
        .select("id")
        .single();
      if (convErr || !conv) return json({ error: convErr?.message }, 500);
      conversationId = conv.id;
    } else {
      // Verify ownership
      const { data: conv } = await admin
        .from("conversations")
        .select("user_id")
        .eq("id", conversationId)
        .single();
      if (!conv || conv.user_id !== userId) {
        return json({ error: "Conversation not found" }, 404);
      }
    }

    // 2. Insert user message
    const { error: userMsgErr } = await admin.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: body.message.trim(),
      author_id: userId,
    });
    if (userMsgErr) return json({ error: userMsgErr.message }, 500);

    // 3. Load history (last N) + user calc context
    const { data: history } = await admin
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);
    const orderedHistory = (history || []).reverse();

    const { data: calcRows } = await admin
      .from("user_data")
      .select("tool_key, data, updated_at")
      .eq("user_id", userId);

    const calcContext = formatCalcContext(calcRows || []);

    // 4. RAG retrieval (if knowledge_chunks table + match_chunks RPC exist)
    let ragContext = "";
    const ragChunks = await retrieveChunks(admin, apiKey, body.message.trim());
    if (ragChunks && ragChunks.length) {
      ragContext = ragChunks
        .map((c: any, i: number) =>
          `[${i + 1}] (${c.source_file}) ${c.content}`,
        )
        .join("\n\n");
    }

    // 5. Build Gemini prompt
    const fullSystem = [
      SYSTEM_PROMPT_HE,
      calcContext && `\n--- נתוני המשתמש ---\n${calcContext}`,
      ragContext && `\n--- קטעים מתוכן הקורס ---\n${ragContext}`,
    ]
      .filter(Boolean)
      .join("\n");

    const contents = orderedHistory.map((m) => ({
      role: m.role === "ai" || m.role === "human" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent?key=${apiKey}`;
    const geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: fullSystem }] },
        contents,
        generationConfig: { temperature: 0.5, maxOutputTokens: 800 },
      }),
    });

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      return json({ error: "Gemini error", detail: errText }, 502);
    }

    const geminiData = await geminiResp.json();
    const aiText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "מצטער, לא הצלחתי לייצר תשובה. נסה לנסח שאלה אחרת או פתח שיחה עם נציג.";
    const usage = geminiData?.usageMetadata;
    const totalTokens = usage?.totalTokenCount ?? null;

    // 6. Persist AI message
    const sources = (ragChunks || []).map((c: any) => ({
      source_file: c.source_file,
      similarity: c.similarity,
    }));
    const { error: aiMsgErr } = await admin.from("messages").insert({
      conversation_id: conversationId,
      role: "ai",
      content: aiText,
      tokens_used: totalTokens,
      metadata: sources.length ? { sources } : {},
    });
    if (aiMsgErr) return json({ error: aiMsgErr.message }, 500);

    // 7. Usage event
    await admin.from("usage_events").insert({
      user_id: userId,
      tool_key: "chat",
      event_type: "chat_message",
    });

    return json({
      conversation_id: conversationId,
      reply: aiText,
      sources,
      tokens_used: totalTokens,
    });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function formatCalcContext(rows: { tool_key: string; data: any }[]) {
  if (!rows.length) return "";
  const parts: string[] = [];
  for (const r of rows) {
    if (!r.data || Object.keys(r.data).length === 0) continue;
    parts.push(`* ${r.tool_key}: ${JSON.stringify(r.data)}`);
  }
  return parts.join("\n");
}

async function retrieveChunks(
  admin: any,
  apiKey: string,
  query: string,
): Promise<any[] | null> {
  try {
    // Embed query via Gemini
    const embedUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${apiKey}`;
    const embedResp = await fetch(embedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: query }] },
        taskType: "RETRIEVAL_QUERY",
      }),
    });
    if (!embedResp.ok) return null;
    const embedData = await embedResp.json();
    const embedding = embedData?.embedding?.values;
    if (!embedding) return null;

    const { data, error } = await admin.rpc("match_chunks", {
      query_embedding: embedding,
      match_threshold: RAG_THRESHOLD,
      match_count: RAG_TOP_K,
    });
    if (error) {
      // pgvector not installed yet — silent fallback
      return null;
    }
    return data || [];
  } catch (_e) {
    return null;
  }
}
