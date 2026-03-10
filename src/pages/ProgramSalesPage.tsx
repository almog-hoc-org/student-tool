import { ProgramHero } from '@/components/program/ProgramHero';
import { ProgramPainPoints } from '@/components/program/ProgramPainPoints';
import { ProgramTransformation } from '@/components/program/ProgramTransformation';
import { ProgramWhatYouGet } from '@/components/program/ProgramWhatYouGet';
import { ProgramSyllabus } from '@/components/program/ProgramSyllabus';
import { ProgramTenCommandments } from '@/components/program/ProgramTenCommandments';
import { ProgramTools } from '@/components/program/ProgramTools';
import { ProgramTrustProof } from '@/components/program/ProgramTrustProof';
import { ProgramPricing } from '@/components/program/ProgramPricing';
import { ProgramFAQ } from '@/components/program/ProgramFAQ';
import { ProgramFinalCTA } from '@/components/program/ProgramFinalCTA';
import { InlineCTA } from '@/components/program/InlineCTA';

const PURCHASE_URL = '#purchase'; // placeholder — replace with real URL

export default function ProgramSalesPage() {
  return (
    <div className="min-h-screen -m-4 sm:-m-6">
      <ProgramHero purchaseUrl={PURCHASE_URL} />

      <ProgramPainPoints />

      <InlineCTA
        text="מוכנים לקחת את הצעד הראשון?"
        buttonText="אני רוצה להתחיל"
        href={PURCHASE_URL}
      />

      <ProgramTransformation />

      <ProgramWhatYouGet />

      <InlineCTA
        text="הכל כאן. רק צריך להתחיל."
        buttonText="לרכישת התוכנית"
        href={PURCHASE_URL}
      />

      <ProgramSyllabus />

      <ProgramTenCommandments purchaseUrl={PURCHASE_URL} />

      <ProgramTools />

      <InlineCTA
        text="כל הכלים. כל הידע. במקום אחד."
        buttonText="אני רוצה גישה"
        href={PURCHASE_URL}
      />

      <ProgramTrustProof />

      <ProgramPricing purchaseUrl={PURCHASE_URL} />

      <ProgramFAQ />

      <ProgramFinalCTA purchaseUrl={PURCHASE_URL} />
    </div>
  );
}
