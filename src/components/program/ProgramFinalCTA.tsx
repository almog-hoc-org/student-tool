import { ChevronLeft } from 'lucide-react';
import { SectionReveal } from '@/components/SectionReveal';
import { PremiumButton } from '@/components/PremiumButton';

interface Props {
  purchaseUrl: string;
}

export function ProgramFinalCTA({ purchaseUrl }: Props) {
  return (
    <section className="py-20 sm:py-28 bg-gradient-dark-dramatic relative overflow-hidden">
      {/* Floating orbs */}
      <div
        className="absolute top-[20%] right-[8%] w-72 h-72 rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: 'hsl(230 65% 52% / 0.4)' }}
      />
      <div
        className="absolute bottom-[15%] left-[10%] w-64 h-64 rounded-full opacity-15 blur-3xl animate-float-slow"
        style={{ background: 'hsl(38 90% 55% / 0.3)' }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <SectionReveal>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            הדירה הבאה שלך מתחילה כאן
          </h2>
          <p className="text-white/70 text-lg mt-4">
            כל הידע, כל הכלים, כל הביטחון — במקום אחד
          </p>

          <a href={purchaseUrl} className="inline-block mt-8">
            <PremiumButton size="lg" shimmer glow className="text-lg px-10 py-6">
              לרכישת התוכנית
              <ChevronLeft className="mr-2 h-5 w-5" />
            </PremiumButton>
          </a>

          <p className="text-white/40 text-sm mt-6">
            תוכנית הדרך לדירה — מבוססת על 8 שנות ניסיון
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}
