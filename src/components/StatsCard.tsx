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
  blue: 'bg-primary/10 text-primary',
  green: 'bg-emerald-500/10 text-emerald-600',
  orange: 'bg-accent/15 text-accent',
  purple: 'bg-purple-500/10 text-purple-600',
};

export function StatsCard({ title, value, icon: Icon, iconColor = 'blue', trend }: StatsCardProps) {
  return (
    <Card className="glass-card hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-0.5">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
            {trend && (
              <p className={cn('text-xs mt-2 font-medium', trend.isPositive ? 'text-emerald-600' : 'text-destructive')}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', iconColorClasses[iconColor])}>
            <Icon className="w-7 h-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
