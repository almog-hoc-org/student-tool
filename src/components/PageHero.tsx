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
      className={cn('flex items-start gap-3 py-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
    >
      <motion.div
        className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        {icon}
      </motion.div>
      <div className="space-y-0.5 min-w-0">
        {badge && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Badge variant="secondary" className="text-xs font-medium mb-1">
              {badge}
            </Badge>
          </motion.div>
        )}
        <motion.h1
          className="text-xl sm:text-2xl font-bold text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.12 }}
        >
          {title}
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-sm leading-snug"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          {description}
        </motion.p>
      </div>
    </motion.div>
  );
}
