import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  hover?: boolean;
  className?: string;
  glass?: boolean;
}

export function AnimatedCard({ 
  children, 
  delay = 0, 
  hover = true,
  className,
  glass = false
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.45, 
        delay,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number]
      }}
      whileHover={hover ? { 
        y: -4,
        boxShadow: '0 8px 25px -8px hsl(var(--primary) / 0.12)',
        transition: { duration: 0.25 }
      } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
    >
      <Card className={cn(glass && 'glass-card', 'transition-shadow duration-300', className)}>
        {children}
      </Card>
    </motion.div>
  );
}
