import { supabase } from '@/integrations/supabase/client';

export const MILESTONES = [
  'goal',
  'budget',
  'mortgage',
  'property_check',
  'pre_purchase',
] as const;

export type MilestoneKey = (typeof MILESTONES)[number];

export interface JourneyRow {
  milestone_key: MilestoneKey;
  completed_at: string | null;
  data: Record<string, unknown>;
  updated_at: string | null;
}

const db = supabase as unknown as {
  from: (t: string) => ReturnType<typeof supabase.from>;
};

export async function listJourney(userId: string): Promise<JourneyRow[]> {
  const { data, error } = await db
    .from('journey_progress')
    .select('milestone_key, completed_at, data, updated_at')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as JourneyRow[];
}

export async function upsertMilestone(
  userId: string,
  milestone: MilestoneKey,
  opts?: { completed?: boolean; data?: Record<string, unknown> },
): Promise<void> {
  const payload: Record<string, unknown> = {
    user_id: userId,
    milestone_key: milestone,
    data: opts?.data ?? {},
  };
  if (opts?.completed) payload.completed_at = new Date().toISOString();

  const { error } = await db
    .from('journey_progress')
    .upsert(payload, { onConflict: 'user_id,milestone_key' });
  if (error) throw error;
}

export function currentMilestone(rows: JourneyRow[]): MilestoneKey {
  for (const key of MILESTONES) {
    const row = rows.find((r) => r.milestone_key === key);
    if (!row?.completed_at) return key;
  }
  return MILESTONES[MILESTONES.length - 1];
}

export function isMilestoneDone(
  rows: JourneyRow[],
  milestone: MilestoneKey,
): boolean {
  return !!rows.find((r) => r.milestone_key === milestone)?.completed_at;
}

export function nextMilestone(rows: JourneyRow[]): MilestoneKey | null {
  const idx = MILESTONES.indexOf(currentMilestone(rows));
  if (idx < 0) return MILESTONES[0];
  return MILESTONES[idx] ?? null;
}
