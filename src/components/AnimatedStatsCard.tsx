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
    <div ref={ref}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
              <p className="text-xl font-bold">
                {displayValue}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${iconColors[iconColor]}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
