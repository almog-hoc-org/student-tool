import { Check, ChevronLeft, Clock, Shield, Users } from 'lucide-react';
import { SectionReveal } from '@/components/SectionReveal';
import { PremiumButton } from '@/components/PremiumButton';
import { TrustBadge } from '@/components/TrustBadge';

interface Props {
  purchaseUrl: string;
}

const features = [
  'כל חטיבות הלימוד — תאוריה, פרקטיקה ודוגמאות',
  'כלים ומחשבונים מתקדמים',
  'ליווי בוואטסאפ עם אנליסט נדל״ן',
  'אנליסט AI לשאלות ותשובות',
  'עדכונים שוטפים ותכנים חדשים',
];

export function ProgramPricing({ purchaseUrl }: Props) {
  return (
    <section className="py-20 sm:py-28 bg-gradient-premium">
      <div className="max-w-2xl mx-auto px-4">
        <SectionReveal>
          <div className="glass-card-premium rounded-2xl p-8 sm:p-12 glow-gold">
            <h2 className="text-2xl sm:text-3xl font-bold text-center">הצטרפו עכשיו לתוכנית</h2>
            <p className="text-gradient-gold text-xl font-bold text-center mt-2">הדרך לדירה</p>

            <div className="h-px bg-border/50 my-6" />

            <ul className="space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm sm:text-base">{feature}</span>
                </li>
              ))}
            </ul>

            <a href={purchaseUrl} className="block mt-8">
              <PremiumButton size="lg" shimmer glow className="w-full text-base">
                לרכישת התוכנית
                <ChevronLeft className="mr-2 h-5 w-5" />
              </PremiumButton>
            </a>

            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4 text-center">
              <Clock className="h-4 w-4 shrink-0" />
              <span>תקופת ליווי מוגבלת — הצטרפו עכשיו</span>
            </p>

            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <TrustBadge icon={<Shield className="h-4 w-4" />} label="8+ שנות ניסיון" />
              <TrustBadge icon={<Users className="h-4 w-4" />} label="קהילת רוכשים" />
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
