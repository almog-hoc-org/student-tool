import type { MilestoneKey } from '@/lib/journey';

/**
 * Per-step accent classes. Static strings only — Tailwind's purge can't see
 * interpolated class names.
 */
export interface StepTheme {
  /** chip when this step is the active one */
  active: string;
  /** chip when this step is completed */
  done: string;
  /** small text accent */
  text: string;
}

export const JOURNEY_THEME: Record<MilestoneKey, StepTheme> = {
  goal: {
    active: 'bg-gold-light text-gold ring-2 ring-gold/30',
    done: 'bg-gold text-foreground',
    text: 'text-gold',
  },
  budget: {
    active: 'bg-primary/15 text-primary ring-2 ring-primary/30',
    done: 'bg-primary text-primary-foreground',
    text: 'text-primary',
  },
  business_plan: {
    active: 'bg-accent text-terracotta ring-2 ring-terracotta/30',
    done: 'bg-terracotta text-terracotta-foreground',
    text: 'text-terracotta',
  },
  mortgage: {
    active: 'bg-teal-600/15 text-teal-700 dark:text-teal-400 ring-2 ring-teal-600/30',
    done: 'bg-teal-700 text-white dark:bg-teal-500 dark:text-teal-950',
    text: 'text-teal-700 dark:text-teal-400',
  },
  property_check: {
    active: 'bg-violet-600/15 text-violet-700 dark:text-violet-400 ring-2 ring-violet-600/30',
    done: 'bg-violet-700 text-white dark:bg-violet-500 dark:text-violet-950',
    text: 'text-violet-700 dark:text-violet-400',
  },
  pre_purchase: {
    active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/30',
    done: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
};
