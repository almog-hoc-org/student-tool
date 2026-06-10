import { supabase } from '@/integrations/supabase/client';

export interface Goal {
  target_price: number | null;
  target_area: string | null;
  target_date: string | null;
  monthly_saving: number | null;
  notes: string | null;
  updated_at: string | null;
}

const EMPTY: Goal = {
  target_price: null,
  target_area: null,
  target_date: null,
  monthly_saving: null,
  notes: null,
  updated_at: null,
};

// Types for goals/journey land in the generated supabase types after the next
// regen pass. Until then we cast — RLS still enforces access at runtime.
const db = supabase as unknown as {
  from: (t: string) => ReturnType<typeof supabase.from>;
};

export async function getGoal(userId: string): Promise<Goal> {
  const { data, error } = await db
    .from('goals')
    .select('target_price, target_area, target_date, monthly_saving, notes, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Goal | null) ?? EMPTY;
}

export async function upsertGoal(
  userId: string,
  patch: Partial<Omit<Goal, 'updated_at'>>,
): Promise<Goal> {
  const payload = { user_id: userId, ...patch };
  const { data, error } = await db
    .from('goals')
    .upsert(payload, { onConflict: 'user_id' })
    .select('target_price, target_area, target_date, monthly_saving, notes, updated_at')
    .single();
  if (error) throw error;
  return data as Goal;
}

export function isGoalSet(goal: Goal | null | undefined): boolean {
  return !!goal && (goal.target_price ?? 0) > 0;
}
