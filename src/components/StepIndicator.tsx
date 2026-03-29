import { useLocation, Link } from 'react-router-dom';
import { load } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const steps = [
  { path: '/', label: 'תקציב', key: 'budget', desc: 'כמה דירה אני יכול לקנות?' },
  { path: '/mortgage', label: 'משכנתא', key: 'mortgage', desc: 'בניית תמהיל מימון' },
  { path: '/business-plan', label: 'תוכנית עסקית', key: 'business_plan', desc: 'בדיקת כדאיות השקעה' },
];

export function StepIndicator() {
  const { pathname } = useLocation();
  const currentIndex = steps.findIndex(s => s.path === pathname);

  return (
    <div className="flex items-center justify-center gap-1 py-3 px-4">
      {steps.map((step, i) => {
        const isCurrent = step.path === pathname;
        const hasData = load(step.key) !== null;
        const isPast = i < currentIndex;

        return (
          <div key={step.path} className="flex items-center">
            {i > 0 && <div className={cn('w-8 md:w-12 h-px mx-1', isPast || isCurrent ? 'bg-primary' : 'bg-border')} />}
            <Link to={step.path} className="flex items-center gap-1.5 group">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                isCurrent ? 'bg-primary text-primary-foreground' :
                hasData || isPast ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              )}>
                {hasData && !isCurrent ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={cn(
                'text-xs font-medium hidden sm:inline transition-colors',
                isCurrent ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
              )}>
                {step.label}
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
