import { useEffect, useMemo, useState } from 'react';
import { Bookmark, Loader2, Trash2, Calendar, ArrowRight, ArrowLeftRight, ArrowDown, ArrowUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  listSnapshots,
  deleteSnapshot,
  type Snapshot,
  TOOL_LABELS,
} from '@/lib/snapshots';
import { save } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { diffSnapshots, type DiffRow } from '@/lib/snapshot-diff';
import { cn } from '@/lib/utils';

const TOOL_ROUTE: Record<string, string> = {
  budget: '/',
  business_plan: '/business-plan',
  mortgage: '/mortgage',
};

export function SnapshotsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Index snapshots: for each, find the next-older snapshot of the same tool
  // so we know what to diff against.
  const olderByTool = useMemo(() => {
    const map = new Map<string, Snapshot | null>();
    // Snapshots are ordered DESC by created_at, so for each one the next item
    // with the same tool_key (further down in the array) is the prior version.
    for (let i = 0; i < snapshots.length; i++) {
      const s = snapshots[i];
      let older: Snapshot | null = null;
      for (let j = i + 1; j < snapshots.length; j++) {
        if (snapshots[j].tool_key === s.tool_key) { older = snapshots[j]; break; }
      }
      map.set(s.id, older);
    }
    return map;
  }, [snapshots]);

  const refresh = async (cancelled?: { current: boolean }) => {
    try {
      setLoading(true);
      const data = await listSnapshots();
      if (cancelled?.current) return;
      setSnapshots(data);
    } catch (e) {
      if (!cancelled?.current) toast.error('שגיאה בטעינת תרחישים');
      console.error(e);
    } finally {
      if (!cancelled?.current) setLoading(false);
    }
  };

  useEffect(() => {
    const cancelled = { current: false };
    refresh(cancelled);
    return () => { cancelled.current = true; };
  }, []);

  const handleLoad = (s: Snapshot) => {
    save(s.tool_key, s.data as unknown, user?.id);
    toast.success(`נטען: "${s.name}"`);
    const route = TOOL_ROUTE[s.tool_key] || '/';
    navigate(route);
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteSnapshot(id);
      setSnapshots((s) => s.filter((x) => x.id !== id));
      toast.success('נמחק');
    } catch (e) {
      toast.error('שגיאה במחיקה');
      console.error(e);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> טוען תרחישים…
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-2">
          <Bookmark className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            עוד לא שמרת תרחישים. כשתבנה חישוב — לחץ על "שמור תרחיש" כדי לחזור
            אליו אחר כך.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {snapshots.map((s) => {
        const older = olderByTool.get(s.id);
        const canDiff = !!older;
        const isOpen = expandedId === s.id;
        return (
          <Card key={s.id}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bookmark className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium truncate">{s.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {TOOL_LABELS[s.tool_key] ?? s.tool_key}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(s.created_at).toLocaleString('he-IL')}
                  </p>
                  {s.notes && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{s.notes}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {canDiff && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(isOpen ? null : s.id)}
                      className="gap-1"
                      title="השווה לתרחיש הקודם"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      {isOpen ? 'סגור' : 'השווה'}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleLoad(s)}>
                    טען
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(s.id)}
                    disabled={busyId === s.id}
                  >
                    {busyId === s.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </div>

              {isOpen && older && (
                <DiffBlock current={s} older={older} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DiffBlock({ current, older }: { current: Snapshot; older: Snapshot }) {
  const rows = useMemo(
    () => diffSnapshots(older.data, current.data),
    [current, older],
  );

  return (
    <div className="border-t pt-2 mt-1 space-y-2">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
        <span>השוואה מול</span>
        <Badge variant="outline" className="text-[10px] gap-1">
          <Bookmark className="w-3 h-3" />
          {older.name}
        </Badge>
        <span>({new Date(older.created_at).toLocaleDateString('he-IL')})</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          אין שינויים בין שני התרחישים.
        </p>
      ) : (
        <div className="space-y-1">
          {rows.map((row) => (
            <DiffRowView key={row.key} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function DiffRowView({ row }: { row: DiffRow }) {
  const TrendIcon =
    row.trend === 'up' ? ArrowUp : row.trend === 'down' ? ArrowDown : null;
  const trendColor =
    row.trend === 'up'
      ? 'text-emerald-600'
      : row.trend === 'down'
        ? 'text-amber-600'
        : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-2 text-sm py-1 px-2 rounded-md hover:bg-muted/40">
      <span className="text-muted-foreground text-xs min-w-0 flex-1 truncate">{row.label}</span>
      <span className="text-xs tabular-nums text-muted-foreground line-through opacity-70">
        {row.before}
      </span>
      <ArrowRight className={cn('w-3 h-3', trendColor)} />
      <span className={cn('text-xs tabular-nums font-medium', trendColor)}>
        {row.after}
      </span>
      {TrendIcon && <TrendIcon className={cn('w-3 h-3', trendColor)} />}
    </div>
  );
}
