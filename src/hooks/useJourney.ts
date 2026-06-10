import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  JourneyRow,
  MILESTONES,
  MilestoneKey,
  currentMilestone,
  isMilestoneDone,
  listJourney,
  nextMilestone,
  upsertMilestone,
} from '@/lib/journey';
import { logUsageEvent } from '@/lib/cloud-storage';

interface UseJourneyResult {
  rows: JourneyRow[];
  loading: boolean;
  current: MilestoneKey;
  next: MilestoneKey | null;
  completed: MilestoneKey[];
  completedCount: number;
  total: number;
  isDone: (key: MilestoneKey) => boolean;
  complete: (key: MilestoneKey, data?: Record<string, unknown>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useJourney(): UseJourneyResult {
  const { user } = useAuth();
  const [rows, setRows] = useState<JourneyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setRows(await listJourney(user.id));
    } catch (err) {
      console.error('useJourney refresh failed', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const complete = useCallback(
    async (key: MilestoneKey, data?: Record<string, unknown>) => {
      if (!user?.id) return;
      await upsertMilestone(user.id, key, { completed: true, data });
      void logUsageEvent(user.id, 'journey', `milestone_complete:${key}`);
      await refresh();
    },
    [refresh, user?.id],
  );

  const completed = MILESTONES.filter((m) => isMilestoneDone(rows, m));

  return {
    rows,
    loading,
    current: currentMilestone(rows),
    next: nextMilestone(rows),
    completed,
    completedCount: completed.length,
    total: MILESTONES.length,
    isDone: (key) => isMilestoneDone(rows, key),
    complete,
    refresh,
  };
}
