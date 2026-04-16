import { supabase } from '@/integrations/supabase/client';

export async function saveToCloud(userId: string, toolKey: string, data: unknown): Promise<void> {
  await supabase
    .from('user_data')
    .upsert(
      { user_id: userId, tool_key: toolKey, data: data as any, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,tool_key' }
    );
}

export async function loadFromCloud(userId: string, toolKey: string): Promise<unknown | null> {
  const { data } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .eq('tool_key', toolKey)
    .single();
  return data?.data ?? null;
}

export async function loadAllFromCloud(userId: string): Promise<Record<string, unknown>> {
  const { data } = await supabase
    .from('user_data')
    .select('tool_key, data')
    .eq('user_id', userId);
  const result: Record<string, unknown> = {};
  data?.forEach(row => { result[row.tool_key] = row.data; });
  return result;
}

export async function logUsageEvent(userId: string, toolKey: string, eventType: string = 'save'): Promise<void> {
  await supabase
    .from('usage_events')
    .insert({ user_id: userId, tool_key: toolKey, event_type: eventType });
}
