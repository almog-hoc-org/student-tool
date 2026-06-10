import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FileCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { listJourney, upsertMilestone, type JourneyRow } from '@/lib/journey';
import { LABELS } from '@/lib/content/labels';
import { LoadingState } from '@/components/ui/loading-state';

export function PrePurchaseChecklist() {
  const { user } = useAuth();
  const items = LABELS.journey.prePurchase.items;
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const rows: JourneyRow[] = await listJourney(user.id);
        const row = rows.find((r) => r.milestone_key === 'pre_purchase');
        const data = (row?.data ?? {}) as { checklist?: Record<string, boolean> };
        setChecked(
          Object.fromEntries(
            Object.entries(data.checklist ?? {}).map(([k, v]) => [Number(k), !!v]),
          ),
        );
      } catch (e) {
        console.error('load checklist', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const completedCount = useMemo(
    () => Object.values(checked).filter(Boolean).length,
    [checked],
  );

  const persist = useCallback(
    async (next: Record<number, boolean>) => {
      if (!user?.id) return;
      setSaving(true);
      try {
        const allDone = items.every((_, i) => next[i]);
        await upsertMilestone(user.id, 'pre_purchase', {
          completed: allDone,
          data: { checklist: next },
        });
      } catch (e) {
        console.error('save checklist', e);
      } finally {
        setSaving(false);
      }
    },
    [items, user?.id],
  );

  const toggle = (idx: number) => {
    const next = { ...checked, [idx]: !checked[idx] };
    setChecked(next);
    void persist(next);
  };

  if (loading) return <LoadingState />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-primary" />
            {LABELS.journey.prePurchase.title}
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            {completedCount}/{items.length}
            {saving && ' · שומר…'}
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground pt-1">
          {LABELS.journey.prePurchase.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, idx) => (
          <label
            key={idx}
            className="flex items-start gap-3 text-sm cursor-pointer p-2 rounded-lg hover:bg-muted/40"
          >
            <Checkbox
              checked={!!checked[idx]}
              onCheckedChange={() => toggle(idx)}
              className="mt-0.5"
              aria-label={item}
            />
            <span className={checked[idx] ? 'line-through text-muted-foreground' : ''}>
              {item}
            </span>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
