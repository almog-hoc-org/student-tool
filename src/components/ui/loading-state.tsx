import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LABELS } from '@/lib/content/labels';

interface LoadingStateProps {
  label?: string;
  className?: string;
  compact?: boolean;
}

export function LoadingState({ label, className, compact = false }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 text-sm text-muted-foreground',
        compact ? 'py-2' : 'py-8',
        className,
      )}
    >
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{label ?? LABELS.common.loading}</span>
    </div>
  );
}
