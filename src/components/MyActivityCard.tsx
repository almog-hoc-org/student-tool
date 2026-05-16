import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Wallet, Home, TrendingUp, MessageCircle, Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UsageEvent {
  id: string;
  tool_key: string;
  event_type: string;
  created_at: string;
}

interface Snapshot {
  id: string;
  tool_key: string;
  name: string;
  created_at: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  conversation_id: string;
}

type Activity =
  | { kind: 'usage'; ts: string; tool: string; type: string; id: string }
  | { kind: 'snapshot'; ts: string; tool: string; name: string; id: string }
  | { kind: 'message'; ts: string; preview: string; id: string };

const TOOL_LABEL: Record<string, string> = {
  budget: 'מחשבון תקציב',
  mortgage: 'מחשבון משכנתא',
  business_plan: 'תוכנית עסקית',
  chat: 'צ׳אט AI',
};

function toolIcon(tool: string) {
  switch (tool) {
    case 'budget': return Wallet;
    case 'mortgage': return Home;
    case 'business_plan': return TrendingUp;
    case 'chat': return MessageCircle;
    default: return Activity;
  }
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'לפני רגע';
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דק׳`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שע׳`;
  const days = Math.floor(diff / 86400);
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString('he-IL');
}

export function MyActivityCard() {
  const { user } = useAuth();
  const [items, setItems] = useState<Activity[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const cancelled = { current: false };
    (async () => {
      try {
        const [usageRes, snapsRes, msgsRes] = await Promise.all([
          supabase
            .from('usage_events')
            .select('id, tool_key, event_type, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20),
          supabase
            .from('calculation_snapshots')
            .select('id, tool_key, name, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('messages')
            .select('id, content, created_at, conversation_id, role')
            .eq('role', 'user')
            .order('created_at', { ascending: false })
            .limit(10),
        ]);
        if (cancelled.current) return;

        const all: Activity[] = [
          ...((usageRes.data as UsageEvent[] | null) ?? []).map((u) => ({
            kind: 'usage' as const,
            ts: u.created_at,
            tool: u.tool_key,
            type: u.event_type,
            id: u.id,
          })),
          ...((snapsRes.data as Snapshot[] | null) ?? []).map((s) => ({
            kind: 'snapshot' as const,
            ts: s.created_at,
            tool: s.tool_key,
            name: s.name,
            id: s.id,
          })),
          ...((msgsRes.data as Message[] | null) ?? []).map((m) => ({
            kind: 'message' as const,
            ts: m.created_at,
            preview: m.content.slice(0, 70),
            id: m.id,
          })),
        ];
        all.sort((a, b) => b.ts.localeCompare(a.ts));
        setItems(all.slice(0, 10));
      } catch {
        setItems([]);
      }
    })();
    return () => { cancelled.current = true; };
  }, [user]);

  if (!items) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">טוען פעילות…</CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return null; // hide quietly for brand-new users
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4" />
          הפעילות שלי לאחרונה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((it) => {
          if (it.kind === 'usage') {
            const Icon = toolIcon(it.tool);
            return (
              <Row key={`u-${it.id}`} icon={Icon} text={TOOL_LABEL[it.tool] ?? it.tool} ts={it.ts} />
            );
          }
          if (it.kind === 'snapshot') {
            return (
              <Row
                key={`s-${it.id}`}
                icon={Bookmark}
                text={<>שמרת תרחיש: <span className="font-medium">{it.name}</span></>}
                ts={it.ts}
              />
            );
          }
          return (
            <Row
              key={`m-${it.id}`}
              icon={MessageCircle}
              text={<span className="line-clamp-1">שאלת: "{it.preview}"</span>}
              ts={it.ts}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

function Row({
  icon: Icon,
  text,
  ts,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: React.ReactNode;
  ts: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm py-1 px-1 rounded-md hover:bg-muted/40">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">{text}</div>
      <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(ts)}</span>
    </div>
  );
}
