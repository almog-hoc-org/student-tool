import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ConfidenceGaugeProps {
  score: number; // 0-100
  label?: string;
  className?: string;
}

function getColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-destructive';
}

function getTextColor(score: number): string {
  if (score >= 70) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-destructive';
}

function getLabel(score: number): string {
  if (score >= 80) return 'מצוין – אור ירוק!';
  if (score >= 70) return 'טוב – אתה על המסלול';
  if (score >= 50) return 'בינוני – יש מה לשפר';
  if (score >= 30) return 'נמוך – נדרשת זהירות';
  return 'סיכון גבוה – עצור וחשב מחדש';
}

export function ConfidenceGauge({ score, label, className }: ConfidenceGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const displayLabel = label || getLabel(clampedScore);

  return (
    <Card className={cn('p-5 border border-border/60 shadow-sm', className)}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', 
          clampedScore >= 70 ? 'bg-emerald-500/8' : clampedScore >= 40 ? 'bg-amber-500/8' : 'bg-destructive/8'
        )}>
          <Shield className={cn('w-4 h-4', getTextColor(clampedScore))} />
        </div>
        <div>
          <h3 className="font-semibold text-sm">מד הביטחון שלך</h3>
          <p className="text-xs text-muted-foreground">השקט הנפשי הפיננסי</p>
        </div>
      </div>

      {/* Gauge bar */}
      <div className="relative w-full h-2.5 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', getColor(clampedScore))}
          style={{ width: `${clampedScore}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
        <span>סיכון</span>
        <span>בינוני</span>
        <span>בטוח</span>
      </div>

      {/* Score display */}
      <div className="flex items-center justify-between">
        <p className={cn('font-bold text-sm', getTextColor(clampedScore))}>
          {clampedScore.toFixed(0)} / 100
        </p>
        <p className={cn('text-xs font-medium', getTextColor(clampedScore))}>
          {displayLabel}
        </p>
      </div>
    </Card>
  );
}
