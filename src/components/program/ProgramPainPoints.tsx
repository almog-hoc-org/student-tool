import { motion } from 'framer-motion';
import { AlertTriangle, HelpCircle, Ban, Banknote } from 'lucide-react';
import { SectionReveal } from '@/components/SectionReveal';

const painPoints = [
  {
    icon: AlertTriangle,
    iconBg: 'bg-red-100 dark:bg-red-950/40',
    iconColor: 'text-red-500',
    title: 'לעשות טעות של מאות אלפי שקלים',
    description: 'החלטה לא מושכלת בעסקת נדל״ן יכולה לעלות לכם הון',
  },
  {
    icon: HelpCircle,
    iconBg: 'bg-amber-100 dark:bg-amber-950/40',
    iconColor: 'text-amber-500',
    title: 'ללכת לאיבוד בביורוקרטיה',
    description: 'מיסים, חוזים, משכנתאות — בלי מפה קשה להתמצא',
  },
  {
    icon: Ban,
    iconBg: 'bg-red-100 dark:bg-red-950/40',
    iconColor: 'text-red-500',
    title: 'לפספס הזדמנויות',
    description: 'עסקאות טובות לא מחכות — מי שלא מוכן, מפסיד',
  },
  {
    icon: Banknote,
    iconBg: 'bg-amber-100 dark:bg-amber-950/40',
    iconColor: 'text-amber-500',
    title: 'לשלם יותר מדי',
    description: 'בלי כלים ומשא ומתן נכון, אתם משאירים כסף על השולחן',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

export function ProgramPainPoints() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4">
        <SectionReveal>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              קניית דירה בישראל? זה מפחיד.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              בלי הידע הנכון, אתם עלולים...
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {painPoints.map((point, i) => {
              const Icon = point.icon;
              return (
                <motion.div
                  key={point.title}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  className="glass-card p-6 border-destructive/20 hover:border-destructive/40 transition-colors duration-300"
                >
                  <div className="flex gap-4 items-start">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${point.iconBg}`}>
                      <Icon className={`h-6 w-6 ${point.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{point.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {point.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
