import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { SectionReveal } from '@/components/SectionReveal';
import { PremiumButton } from '@/components/PremiumButton';

interface Props {
  purchaseUrl: string;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const commandments = [
  'הכר את התקציב האמיתי שלך',
  'למד את השוק לפני שתתחיל',
  'בנה צוות מקצועי',
  'אל תתאהב בנכס',
  'בדוק הכל — פעמיים',
  'דע את המספרים',
  'שלוט במשא ומתן',
  'הבן את המשכנתא',
  'חשוב לטווח ארוך',
  'פעל בביטחון',
];

export function ProgramTenCommandments({ purchaseUrl }: Props) {
  return (
    <section className="py-20 sm:py-28 bg-gradient-dark-dramatic relative overflow-hidden">
      {/* Floating gold orb */}
      <div
        className="absolute top-[20%] left-[10%] w-72 h-72 rounded-full opacity-15 blur-3xl animate-float-slow pointer-events-none"
        style={{ background: 'hsl(38 90% 55% / 0.4)' }}
      />
      <div
        className="absolute bottom-[15%] right-[8%] w-56 h-56 rounded-full opacity-10 blur-3xl animate-float-slow pointer-events-none"
        style={{ background: 'hsl(38 90% 55% / 0.3)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <SectionReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              10 הדיברות לדירה ראשונה
            </h2>
            <p className="text-white/60 text-lg">הפרק שישנה לך את הגישה לקנייה</p>
          </div>
        </SectionReveal>

        <motion.div
          className="grid sm:grid-cols-2 gap-4"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {commandments.map((title, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/8 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-gold-cta text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-lg">
                {i + 1}
              </div>
              <span className="text-white/90 font-medium">{title}</span>
            </motion.div>
          ))}
        </motion.div>

        <SectionReveal delay={0.5}>
          <div className="text-center mt-12">
            <a href={purchaseUrl}>
              <PremiumButton size="lg" shimmer glow className="text-lg px-8 py-6">
                רוצה לדעת את כולן?
                <ChevronLeft className="mr-2 h-5 w-5" />
              </PremiumButton>
            </a>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
