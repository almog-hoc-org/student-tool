import { supabase } from '@/integrations/supabase/client';

export interface ChatDbMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'ai' | 'human' | 'system';
  content: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface ConversationRow {
  id: string;
  title: string | null;
  status: 'open' | 'awaiting_human' | 'resolved';
  last_message_at: string;
}

export async function listMyConversations(): Promise<ConversationRow[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, status, last_message_at')
    .order('last_message_at', { ascending: false });
  if (error) throw error;
  return (data || []) as ConversationRow[];
}

export async function getOrCreateLatestConversation(): Promise<ConversationRow> {
  const list = await listMyConversations();
  if (list.length > 0) return list[0];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: user.id, title: null })
    .select('id, title, status, last_message_at')
    .single();
  if (error) throw error;
  return data as ConversationRow;
}

export async function getConversation(id: string): Promise<ConversationRow | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, status, last_message_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as ConversationRow | null;
}

export async function loadMessages(conversationId: string): Promise<ChatDbMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, role, content, metadata, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as ChatDbMessage[];
}

export interface SendMessageResult {
  conversation_id: string;
  reply: string;
  sources?: { source_file: string; similarity: number }[];
  tokens_used?: number | null;
}

export async function sendAiMessage(
  message: string,
  conversationId: string | null,
): Promise<SendMessageResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('chat-ai', {
    body: {
      conversation_id: conversationId,
      message,
      create_if_missing: !conversationId,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as SendMessageResult;
}

export async function escalateToHuman(
  conversationId: string,
  reason?: string,
): Promise<void> {
  const { error } = await supabase.rpc('conversation_escalate_to_human', {
    _conversation_id: conversationId,
    _reason: reason ?? null,
  });
  if (error) throw error;
}
