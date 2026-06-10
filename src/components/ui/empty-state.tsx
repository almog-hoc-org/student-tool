import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed bg-muted/20', className)}>
      <CardContent
        className={cn(
          'flex flex-col items-center justify-center text-center space-y-3',
          compact ? 'p-4' : 'py-12 px-6',
        )}
      >
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
          {icon ?? <Inbox className="w-6 h-6" />}
        </div>
        {title && <p className="font-medium">{title}</p>}
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
        {action && <div className="pt-1">{action}</div>}
      </CardContent>
    </Card>
  );
}
