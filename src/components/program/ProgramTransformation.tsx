import { XCircle, CheckCircle2, X, Check, ArrowLeftRight } from 'lucide-react';
import { SectionReveal } from '@/components/SectionReveal';

const withoutItems = [
  'חוסר ביטחון בהחלטות',
  'טעויות יקרות במשא ומתן',
  'תשלום מס מיותר',
  'משכנתא לא אופטימלית',
  'פספוס עסקאות טובות',
];

const withItems = [
  'ביטחון מלא בכל שלב',
  'משא ומתן מקצועי ואסטרטגי',
  'חיסכון משמעותי במיסוי',
  'משכנתא בתנאים הטובים ביותר',
  'זיהוי וניצול הזדמנויות',
];

export function ProgramTransformation() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-premium">
      <div className="max-w-5xl mx-auto px-4">
        <SectionReveal>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16">
            מה ההבדל?
          </h2>
        </SectionReveal>

        <div className="relative grid md:grid-cols-2 gap-8">
          {/* Without column */}
          <SectionReveal direction="right">
            <div className="glass-card opacity-80 p-6 sm:p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-destructive">
                  בלי הכנה מקצועית
                </h3>
              </div>
              <ul className="space-y-4">
                {withoutItems.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <X className="h-5 w-5 flex-shrink-0 text-destructive" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SectionReveal>

          {/* Vertical divider — desktop only */}
          <div className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 flex-col items-center justify-center z-10">
            <div className="w-px flex-1 bg-border/40" />
            <div className="w-10 h-10 rounded-full bg-gradient-gold-cta flex items-center justify-center my-3 shadow-lg glow-gold">
              <ArrowLeftRight className="h-4 w-4 text-white" />
            </div>
            <div className="w-px flex-1 bg-border/40" />
          </div>

          {/* With column */}
          <SectionReveal direction="left">
            <div className="glass-card-premium p-6 sm:p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-gold" />
                </div>
                <h3 className="text-xl font-bold text-gradient-gold">
                  עם הדרך לדירה
                </h3>
              </div>
              <ul className="space-y-4">
                {withItems.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
