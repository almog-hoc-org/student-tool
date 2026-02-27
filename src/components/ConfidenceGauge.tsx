import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

interface ConfidenceGaugeProps {
  score: number; // 0-100
  label?: string;
  className?: string;
}

function getColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-destructive';
}

function getTextColor(score: number): string {
  if (score >= 70) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
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
    <div className={cn('p-6 rounded-2xl border bg-card shadow-lg', className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', 
          clampedScore >= 70 ? 'bg-emerald-500/10' : clampedScore >= 40 ? 'bg-orange-500/10' : 'bg-destructive/10'
        )}>
          <Shield className={cn('w-5 h-5', getTextColor(clampedScore))} />
        </div>
        <div>
          <h3 className="font-bold text-lg">מד הביטחון שלך</h3>
          <p className="text-sm text-muted-foreground">השקט הנפשי הפיננסי</p>
        </div>
      </div>

      {/* Gauge bar */}
      <div className="relative w-full h-4 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className={cn('h-full rounded-full transition-all duration-1000 ease-out', getColor(clampedScore))}
          style={{ width: `${clampedScore}%` }}
        />
        {/* Markers */}
        <div className="absolute inset-0 flex items-center">
          <div className="absolute left-[30%] w-px h-3 bg-border" />
          <div className="absolute left-[70%] w-px h-3 bg-border" />
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground mb-3">
        <span>סיכון</span>
        <span>בינוני</span>
        <span>בטוח</span>
      </div>

      {/* Score display */}
      <div className="flex items-center justify-between">
        <p className={cn('font-bold text-lg', getTextColor(clampedScore))}>
          {clampedScore.toFixed(0)} / 100
        </p>
        <p className={cn('text-sm font-medium', getTextColor(clampedScore))}>
          {displayLabel}
        </p>
      </div>
    </div>
  );
}
