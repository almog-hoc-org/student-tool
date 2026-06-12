import { type ComponentType } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'primary' | 'gold' | 'terracotta' | 'muted' | 'success' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

const TONES: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  gold: 'bg-gold-light text-gold dark:text-gold',
  terracotta: 'bg-accent text-terracotta',
  muted: 'bg-muted text-muted-foreground',
  success: 'bg-green-500/10 text-green-600 dark:text-green-400',
  destructive: 'bg-destructive/10 text-destructive',
};

const SIZES: Record<Size, { box: string; icon: string }> = {
  sm: { box: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4' },
  md: { box: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' },
  lg: { box: 'w-14 h-14 rounded-2xl', icon: 'w-7 h-7' },
};

interface IconChipProps {
  icon: ComponentType<{ className?: string }>;
  tone?: Tone;
  size?: Size;
  className?: string;
}

/** The single icon-in-a-soft-square pattern used across the app. */
export function IconChip({ icon: Icon, tone = 'primary', size = 'md', className }: IconChipProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0',
        SIZES[size].box,
        TONES[tone],
        className,
      )}
    >
      <Icon className={SIZES[size].icon} />
    </div>
  );
}
