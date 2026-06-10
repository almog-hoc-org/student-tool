import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LABELS } from '@/lib/content/labels';

interface ErrorStateProps {
  title?: string;
  description?: string;
  retry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title,
  description,
  retry,
  retryLabel,
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn('border-destructive/30 bg-destructive/5', className)}>
      <CardContent className="flex flex-col items-center justify-center text-center space-y-3 py-10 px-6">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
          <AlertCircle className="w-6 h-6" />
        </div>
        {title && <p className="font-medium">{title}</p>}
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
        {retry && (
          <Button size="sm" variant="outline" onClick={retry}>
            {retryLabel ?? LABELS.common.retry}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
