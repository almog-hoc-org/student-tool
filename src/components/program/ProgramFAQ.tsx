import { SectionReveal } from '@/components/SectionReveal';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'למי התוכנית מתאימה?',
    a: 'התוכנית מתאימה גם לרוכשי דירה ראשונה וגם למשקיעים. היא לוקחת אתכם מאפס ונותנת את כל הכלים והידע שצריך כדי לבצע עסקת נדל״ן חכמה ובטוחה.',
  },
  {
    q: 'מה הפורמט של התוכנית?',
    a: 'התוכנית משלבת סרטונים מוקלטים, חומרים כתובים, קבצי PDF, כלים ומחשבונים דיגיטליים — הכל במקום אחד, זמין 24/7.',
  },
  {
    q: 'האם יש תמיכה?',
    a: 'כן! התוכנית כוללת ליווי צמוד בוואטסאפ עם אנליסט נדל״ן מקצועי, בנוסף לאנליסט AI שעונה על שאלות בכל שעה.',
  },
  {
    q: 'האם הכלים והמחשבונים כלולים?',
    a: 'בהחלט. גישה מלאה לכל הכלים: מחשבון עסקה, מחשבון מיסוי, מחשבון משכנתא, צ׳קליסט ביקור, ציר זמן ועוד — הכל כלול.',
  },
  {
    q: 'כמה זמן לוקח לסיים את התוכנית?',
    a: 'אתם לומדים בקצב שלכם. התוכן זמין תמיד, כך שאפשר לחזור ולצפות שוב בכל שלב.',
  },
  {
    q: 'האם התוכנית מתעדכנת?',
    a: 'כן, התוכנית מתעדכנת באופן שוטף עם שינויים ברגולציה, מדרגות מס, ריביות ועוד.',
  },
];

export function ProgramFAQ() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4">
        <SectionReveal>
          <h2 className="text-3xl font-bold text-center mb-12">שאלות נפוצות</h2>
        </SectionReveal>

        <SectionReveal delay={0.15}>
          <Accordion type="single" collapsible>
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="glass-card rounded-xl mb-3 px-6 border-b-0"
              >
                <AccordionTrigger className="font-medium text-right">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SectionReveal>
      </div>
    </section>
  );
}
