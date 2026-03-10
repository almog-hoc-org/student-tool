import { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PremiumButtonProps extends ButtonProps {
  shimmer?: boolean;
  glow?: boolean;
}

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, shimmer = true, glow = true, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          'bg-gradient-gold-cta text-white font-bold border-0',
          'hover:brightness-110 hover:scale-[1.03] active:scale-[0.98]',
          'transition-all duration-300 ease-out',
          'shadow-lg hover:shadow-xl',
          glow && 'glow-gold',
          shimmer && 'shimmer',
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';
