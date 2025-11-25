import { motion, useInView } from 'framer-motion';
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
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(animateNumber ? 0 : value);

  useEffect(() => {
    if (!animateNumber || !isInView) return;

    const numericValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^\d.-]/g, '')) 
      : value;

    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }

    const duration = 1000; // 1 second
    const steps = 60;
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

    return () => clearInterval(timer);
  }, [value, isInView, animateNumber]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
              <motion.p 
                className="text-2xl md:text-3xl font-bold"
                key={displayValue.toString()}
              >
                {displayValue}
              </motion.p>
            </div>
            <motion.div
              className={`p-3 rounded-xl ${iconColors[iconColor]}`}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Icon className="h-6 w-6" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
