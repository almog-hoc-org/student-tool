import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getGoal, type Goal } from '@/lib/goals';
import { load } from '@/lib/storage';
import { computeGap, type GapResult } from '@/lib/calculations/gap-analysis';
import { formatCurrency } from '@/lib/validation/validators';
import { LABELS } from '@/lib/content/labels';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

import type { BuyerType } from '@/lib/calculations/purchase-tax';

interface BudgetSaved {
  equity?: number;
  monthlyIncome?: number;
  buyerType?: BuyerType;
}

export function GapCard() {
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        setGoal(await getGoal(user.id));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  if (loading) return <LoadingState />;

  if (!goal || !(goal.target_price && goal.target_price > 0)) {
    return (
      <EmptyState
        icon={<Target className="w-6 h-6" />}
        title={LABELS.gap.title}
        description={LABELS.gap.noGoal}
        action={
          <Link
            to="/account"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            הגדר יעד
          </Link>
        }
      />
    );
  }

  const budget = load<BudgetSaved>('budget');
  const buyerType = budget?.buyerType ?? 'singleApartment';
  const result: GapResult = computeGap({
    targetPrice: goal.target_price,
    equity: budget?.equity ?? 0,
    monthlySaving: goal.monthly_saving ?? 0,
    targetDate: goal.target_date,
    buyerType,
  });

  const statusBadge = (() => {
    if (result.status === 'on_track')
      return { label: LABELS.gap.onTrack, className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: CheckCircle2 };
    if (result.status === 'no_budget')
      return { label: LABELS.gap.noGoal, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: AlertTriangle };
    return { label: LABELS.gap.behind, className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: AlertTriangle };
  })();
  const StatusIcon = statusBadge.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            {LABELS.gap.title}
          </span>
          <Badge variant="secondary" className={cn('gap-1', statusBadge.className)}>
            <StatusIcon className="w-3 h-3" />
            {statusBadge.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="מחיר יעד" value={formatCurrency(goal.target_price ?? 0)} />
          <Metric
            label={`הון נדרש (${Math.round(result.downPaymentPct * 100)}% + מס ועלויות)`}
            value={formatCurrency(result.requiredTotalEquity)}
          />
          <Metric label="הון נוכחי" value={formatCurrency(result.currentEquity)} />
          <Metric label={LABELS.gap.gapLabel} value={formatCurrency(result.gap)} highlight={result.gap > 0} />
        </div>
        <p className="text-[11px] text-muted-foreground">
          מקדמה {formatCurrency(result.requiredDownPayment)} + מס רכישה {formatCurrency(result.purchaseTax)} + עלויות נלוות {formatCurrency(result.sideCosts)}
        </p>

        {result.monthsToTarget !== null && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <Metric label={LABELS.gap.monthsLabel} value={`${result.monthsToTarget}`} />
            <Metric
              label={LABELS.gap.requiredMonthlyLabel}
              value={
                result.requiredMonthlySaving !== null
                  ? formatCurrency(result.requiredMonthlySaving)
                  : LABELS.common.notAvailable
              }
            />
          </div>
        )}

        {!budget && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            {LABELS.gap.noBudget}{' '}
            <Link to="/" className="text-primary underline-offset-4 hover:underline inline-flex items-center gap-1">
              למחשבון התקציב <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn('text-base font-semibold', highlight && 'text-destructive')}>
        {value}
      </p>
    </div>
  );
}
