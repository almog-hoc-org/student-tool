import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type ActivityType =
  | 'tool_used'
  | 'lesson_viewed'
  | 'lesson_completed'
  | 'chat_message'
  | 'support_opened'
  | 'support_replied'
  | 'login'
  | 'enrollment';

export interface LogActivityInput {
  userId: string;
  type: ActivityType;
  resourceId?: string;
  metadata?: Json;
}

/**
 * Fire-and-forget activity log. Never blocks the UI; failures are silent.
 * Server-side trigger updates profiles.last_active_at automatically.
 */
export function logActivity({ userId, type, resourceId, metadata }: LogActivityInput): void {
  supabase
    .from('student_activity')
    .insert({
      user_id: userId,
      activity_type: type,
      resource_id: resourceId ?? null,
      metadata: metadata ?? null,
    })
    .then(() => {});
}

/**
 * Tool-touch helper — call when student loads/interacts with a calculator.
 * `toolKey` matches the storage keys: 'budget' | 'mortgage' | 'business_plan' | ...
 */
export function logToolUsed(userId: string, toolKey: string): void {
  logActivity({ userId, type: 'tool_used', resourceId: toolKey });
}
