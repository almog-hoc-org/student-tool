import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PageHeroProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  className?: string;
}

export function PageHero({ icon, title, description, badge, className }: PageHeroProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 py-4',
        className
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="space-y-0.5 min-w-0">
        {badge && (
          <Badge variant="secondary" className="text-xs font-medium mb-1">
            {badge}
          </Badge>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
}
