import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DbNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, body, link, metadata, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setItems(data as DbNotification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchAll();
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setItems((curr) => [payload.new as DbNotification, ...curr].slice(0, 50));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAll]);

  const markRead = useCallback(async (id: string) => {
    setItems((curr) =>
      curr.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    );
    await supabase.rpc('mark_notification_read', { _id: id });
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((curr) => curr.map((n) => ({ ...n, read_at: n.read_at ?? now })));
    await supabase.rpc('mark_all_notifications_read');
  }, []);

  const remove = useCallback(async (id: string) => {
    setItems((curr) => curr.filter((n) => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  }, []);

  const unreadCount = items.filter((n) => !n.read_at).length;

  return { items, loading, unreadCount, markRead, markAllRead, remove, refresh: fetchAll };
}
