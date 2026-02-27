import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: 'blue' | 'green' | 'orange' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const iconColorClasses = {
  blue: 'bg-primary/8 text-primary',
  green: 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400',
  orange: 'bg-accent/10 text-accent',
  purple: 'bg-purple-500/8 text-purple-600 dark:text-purple-400',
};

export function StatsCard({ title, value, icon: Icon, iconColor = 'blue', trend }: StatsCardProps) {
  return (
    <Card className="border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1.5">{title}</p>
            <h3 className="text-2xl font-bold tracking-tight truncate">{value}</h3>
            {trend && (
              <p className={cn('text-xs mt-1.5 font-medium', trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconColorClasses[iconColor])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
