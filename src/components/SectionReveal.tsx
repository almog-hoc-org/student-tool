import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
  className?: string;
}

export function SectionReveal({ children, delay = 0, direction = 'up', className }: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const directionMap = {
    up: { y: 30, x: 0 },
    left: { y: 0, x: 40 },
    right: { y: 0, x: -40 },
  };

  const offset = directionMap[direction];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: offset.y, x: offset.x }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y: offset.y, x: offset.x }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
