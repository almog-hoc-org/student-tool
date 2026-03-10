import { ChevronLeft } from 'lucide-react';
import { PremiumButton } from '@/components/PremiumButton';

interface Props {
  text: string;
  buttonText: string;
  href: string;
}

export function InlineCTA({ text, buttonText, href }: Props) {
  return (
    <section className="py-8 sm:py-12 bg-gradient-premium border-y border-border/30">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-4 text-center">
        <p className="text-lg sm:text-xl font-semibold">{text}</p>
        <a href={href}>
          <PremiumButton size="lg" shimmer glow className="text-lg px-8">
            {buttonText}
            <ChevronLeft className="mr-2 h-5 w-5" />
          </PremiumButton>
        </a>
      </div>
    </section>
  );
}
