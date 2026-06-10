import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Target, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getGoal, upsertGoal, type Goal } from '@/lib/goals';
import { useJourney } from '@/hooks/useJourney';
import { logUsageEvent } from '@/lib/cloud-storage';
import { LoadingState } from '@/components/ui/loading-state';
import { LABELS } from '@/lib/content/labels';
import { formatCurrency } from '@/lib/validation/validators';

export interface GoalFormProps {
  onSaved?: (g: Goal) => void;
  compact?: boolean;
}

export function GoalForm({ onSaved, compact = false }: GoalFormProps) {
  const { user } = useAuth();
  const { complete } = useJourney();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [targetPrice, setTargetPrice] = useState<number | ''>('');
  const [targetArea, setTargetArea] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlySaving, setMonthlySaving] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const g = await getGoal(user.id);
        setTargetPrice(g.target_price ?? '');
        setTargetArea(g.target_area ?? '');
        setTargetDate(g.target_date ?? '');
        setMonthlySaving(g.monthly_saving ?? '');
        setNotes(g.notes ?? '');
      } catch (e) {
        console.error('load goal', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  if (loading) return <LoadingState />;

  const valid = Number(targetPrice) > 0;

  const handleSave = async () => {
    if (!user?.id || !valid) return;
    setSaving(true);
    try {
      const saved = await upsertGoal(user.id, {
        target_price: Number(targetPrice) || null,
        target_area: targetArea.trim() || null,
        target_date: targetDate || null,
        monthly_saving: Number(monthlySaving) || null,
        notes: notes.trim() || null,
      });
      await complete('goal', { target_price: saved.target_price });
      void logUsageEvent(user.id, 'goal', 'goal_set');
      toast.success(LABELS.goal.saved);
      onSaved?.(saved);
    } catch (e) {
      console.error('save goal', e);
      toast.error('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className={compact ? 'pb-2' : 'pb-3'}>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          {LABELS.goal.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{LABELS.goal.targetPriceLabel}</Label>
            <Input
              type="number"
              min={0}
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value ? Number(e.target.value) : '')}
              placeholder={LABELS.goal.targetPricePlaceholder}
            />
            {Number(targetPrice) > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {formatCurrency(Number(targetPrice))}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{LABELS.goal.targetAreaLabel}</Label>
            <Input
              value={targetArea}
              onChange={(e) => setTargetArea(e.target.value)}
              placeholder={LABELS.goal.targetAreaPlaceholder}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{LABELS.goal.targetDateLabel}</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">חיסכון חודשי משוער</Label>
            <Input
              type="number"
              min={0}
              value={monthlySaving}
              onChange={(e) => setMonthlySaving(e.target.value ? Number(e.target.value) : '')}
              placeholder="2,500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{LABELS.goal.notesLabel}</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="שכונה, סוג נכס, חדרים…"
          />
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} disabled={!valid || saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'שומר…' : LABELS.common.save}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
