import { cn } from '@/lib/utils';

interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  className?: string;
}

export function TrustBadge({ icon, label, value, className }: TrustBadgeProps) {
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-4 py-2 rounded-full',
      'bg-white/60 dark:bg-white/8 backdrop-blur-sm',
      'border border-border/30 dark:border-white/10',
      'text-sm text-foreground/80',
      className
    )}>
      <span className="flex-shrink-0 text-primary">{icon}</span>
      {value && <span className="font-bold text-foreground">{value}</span>}
      <span>{label}</span>
    </div>
  );
}
