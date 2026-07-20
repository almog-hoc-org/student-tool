import { supabase } from '@/integrations/supabase/client';

export interface Snapshot {
  id: string;
  tool_key: string;
  name: string;
  data: unknown;
  notes: string | null;
  created_at: string;
}

// --- מצב E2E (פיתוח בלבד) -------------------------------------------------
// בסביבת צילומי מסך אין גישה ל-Supabase, אז ה-CRUD עובד מול localStorage.
// import.meta.env.DEV הוא false סטטי ב-production — כל הענף נמחק מהבאנדל.
const E2E = import.meta.env.DEV && import.meta.env.VITE_E2E === '1';
const E2E_KEY = 'e2e_snapshots';

function e2eRead(): Snapshot[] {
  try {
    return JSON.parse(localStorage.getItem(E2E_KEY) ?? '[]') as Snapshot[];
  } catch {
    return [];
  }
}

function e2eWrite(items: Snapshot[]): void {
  localStorage.setItem(E2E_KEY, JSON.stringify(items));
}
// ---------------------------------------------------------------------------

export async function listSnapshots(
  toolKeyOrOpts?: string | { toolKey?: string; userId?: string },
): Promise<Snapshot[]> {
  const opts =
    typeof toolKeyOrOpts === 'string'
      ? { toolKey: toolKeyOrOpts }
      : (toolKeyOrOpts ?? {});
  if (E2E) {
    return e2eRead()
      .filter((s) => !opts.toolKey || s.tool_key === opts.toolKey)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  let q = supabase
    .from('calculation_snapshots')
    .select('id, tool_key, name, data, notes, created_at')
    .order('created_at', { ascending: false });
  if (opts.toolKey) q = q.eq('tool_key', opts.toolKey);
  // Defense-in-depth: RLS already enforces by user, but pass user_id when known.
  if (opts.userId) q = q.eq('user_id', opts.userId);
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
  if (E2E) {
    // אותה תקרה כמו הטריגר ב-DB — כדי שמצב התקרה ייראה גם בצילומי המסך
    const existing = e2eRead().filter((s) => s.tool_key === input.toolKey);
    if (existing.length >= 10) {
      throw new Error('הגעת למגבלת 10 שמורות — מחק שמורה ישנה כדי לשמור חדשה');
    }
    const snapshot: Snapshot = {
      id: crypto.randomUUID(),
      tool_key: input.toolKey,
      name: input.name,
      data: input.data,
      notes: input.notes ?? null,
      created_at: new Date().toISOString(),
    };
    e2eWrite([snapshot, ...e2eRead()]);
    return snapshot;
  }
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

export async function updateSnapshot(input: {
  id: string;
  name: string;
  data: unknown;
  notes?: string | null;
}): Promise<Snapshot> {
  if (E2E) {
    const items = e2eRead();
    const idx = items.findIndex((s) => s.id === input.id);
    if (idx < 0) throw new Error('snapshot not found');
    items[idx] = { ...items[idx], name: input.name, data: input.data, notes: input.notes ?? null };
    e2eWrite(items);
    return items[idx];
  }
  const { data, error } = await supabase
    .from('calculation_snapshots')
    .update({
      name: input.name,
      data: input.data as never,
      notes: input.notes ?? null,
    })
    .eq('id', input.id)
    .select('id, tool_key, name, data, notes, created_at')
    .single();
  if (error) throw error;

  return data as Snapshot;
}

export async function deleteSnapshot(id: string): Promise<void> {
  if (E2E) {
    e2eWrite(e2eRead().filter((s) => s.id !== id));
    return;
  }
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
