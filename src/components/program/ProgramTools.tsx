import { motion } from 'framer-motion';
import {
  Calculator,
  Receipt,
  Home,
  ClipboardCheck,
  Calendar,
  Building2,
  BookOpen,
  FileSpreadsheet,
  TrendingUp,
  Bot,
} from 'lucide-react';
import { SectionReveal } from '@/components/SectionReveal';
import { cn } from '@/lib/utils';

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const tools = [
  { icon: Calculator, title: 'מחשבון עסקה', bg: 'bg-primary/12', color: 'text-primary' },
  { icon: Receipt, title: 'מחשבון מיסוי', bg: 'bg-[hsl(var(--chart-1)/0.12)]', color: 'text-[hsl(var(--chart-1))]' },
  { icon: Home, title: 'מחשבון משכנתא', bg: 'bg-emerald-500/12', color: 'text-emerald-500' },
  { icon: ClipboardCheck, title: 'צ׳קליסט ביקור', bg: 'bg-orange-500/12', color: 'text-orange-500' },
  { icon: Calendar, title: 'ציר זמן עסקה', bg: 'bg-sky-500/12', color: 'text-sky-500' },
  { icon: Building2, title: 'אבני דרך התחדשות', bg: 'bg-violet-500/12', color: 'text-violet-500' },
  { icon: BookOpen, title: 'מילון מונחים', bg: 'bg-pink-500/12', color: 'text-pink-500' },
  { icon: FileSpreadsheet, title: 'מעקב נכסים', bg: 'bg-teal-500/12', color: 'text-teal-500' },
  { icon: TrendingUp, title: 'מחשבון כדאיות', bg: 'bg-amber-500/12', color: 'text-amber-500' },
];

export function ProgramTools() {
  return (
    <section className="py-20 sm:py-28 bg-gradient-premium relative">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <SectionReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">כלים שעובדים בשבילך</h2>
            <p className="text-muted-foreground">
              פורטל טכנולוגי מתקדם שנבנה במיוחד עבור רוכשי דירות
            </p>
          </div>
        </SectionReveal>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.title}
                variants={fadeUp}
                className="glass-card rounded-2xl p-4 text-center hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center mx-auto',
                    tool.bg
                  )}
                >
                  <Icon className={cn('h-6 w-6', tool.color)} />
                </div>
                <p className="text-sm font-medium mt-2">{tool.title}</p>
              </motion.div>
            );
          })}

          {/* AI Card — special */}
          <motion.div
            variants={fadeUp}
            className="col-span-2 glass-card-premium rounded-2xl p-6 text-center glow-gold hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-[hsl(var(--gold)/0.15)]">
              <Bot className="h-6 w-6 text-[hsl(var(--gold))]" />
            </div>
            <p className="text-base font-bold mt-2 text-gradient-gold">אנליסט AI מתקדם</p>
            <p className="text-sm text-muted-foreground mt-1">מענה חכם לכל שאלה בנדל״ן</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
