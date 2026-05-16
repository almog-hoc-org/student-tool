import { useEffect, useState } from 'react';
import { Bookmark, Loader2, Trash2, Calendar } from 'lucide-react';
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
      {snapshots.map((s) => (
        <Card key={s.id}>
          <CardContent className="p-3 flex items-center gap-3">
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
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {s.notes}
                </p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
