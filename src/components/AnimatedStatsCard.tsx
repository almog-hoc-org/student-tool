import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

interface AnimatedStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: 'blue' | 'green' | 'orange' | 'purple' | 'pink';
  delay?: number;
  animateNumber?: boolean;
}

const iconColors = {
  blue: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  green: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  orange: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
  purple: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  pink: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30',
};

export function AnimatedStatsCard({
  title,
  value,
  icon: Icon,
  iconColor = 'blue',
  delay = 0,
  animateNumber = false,
}: AnimatedStatsCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = useState(animateNumber ? 0 : value);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!animateNumber || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          const numericValue = typeof value === 'string'
            ? parseFloat(value.replace(/[^\d.-]/g, ''))
            : value;

          if (isNaN(numericValue)) {
            setDisplayValue(value);
            return;
          }

          const duration = 600;
          const steps = 30;
          const increment = numericValue / steps;
          let current = 0;
          let step = 0;

          const timer = setInterval(() => {
            step++;
            current = Math.min(current + increment, numericValue);

            if (typeof value === 'string') {
              const formatted = value.replace(/[\d,.-]+/, Math.round(current).toLocaleString('he-IL'));
              setDisplayValue(formatted);
            } else {
              setDisplayValue(Math.round(current));
            }

            if (step >= steps) {
              clearInterval(timer);
              setDisplayValue(value);
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, animateNumber, hasAnimated]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      }}
      whileHover={{
        y: -3,
        transition: { duration: 0.2 },
      }}
    >
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
              <p className="text-xl font-bold">
                {displayValue}
              </p>
            </div>
            <motion.div
              className={`p-2 rounded-lg ${iconColors[iconColor]}`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.15, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
