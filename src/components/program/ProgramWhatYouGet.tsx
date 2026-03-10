import { motion } from 'framer-motion';
import { BookOpen, Hammer, Calculator, TrendingUp, MessageCircle, Bot } from 'lucide-react';
import { SectionReveal } from '@/components/SectionReveal';
import { cn } from '@/lib/utils';

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const pillars = [
  {
    icon: BookOpen,
    title: 'תאוריה',
    subtitle: 'הבסיס המקצועי',
    iconBg: 'bg-primary/12',
    iconColor: 'text-primary',
    bullets: ['למה נדל״ן?', 'סוגי עסקאות', 'התחדשות עירונית'],
  },
  {
    icon: Hammer,
    title: 'פרקטיקה',
    subtitle: 'עבודת שטח אמיתית',
    iconBg: 'bg-[hsl(var(--chart-1)/0.12)]',
    iconColor: 'text-[hsl(var(--chart-1))]',
    bullets: ['10 הדיברות לדירה ראשונה', 'משא ומתן מקצועי', 'דוגמאות מעסקאות אמיתיות'],
  },
  {
    icon: Calculator,
    title: 'כלים ומחשבונים',
    subtitle: 'טכנולוגיה שעובדת בשבילך',
    iconBg: 'bg-[hsl(var(--gold)/0.12)]',
    iconColor: 'text-[hsl(var(--gold))]',
    bullets: ['מחשבוני עסקה, מס ומשכנתא', 'אנליסט AI מתקדם', 'קובץ מעקב נכסים'],
  },
  {
    icon: TrendingUp,
    title: 'דוגמאות חיות',
    subtitle: 'עסקאות אמיתיות מהשטח',
    iconBg: 'bg-purple-500/12',
    iconColor: 'text-purple-500',
    bullets: ['שיפוץ וחלוקה', 'תמ״א ופינוי בינוי', 'Presale מקבלן'],
  },
];

export function ProgramWhatYouGet() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-premium relative">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <SectionReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">מה מחכה לך בפנים?</h2>
            <p className="text-muted-foreground text-lg">
              תוכנית מקיפה שנבנתה מניסיון אמיתי בשטח
            </p>
          </div>
        </SectionReveal>

        <motion.div
          className="grid sm:grid-cols-2 gap-6"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                variants={fadeUp}
                className="glass-card-premium rounded-2xl p-6"
              >
                <div className="flex flex-col gap-4">
                  <div
                    className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center',
                      pillar.iconBg
                    )}
                  >
                    <Icon className={cn('h-7 w-7', pillar.iconColor)} />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-1">{pillar.title}</h3>
                    <p className="text-sm text-muted-foreground">{pillar.subtitle}</p>
                  </div>

                  <ul className="space-y-2">
                    {pillar.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <SectionReveal delay={0.4}>
          <div className="glass-card rounded-2xl p-5 mt-8 text-center">
            <div className="flex items-center justify-center gap-3 text-sm sm:text-base font-medium">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[hsl(var(--chart-1))]" />
                <Bot className="h-5 w-5 text-[hsl(var(--gold))]" />
              </div>
              <span>כולל: ליווי צמוד בוואטסאפ + אנליסט AI לכל שאלה</span>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
