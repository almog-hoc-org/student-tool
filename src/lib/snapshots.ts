import { supabase } from '@/integrations/supabase/client';

export interface Snapshot {
  id: string;
  tool_key: string;
  name: string;
  data: unknown;
  notes: string | null;
  created_at: string;
}

export async function listSnapshots(toolKey?: string): Promise<Snapshot[]> {
  let q = supabase
    .from('calculation_snapshots')
    .select('id, tool_key, name, data, notes, created_at')
    .order('created_at', { ascending: false });
  if (toolKey) q = q.eq('tool_key', toolKey);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as Snapshot[];
}

export async function saveSnapshot(input: {
  userId: string;
  toolKey: string;
  name: string;
  data: unknown;
  notes?: string;
}): Promise<Snapshot> {
  const { data, error } = await supabase
    .from('calculation_snapshots')
    .insert({
      user_id: input.userId,
      tool_key: input.toolKey,
      name: input.name,
      data: input.data as never,
      notes: input.notes ?? null,
    })
    .select('id, tool_key, name, data, notes, created_at')
    .single();
  if (error) throw error;

  // Log usage event (best-effort)
  supabase
    .from('usage_events')
    .insert({
      user_id: input.userId,
      tool_key: input.toolKey,
      event_type: 'snapshot_saved',
    })
    .then(() => {});

  return data as Snapshot;
}

export async function deleteSnapshot(id: string): Promise<void> {
  const { error } = await supabase
    .from('calculation_snapshots')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export const TOOL_LABELS: Record<string, string> = {
  budget: 'תקציב',
  business_plan: 'תוכנית עסקית',
  mortgage: 'משכנתא',
};
