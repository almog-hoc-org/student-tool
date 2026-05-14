import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Activity, MessageCircle, Bookmark, BellRing, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ActivityRow {
  event_kind: 'usage' | 'message' | 'snapshot' | 'notification';
  event_type: string;
  tool_key: string | null;
  content: string | null;
  occurred_at: string;
}

interface Props {
  userId: string | null;
  userLabel: string | null;
  onClose: () => void;
}

const ICONS = {
  usage: Wrench,
  message: MessageCircle,
  snapshot: Bookmark,
  notification: BellRing,
};

const KIND_COLORS = {
  usage: 'bg-blue-500/10 text-blue-600',
  message: 'bg-emerald-500/10 text-emerald-600',
  snapshot: 'bg-amber-500/10 text-amber-600',
  notification: 'bg-purple-500/10 text-purple-600',
};

export function UserDrawer({ userId, userLabel, onClose }: Props) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .rpc('admin_user_activity', { _user_id: userId, _limit: 200 })
      .then(({ data, error }) => {
        if (!error && data) setRows(data as ActivityRow[]);
        setLoading(false);
      });
  }, [userId]);

  return (
    <Sheet open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent dir="rtl" side="left" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            פעילות התלמיד
          </SheetTitle>
          <SheetDescription>{userLabel}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 h-[calc(100vh-150px)]">
          {loading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> טוען…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">
              עוד אין פעילות מתועדת
            </p>
          ) : (
            <ScrollArea className="h-full pr-2">
              <div className="space-y-2 pb-8">
                {rows.map((r, idx) => {
                  const Icon = ICONS[r.event_kind];
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2.5 rounded-lg border"
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                          KIND_COLORS[r.event_kind],
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {labelFor(r)}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(r.occurred_at).toLocaleString('he-IL')}
                          </span>
                        </div>
                        {r.content && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {r.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function labelFor(r: ActivityRow): string {
  switch (r.event_kind) {
    case 'usage':
      return `${r.event_type} · ${r.tool_key ?? ''}`;
    case 'message':
      return `הודעה (${r.event_type})`;
    case 'snapshot':
      return `שמירה · ${r.tool_key ?? ''}`;
    case 'notification':
      return `התראה · ${r.event_type}`;
  }
}
