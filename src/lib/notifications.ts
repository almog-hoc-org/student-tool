import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type AppNotification = Database['public']['Tables']['notifications']['Row'];

export async function listMyNotifications(userId: string, limit = 50): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function markRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/**
 * Subscribe to realtime inserts on the user's notifications.
 * Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  userId: string,
  onInsert: (n: AppNotification) => void,
): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      payload => {
        onInsert(payload.new as AppNotification);
      },
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export function categoryLabel(category: string | null): string {
  switch (category) {
    case 'support_reply': return 'תמיכה';
    case 'announcement': return 'הודעה';
    case 'reminder': return 'תזכורת';
    case 'achievement': return 'הישג';
    case 'admin_push': return 'מהמנהלת';
    default: return 'התראה';
  }
}
