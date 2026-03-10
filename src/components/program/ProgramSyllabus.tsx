import { BookOpen, Hammer, Calculator, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { SectionReveal } from '@/components/SectionReveal';
import { cn } from '@/lib/utils';

interface TopicItem {
  text: string;
  highlight?: boolean;
  highlightBadge?: string;
}

interface SubSection {
  title: string;
  topics: string[];
}

interface SyllabusGroup {
  id: string;
  icon: React.ElementType;
  title: string;
  badge: string;
  accentBorder: string;
  iconBg: string;
  iconColor: string;
  dotColor: string;
  topics?: TopicItem[];
  subSections?: SubSection[];
}

const groups: SyllabusGroup[] = [
  {
    id: 'theory',
    icon: BookOpen,
    title: 'תאוריה',
    badge: '7 נושאים',
    accentBorder: 'border-r-primary',
    iconBg: 'bg-primary/12',
    iconColor: 'text-primary',
    dotColor: 'bg-primary',
    topics: [
      { text: 'למה נדל"ן — יתרונות וחסרונות' },
      { text: 'אנשי מקצוע בעסקת נדל"ן' },
      { text: 'תשואה הונית מול תשואה פירותית' },
      { text: 'אסטרטגיה ומשך השקעה' },
      { text: 'סוגי עסקאות: Presale, יד 2, פליפ ועוד' },
      { text: 'התחדשות עירונית — הגדרות, ציר זמן ופוטנציאל' },
      { text: 'זיהוי פרויקטים פוטנציאליים וטעויות נפוצות' },
    ],
  },
  {
    id: 'practice',
    icon: Hammer,
    title: 'פרקטיקה',
    badge: '8 נושאים',
    accentBorder: 'border-r-[hsl(var(--chart-1))]',
    iconBg: 'bg-[hsl(var(--chart-1)/0.12)]',
    iconColor: 'text-[hsl(var(--chart-1))]',
    dotColor: 'bg-[hsl(var(--chart-1))]',
    topics: [
      { text: 'הגדרת תקציב ומימון' },
      { text: '⭐ 10 הדיברות לדירה ראשונה', highlight: true, highlightBadge: 'דגש מיוחד' },
      { text: 'עבודת שטח: הכנה מקדימה ושאלות חובה' },
      { text: 'בדיקות חשובות בזמן ביקור בנכס' },
      { text: 'טעויות ומלכודות שחייבים להכיר' },
      { text: 'משא ומתן: יסודות, טכניקות ואסטרטגיה' },
      { text: 'הצעת מחיר ואיך לגייס את המתווך' },
      { text: 'דוגמאות מעסקאות אמיתיות: שיפוץ, תמ"א, Presale, פינוי בינוי' },
    ],
  },
  {
    id: 'tools',
    icon: Calculator,
    title: 'כלים ומחשבונים',
    badge: '11 כלים',
    accentBorder: 'border-r-[hsl(var(--gold))]',
    iconBg: 'bg-[hsl(var(--gold)/0.12)]',
    iconColor: 'text-[hsl(var(--gold))]',
    dotColor: 'bg-[hsl(var(--gold))]',
    topics: [
      { text: 'פורטל כלים מתקדם' },
      { text: 'מחשבון עסקת נדל"ן' },
      { text: 'מחשבון מיסוי' },
      { text: 'מחשבון משכנתא' },
      { text: "צ'קליסט ביקור בנכס" },
      { text: 'ציר זמן של עסקת נדל"ן' },
      { text: 'אבני דרך לפרויקט התחדשות' },
      { text: 'מילון מושגים מקצועי' },
      { text: 'קובץ מעקב נכסים' },
      { text: 'מחשבון בדיקת כדאיות' },
      { text: 'אנליסט AI מתקדם למענה על שאלות' },
    ],
  },
  {
    id: 'advanced',
    icon: GraduationCap,
    title: 'הרחבות מקצועיות',
    badge: '25+ נושאים',
    accentBorder: 'border-r-purple-500',
    iconBg: 'bg-purple-500/12',
    iconColor: 'text-purple-500',
    dotColor: 'bg-purple-500',
    subSections: [
      {
        title: 'מיסוי נדל"ן:',
        topics: ['סוגי מיסים', 'מס רכישה', 'חוק השליש', 'מס שכירות', 'מס שבח'],
      },
      {
        title: 'משכנתא ומימון:',
        topics: [
          'מהי משכנתא',
          'תהליך',
          'מושגים',
          'סודות הבנק',
          'לוח שפיצר',
          'מבנה',
          'כלים לבניית תמהיל מנצח',
          'אישור עקרוני',
          'משא ומתן בין בנקים',
        ],
      },
      {
        title: 'כלי מחקר וניתוח:',
        topics: [
          'רשות המיסים',
          'מדלן',
          'אתר התחדשות עירונית',
          'אתר הנדל"ן הממשלתי',
          'נסח טאבו',
          'מידע תכנוני',
          'רמ"י',
          'GIS',
          'קווים כחולים',
          'NotebookLM',
        ],
      },
    ],
  },
];

export function ProgramSyllabus() {
  return (
    <section id="syllabus" className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-4">
        <SectionReveal>
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h2 className="text-3xl sm:text-4xl font-bold">הסילבוס המלא</h2>
              <Badge variant="secondary" className="text-sm">
                60+ נושאים
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg">
              כל מה שצריך לדעת כדי לקנות דירה בביטחון
            </p>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.2}>
          <Accordion type="multiple" className="space-y-3">
            {groups.map((group) => {
              const Icon = group.icon;
              return (
                <AccordionItem
                  key={group.id}
                  value={group.id}
                  className={cn(
                    'glass-card-premium rounded-xl border-r-4 border-b-0',
                    group.accentBorder
                  )}
                >
                  <AccordionTrigger className="flex items-center gap-3 px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                          group.iconBg
                        )}
                      >
                        <Icon className={cn('h-5 w-5', group.iconColor)} />
                      </div>
                      <span className="font-bold text-lg">{group.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {group.badge}
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-5">
                    {group.topics && (
                      <div className="space-y-2 py-4">
                        {group.topics.map((topic) =>
                          topic.highlight ? (
                            <div
                              key={topic.text}
                              className="flex items-center gap-3 bg-[hsl(var(--gold)/0.1)] rounded-lg px-3 py-1.5"
                            >
                              <span
                                className={cn('w-2 h-2 rounded-full shrink-0', group.dotColor)}
                              />
                              <span className="font-semibold">{topic.text}</span>
                              <Badge className="bg-[hsl(var(--gold))] text-white text-[10px] px-2 py-0 hover:bg-[hsl(var(--gold))]">
                                {topic.highlightBadge}
                              </Badge>
                            </div>
                          ) : (
                            <div key={topic.text} className="flex items-center gap-3">
                              <span
                                className={cn('w-2 h-2 rounded-full shrink-0', group.dotColor)}
                              />
                              <span>{topic.text}</span>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {group.subSections && (
                      <div className="space-y-5 py-4">
                        {group.subSections.map((sub) => (
                          <div key={sub.title}>
                            <h4 className="font-bold mb-2">{sub.title}</h4>
                            <div className="space-y-2 pr-2">
                              {sub.topics.map((topic) => (
                                <div key={topic} className="flex items-center gap-3">
                                  <span
                                    className={cn(
                                      'w-2 h-2 rounded-full shrink-0',
                                      group.dotColor
                                    )}
                                  />
                                  <span
                                    className={
                                      topic === 'כלים לבניית תמהיל מנצח' ? 'font-bold' : ''
                                    }
                                  >
                                    {topic}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </SectionReveal>
      </div>
    </section>
  );
}
