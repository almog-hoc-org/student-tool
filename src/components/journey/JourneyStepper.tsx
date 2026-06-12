import { Card, CardContent } from '@/components/ui/card';
import { Check, Target, Wallet, Home, Search, FileCheck, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MILESTONES, type MilestoneKey } from '@/lib/journey';
import { useJourney } from '@/hooks/useJourney';
import { LABELS } from '@/lib/content/labels';
import { JOURNEY_THEME } from '@/lib/journey-theme';
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

interface JourneyStepperProps {
  variant?: 'full' | 'compact';
  /** When provided, clicking the goal step opens this instead of navigating. */
  onGoalClick?: () => void;
}

/**
 * compact — bare progress row (dots + current step), meant to live inside
 * another card (HomeGreeting). full — standalone card with the 6 steps.
 */
export function JourneyStepper({ variant = 'full', onGoalClick }: JourneyStepperProps) {
  const { isDone, current, loading, completedCount, total } = useJourney();
  const navigate = useNavigate();
  if (loading) return null;
  const pct = Math.round((completedCount / total) * 100);

  const stepAction = (m: MilestoneKey) => {
    if (m === 'goal' && onGoalClick) onGoalClick();
    else navigate(ROUTES[m]);
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 items-center">
          {MILESTONES.map((m) => {
            const done = isDone(m);
            const active = current === m;
            return (
              <button
                key={m}
                type="button"
                aria-label={LABELS.journey.steps[m].name}
                onClick={() => stepAction(m)}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-colors',
                  done
                    ? JOURNEY_THEME[m].done
                    : active
                      ? 'bg-primary/40 ring-2 ring-primary/30'
                      : 'bg-muted-foreground/20',
                )}
              />
            );
          })}
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{total} · {LABELS.journey.currentStepPrefix}{' '}
          <button
            type="button"
            onClick={() => stepAction(current)}
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            {LABELS.journey.steps[current].name}
          </button>
        </span>
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground">
            {LABELS.account.journeyTitle}
          </span>
          <span className="font-bold">{completedCount}/{total} · {pct}%</span>
        </div>

        {/* Desktop / wider screens: row of steps */}
        <div className="hidden sm:flex items-center gap-1">
          {MILESTONES.map((m) => {
            const done = isDone(m);
            const active = current === m;
            const Icon = ICONS[m];
            return (
              <button
                type="button"
                onClick={() => stepAction(m)}
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
                      ? JOURNEY_THEME[m].done
                      : active
                        ? JOURNEY_THEME[m].active
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
              </button>
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
                      ? JOURNEY_THEME[m].done
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
