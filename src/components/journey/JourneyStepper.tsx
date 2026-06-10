import { Card, CardContent } from '@/components/ui/card';
import { Check, Target, Wallet, Home, Search, FileCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MILESTONES, type MilestoneKey } from '@/lib/journey';
import { useJourney } from '@/hooks/useJourney';
import { LABELS } from '@/lib/content/labels';
import { cn } from '@/lib/utils';

const ICONS: Record<MilestoneKey, React.ComponentType<{ className?: string }>> = {
  goal: Target,
  budget: Wallet,
  business_plan: TrendingUp,
  mortgage: Home,
  property_check: Search,
  pre_purchase: FileCheck,
};

const ROUTES: Record<MilestoneKey, string> = {
  goal: '/account',
  budget: '/',
  business_plan: '/business-plan',
  mortgage: '/mortgage',
  property_check: '/property-check',
  pre_purchase: '/account',
};

export function JourneyStepper({ variant = 'auto' }: { variant?: 'auto' | 'horizontal' | 'compact' }) {
  const { isDone, current, loading, completedCount, total } = useJourney();
  if (loading) return null;
  const pct = Math.round((completedCount / total) * 100);

  return (
    <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground">
            {LABELS.account.journeyTitle}
          </span>
          <span className="font-bold">{completedCount}/{total} · {pct}%</span>
        </div>

        {/* Desktop / wider screens: row of 5 */}
        <div className={cn('hidden sm:flex items-center gap-1', variant === 'horizontal' ? 'flex sm:flex' : '')}>
          {MILESTONES.map((m, i) => {
            const done = isDone(m);
            const active = current === m;
            const Icon = ICONS[m];
            return (
              <Link
                to={ROUTES[m]}
                key={m}
                className={cn(
                  'flex-1 group flex flex-col items-center gap-1 p-2 rounded-xl transition-colors',
                  active ? 'bg-primary/10' : 'hover:bg-muted/60',
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center',
                    done
                      ? 'bg-primary text-primary-foreground'
                      : active
                        ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={cn(
                    'text-[11px] font-medium text-center',
                    done || active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {LABELS.journey.steps[m].name}
                </span>
                {i < MILESTONES.length - 1 && (
                  <span className="sr-only">→</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile: dots + active step name */}
        <div className="sm:hidden flex items-center gap-3">
          <div className="flex gap-1.5 items-center">
            {MILESTONES.map((m) => {
              const done = isDone(m);
              const active = current === m;
              return (
                <span
                  key={m}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    done
                      ? 'bg-primary'
                      : active
                        ? 'bg-primary/40 ring-2 ring-primary/30'
                        : 'bg-muted',
                  )}
                />
              );
            })}
          </div>
          <span className="text-xs text-muted-foreground">
            {LABELS.journey.currentStepPrefix}{' '}
            <Link to={ROUTES[current]} className="font-semibold text-foreground underline-offset-4 hover:underline">
              {LABELS.journey.steps[current].name}
            </Link>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
