import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrafficStatus = 'positive' | 'neutral' | 'negative';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: 'blue' | 'green' | 'orange' | 'purple' | 'navy';
  status?: TrafficStatus;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

const iconColorClasses = {
  blue: 'bg-primary/10 text-primary',
  green: 'bg-[hsl(var(--chart-1)/0.12)] text-[hsl(var(--chart-1))]',
  orange: 'bg-primary/10 text-primary',
  purple: 'bg-purple-500/10 text-purple-600',
  navy: 'bg-secondary/10 text-secondary',
};

const statusBorderClasses: Record<TrafficStatus, string> = {
  positive: 'border-l-4 border-l-[hsl(var(--chart-1))]',
  neutral: 'border-l-4 border-l-[hsl(var(--chart-2))]',
  negative: 'border-l-4 border-l-[hsl(var(--chart-3))]',
};

const statusValueClasses: Record<TrafficStatus, string> = {
  positive: 'text-[hsl(var(--chart-1))]',
  neutral: 'text-[hsl(var(--chart-2))]',
  negative: 'text-[hsl(var(--chart-3))]',
};

const StatusIcon: Record<TrafficStatus, LucideIcon> = {
  positive: TrendingUp,
  neutral: Minus,
  negative: TrendingDown,
};

export function StatsCard({ title, value, icon: Icon, iconColor = 'blue', status, trend, subtitle }: StatsCardProps) {
  return (
    <Card className={cn(
      'overflow-hidden',
      status && statusBorderClasses[status]
    )}>
      <CardContent className="pt-3 pb-2.5 px-3 sm:pt-4 sm:pb-3 sm:px-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] sm:text-xs text-muted-foreground mb-1 truncate">{title}</p>
            <h3 className={cn(
              'text-base sm:text-xl font-bold tracking-tight',
              status ? statusValueClasses[status] : 'text-foreground'
            )}>
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
            {trend && (
              <p className={cn('text-xs mt-1 font-medium', trend.isPositive ? 'traffic-green' : 'traffic-red')}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className={cn(
            'w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            status ? `bg-[hsl(var(--chart-${status === 'positive' ? '1' : status === 'neutral' ? '2' : '3'})/0.1)]` : iconColorClasses[iconColor]
          )}>
            {status ? (
              (() => {
                const SIcon = StatusIcon[status];
                return <SIcon className={cn('w-4 h-4', statusValueClasses[status])} />;
              })()
            ) : (
              <Icon className="w-4 h-4" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
