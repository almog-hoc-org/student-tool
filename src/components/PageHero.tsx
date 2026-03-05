import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-hero bg-dots p-6 sm:p-8 border border-border/50',
        className
      )}
    >
      <div className="relative z-10 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="space-y-1.5">
          {badge && (
            <Badge variant="secondary" className="text-xs font-medium mb-1">
              {badge}
            </Badge>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
