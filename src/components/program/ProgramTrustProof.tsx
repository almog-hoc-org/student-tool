import { Shield, Briefcase, BookOpen, GraduationCap } from 'lucide-react';
import { SectionReveal } from '@/components/SectionReveal';
import { CountUpNumber } from '@/components/CountUpNumber';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const stats = [
  {
    icon: Shield,
    iconBg: 'bg-primary/12',
    iconColor: 'text-primary',
    value: 'countup' as const,
    end: 8,
    suffix: '+',
    label: 'שנות ניסיון',
  },
  {
    icon: Briefcase,
    iconBg: 'bg-emerald-500/12',
    iconColor: 'text-emerald-500',
    value: 'text' as const,
    text: 'עשרות',
    label: 'עסקאות שהושלמו',
  },
  {
    icon: BookOpen,
    iconBg: 'bg-[hsl(var(--gold)/0.12)]',
    iconColor: 'text-[hsl(var(--gold))]',
    value: 'countup' as const,
    end: 4,
    label: 'חטיבות לימוד',
  },
  {
    icon: GraduationCap,
    iconBg: 'bg-purple-500/12',
    iconColor: 'text-purple-500',
    value: 'countup' as const,
    end: 60,
    suffix: '+',
    label: 'נושאים מקצועיים',
  },
];

export function ProgramTrustProof() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4">
        <SectionReveal>
          <h2 className="text-3xl font-bold text-center mb-12">מבוסס על ניסיון אמיתי</h2>
        </SectionReveal>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="glass-card-premium rounded-2xl p-6 text-center"
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4',
                    stat.iconBg
                  )}
                >
                  <Icon className={cn('h-7 w-7', stat.iconColor)} />
                </div>
                <div className="text-3xl font-black mb-1">
                  {stat.value === 'countup' ? (
                    <CountUpNumber end={stat.end!} suffix={stat.suffix || ''} />
                  ) : (
                    <span>{stat.text}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <SectionReveal delay={0.3}>
          <div className="max-w-2xl mx-auto mt-12 text-center">
            <span className="text-4xl text-[hsl(var(--gold))] font-serif leading-none select-none">
              &#x201D;
            </span>
            <p className="text-muted-foreground leading-relaxed mt-2">
              התוכנית נבנתה מתוך ניסיון מצטבר של למעלה מ-8 שנים בשוק הנדל״ן הישראלי. כל פרק, כל
              כלי וכל דוגמה מבוססים על עסקאות אמיתיות שביצענו בשטח.
            </p>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
