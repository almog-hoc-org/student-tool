import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logToolUsed } from '@/lib/activity';

/**
 * Fires a `tool_used` activity row once when a calculator page mounts.
 * Server trigger updates profiles.last_active_at automatically.
 */
export function useTrackToolUse(toolKey: string) {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.id) logToolUsed(user.id, toolKey);
  }, [user?.id, toolKey]);
}
