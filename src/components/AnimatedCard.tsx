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
        duration: 0.4, 
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={hover ? { 
        y: -4,
        transition: { duration: 0.2 }
      } : undefined}
    >
      <Card className={cn(glass && 'glass-card', className)}>
        {children}
      </Card>
    </motion.div>
  );
}
