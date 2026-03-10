import { motion } from 'framer-motion';
import { ChevronLeft, ChevronDown, Shield, Briefcase, MessageCircle, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/PremiumButton';
import { TrustBadge } from '@/components/TrustBadge';

interface Props {
  purchaseUrl: string;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
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

export function ProgramHero({ purchaseUrl }: Props) {
  const scrollToSyllabus = () => {
    document.getElementById('syllabus')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[80vh] sm:min-h-[90vh] w-full overflow-hidden bg-gradient-dark-dramatic">
      {/* Mesh overlay */}
      <div className="absolute inset-0 bg-mesh pointer-events-none" />

      {/* Floating decorative orbs */}
      <div
        className="absolute top-[15%] right-[10%] w-64 h-64 rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: 'hsl(230 65% 52% / 0.4)' }}
      />
      <div
        className="absolute bottom-[20%] left-[5%] w-80 h-80 rounded-full opacity-15 blur-3xl animate-float-slow"
        style={{ background: 'hsl(38 90% 55% / 0.3)' }}
      />
      <div
        className="absolute top-[50%] left-[40%] w-48 h-48 rounded-full opacity-10 blur-3xl animate-float-delayed"
        style={{ background: 'hsl(260 60% 58% / 0.35)' }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] sm:min-h-[90vh] px-4 py-16 sm:py-20">
        <motion.div
          className="flex flex-col items-center text-center max-w-4xl mx-auto gap-6"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={fadeUp}>
            <Badge
              variant="outline"
              className="border-white/20 bg-white/5 text-white/80 text-sm px-4 py-1.5 backdrop-blur-sm"
            >
              8 שנות ניסיון | עשרות עסקאות
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-gradient-gold leading-tight"
          >
            הדרך לדירה
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-xl sm:text-2xl text-white/80 max-w-2xl leading-relaxed"
          >
            התוכנית הדיגיטלית המקצועית ביותר לרכישת דירה בישראל
          </motion.p>

          {/* Supporting text */}
          <motion.p
            variants={fadeUp}
            className="text-base sm:text-lg text-white/60 max-w-xl"
          >
            מבוססת על 8 שנות ניסיון ועשרות עסקאות אמיתיות
          </motion.p>

          {/* CTA row */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center gap-4 mt-4"
          >
            <a href={purchaseUrl}>
              <PremiumButton size="lg" shimmer glow className="text-lg px-8 py-6">
                אני רוצה להתחיל
                <ChevronLeft className="mr-2 h-5 w-5" />
              </PremiumButton>
            </a>
            <Button
              variant="ghost"
              size="lg"
              className="text-white/70 hover:text-white hover:bg-white/10 text-lg"
              onClick={scrollToSyllabus}
            >
              גלו מה בפנים ↓
            </Button>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-3 mt-8"
          >
            <TrustBadge
              icon={<Shield className="h-4 w-4" />}
              label="8+ שנות ניסיון"
              className="bg-white/5 border-white/10 text-white/70"
            />
            <TrustBadge
              icon={<Briefcase className="h-4 w-4" />}
              label="עשרות עסקאות"
              className="bg-white/5 border-white/10 text-white/70"
            />
            <TrustBadge
              icon={<MessageCircle className="h-4 w-4" />}
              label="תמיכה אישית"
              className="bg-white/5 border-white/10 text-white/70"
            />
            <TrustBadge
              icon={<Wrench className="h-4 w-4" />}
              label="כלים מתקדמים"
              className="bg-white/5 border-white/10 text-white/70"
            />
          </motion.div>
        </motion.div>

        {/* Bounce arrow */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <ChevronDown
            className="h-8 w-8 text-white/40"
            style={{ animation: 'bounce-subtle 2s ease-in-out infinite' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
