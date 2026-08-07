import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { PropertyAreaNav } from '@/components/PropertyAreaNav';
import { save, load } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

/**
 * ציר הזמן של עסקת רכישה בישראל — 8 שלבים מהצ'קאפ ועד המפתח.
 * התוכן נכתב מזמן וישב כקוד מת ב-translations/he.ts; כאן הוא סוף סוף
 * מוצג לתלמיד, עם מעקב התקדמות שנשמר ומסתנכרן כמו כל כלי אחר.
 * (טווחי העלויות עודכנו — אגרות טאבו הן סכום קבוע, לא אחוז מהמחיר.)
 */
const STEPS = [
  {
    name: 'צ׳קאפ פיננסי ותקציב',
    description: 'הגדרת יכולת קנייה, בדיקת הון עצמי זמין, וקביעת תקציב ריאלי',
    timing: 'שלב ראשון — לפני חיפוש',
    costs: 'ללא עלות. אפשר להיעזר בייעוץ פיננסי (500–2,000 ₪)',
    toolLink: '/',
    toolLabel: 'מחשבון התקציב',
  },
  {
    name: 'חיפוש בשוק וביקורים',
    description: 'סריקת שוק, ביקורים בנכסים, בדיקת אזורים ומחירים',
    timing: '1–6 חודשים (תלוי בשוק)',
    costs: 'נסיעות וזמן. תשלום למתווך רק אם העסקה נסגרת.',
    toolLink: '/property-check',
    toolLabel: 'בדיקת נכס מהירה',
  },
  {
    name: 'הצעה ומכתב התחייבות',
    description: 'הגשת הצעה, משא ומתן, וחתימה על מכתב התחייבות ראשוני',
    timing: 'כמה ימים עד שבועיים',
    costs: 'דמי הזמנה / מקדמה ראשונה: 10,000–50,000 ₪',
    toolLink: '/business-plan',
    toolLabel: 'התוכנית העסקית',
  },
  {
    name: 'בדיקות משפטיות וטכניות',
    description: 'עורך דין בודק טאבו, שעבודים ותביעות. מהנדס בודק מצב פיזי',
    timing: '2–4 שבועות',
    costs: 'עו״ד: 3,000–8,000 ₪ + מע״מ, בדק בית: 1,500–3,000 ₪ + מע״מ',
  },
  {
    name: 'אישור עקרוני למשכנתא',
    description: 'פנייה לבנקים (כדאי ל-2–3 במקביל), הגשת מסמכים, קבלת אישור עקרוני — תקף כ-24 יום',
    timing: '1–3 שבועות',
    costs: 'שמאי מטעם הבנק: 1,500–3,000 ₪, ליווי משכנתא: 2,000–7,000 ₪',
    toolLink: '/mortgage',
    toolLabel: 'מחשבון המשכנתא',
  },
  {
    name: 'חתימה על חוזה',
    description: 'חתימה סופית על חוזה המכר ורישום הערת אזהרה בטאבו',
    timing: 'יום אחד (לאחר סיום הבדיקות)',
    costs: 'מס רכישה: לפי מדרגות וסוג רוכש, אגרות רישום: מאות שקלים (סכום קבוע)',
  },
  {
    name: 'לוח תשלומים ורישום',
    description: 'העברת כספים לפי החוזה, משיכת המשכנתא, העברת בעלות',
    timing: 'לפי ההסכם (מיידי או בשלבים)',
    costs: 'מתווך (2% + מע״מ אם יש), ביטוח מבנה וחיים (דרישת הבנק)',
  },
  {
    name: 'מסירה / שיפוץ / מעבר',
    description: 'קבלת החזקה בנכס, שיפוצים אם נדרש, מעבר או השכרה',
    timing: 'תלוי בהיקף השיפוץ (0–6 חודשים)',
    costs: 'שיפוץ: משתנה, ביטוח דירה: 500–1,500 ₪/שנה, ארנונה וועד בית',
  },
] as const;

interface TimelineState {
  completed: number[];
  touched?: boolean;
}

export default function TransactionTimeline() {
  const { user } = useAuth();
  const uid = user?.id;
  const [completed, setCompleted] = useState<Set<number>>(() => {
    const saved = load<TimelineState>('transaction_timeline');
    return new Set(saved?.completed ?? []);
  });
  const [touched, setTouched] = useState(() => !!load<TimelineState>('transaction_timeline')?.touched);

  useEffect(() => {
    if (!touched) return;
    save('transaction_timeline', { completed: [...completed], touched }, uid);
  }, [completed, touched, uid]);

  const toggle = (idx: number) => {
    setTouched(true);
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const doneCount = completed.size;

  return (
    <div className="space-y-6">
      <PropertyAreaNav />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-primary" />
          ציר הזמן של העסקה
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          המסע מהצעה ועד המפתח ביד — 8 שלבים, עם לוחות זמנים וטווחי עלויות לכל אחד.
          סמן שלבים שהשלמת כדי לראות בדיוק איפה אתה נמצא.
        </p>
        <div className="flex items-center gap-3 max-w-md">
          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(doneCount / STEPS.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            {doneCount}/{STEPS.length} שלבים
          </span>
        </div>
      </div>

      <ol className="space-y-3 max-w-3xl">
        {STEPS.map((step, idx) => {
          const isDone = completed.has(idx);
          return (
            <li key={step.name}>
              <Card className={cn('border transition-colors', isDone && 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20')}>
                <CardContent className="p-4 flex gap-3">
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={() => toggle(idx)}
                      aria-label={`סמן את "${step.name}" כהושלם`}
                    />
                    {idx < STEPS.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-sm font-bold', isDone && 'text-emerald-700 dark:text-emerald-400')}>
                        {idx + 1}. {step.name}
                      </span>
                      {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>⏱ {step.timing}</span>
                      <span>💰 {step.costs}</span>
                    </div>
                    {'toolLink' in step && step.toolLink && (
                      <a href={step.toolLink} className="text-xs text-primary underline-offset-4 hover:underline">
                        פתח את {step.toolLabel} ←
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
