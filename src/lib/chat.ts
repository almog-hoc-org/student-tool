import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';

export type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row'];

export interface SourceRef {
  lesson_title: string;
  lesson_slug: string;
  module_slug: string;
  course_slug: string;
  similarity: number;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceRef[];
}

export interface RagResponse {
  reply: string;
  sources: SourceRef[];
  threadId: string;
}

/**
 * Calls the chat-rag Supabase Edge Function.
 * Returns the assistant reply with grounding sources.
 */
export async function sendRagMessage(
  message: string,
  threadId?: string,
  lessonId?: string,
): Promise<RagResponse> {
  const { data, error } = await supabase.functions.invoke<RagResponse>('chat-rag', {
    body: { message, threadId, lessonId },
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('empty response');
  return data;
}

export async function loadThread(userId: string, threadId: string): Promise<ChatTurn[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('role, content, sources, created_at')
    .eq('user_id', userId)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(r => ({
    role: r.role,
    content: r.content,
    sources: parseSources(r.sources),
  }));
}

export async function listRecentThreads(userId: string, limit = 10): Promise<Array<{
  thread_id: string;
  last_message_at: string;
  preview: string;
}>> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('thread_id, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  const seen = new Map<string, { thread_id: string; last_message_at: string; preview: string }>();
  for (const row of data ?? []) {
    if (!seen.has(row.thread_id)) {
      seen.set(row.thread_id, {
        thread_id: row.thread_id,
        last_message_at: row.created_at,
        preview: row.content.slice(0, 80),
      });
    }
    if (seen.size >= limit) break;
  }
  return Array.from(seen.values());
}

function parseSources(raw: Json | null): SourceRef[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.filter((s): s is SourceRef =>
    typeof s === 'object' && s !== null && 'lesson_slug' in s,
  );
}
