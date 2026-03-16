import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
  className?: string;
  blur?: boolean;
}

export function SectionReveal({ children, delay = 0, direction = 'up', className, blur = true }: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const directionMap = {
    up: { y: 24, x: 0 },
    left: { y: 0, x: 32 },
    right: { y: 0, x: -32 },
  };

  const offset = directionMap[direction];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: offset.y, x: offset.x, filter: blur ? 'blur(6px)' : 'blur(0px)' }}
      animate={isInView
        ? { opacity: 1, y: 0, x: 0, filter: 'blur(0px)' }
        : { opacity: 0, y: offset.y, x: offset.x, filter: blur ? 'blur(6px)' : 'blur(0px)' }
      }
      transition={{ duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
