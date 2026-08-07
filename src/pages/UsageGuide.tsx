import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Bot,
  CheckCircle2,
  HelpCircle,
  Home,
  ListChecks,
  MessageCircle,
  Save,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const mainSteps = [
  {
    icon: Wallet,
    title: 'מתחילים בתקציב',
    text: 'קודם בודקים כמה כסף יש לך באמת לעסקה. מכניסים הון עצמי, הכנסות, הוצאות והתחייבויות. בסוף מקבלים מספר פשוט: עד איזה מחיר נכס כדאי לך לחפש.',
    link: '/',
    action: 'פתח תקציב',
  },
  {
    icon: TrendingUp,
    title: 'בונים תוכנית עסקית',
    text: 'כאן בודקים עסקה אמיתית. מכניסים מחיר נכס, שכירות, עלויות, שיפוץ ומימון. המערכת מראה אם העסקה נראית טובה או בעייתית.',
    link: '/business-plan',
    action: 'פתח תוכנית',
  },
  {
    icon: Home,
    title: 'בונים משכנתא',
    text: 'יש עסקה — עכשיו בונים את המימון סביבה. מרכיבים תמהיל מסלולים, רואים החזר חודשי, ריבית כוללת ורגישות לשינויים.',
    link: '/mortgage',
    action: 'פתח משכנתא',
  },
  {
    icon: BarChart3,
    title: 'משווים עסקאות',
    text: 'כשיש כמה עסקאות שמורות, משווים ביניהן. במקום לזכור הכל בראש, רואים מי נראית חזקה יותר לפי מספרים, תזרים ורווח צפוי.',
    link: '/deal-comparison',
    action: 'פתח השוואה',
  },
];

const simpleRules = [
  'לא חייבים למלא הכל בבת אחת. מתחילים ממה שיודעים ומשפרים בהמשך.',
  'אם מספר לא ברור לך, אפשר לשים הערכה שמרנית ולחזור לעדכן.',
  'התקציב אומר כמה אפשר לקנות. התוכנית העסקית אומרת אם עסקה מסוימת שווה בדיקה.',
  'כדאי לשמור עסקה רק אחרי שמילאת לפחות את הנתונים המרכזיים שלה.',
  'אם משהו נראה מוזר במספרים, פותחים את הצ׳אט ושואלים בשפה רגילה.',
];

const saveTips = [
  {
    icon: Save,
    title: 'שומרים התקדמות',
    text: 'במסכים המרכזיים יש כפתור שמירה. השמירה עוזרת לחזור לעסקה אחר כך ולהשוות אותה לעסקאות אחרות.',
  },
  {
    icon: MessageCircle,
    title: 'שואלים את הצ׳אט',
    text: 'אפשר לשאול את היועץ שאלות פשוטות כמו: “מה אומר התזרים הזה?” או “איזה נתון הכי בעייתי בעסקה?”.',
  },
  {
    icon: CheckCircle2,
    title: 'בודקים לפני החלטה',
    text: 'המערכת היא כלי עזר. לפני החלטה אמיתית צריך לבדוק מסמכים, מימון, מיסוי ואנשי מקצוע.',
  },
];

export default function UsageGuide() {
  return (
    <div dir="rtl" className="space-y-6">
      <section className="rounded-lg border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <HelpCircle className="h-4 w-4" />
              מדריך שימוש
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                איך להשתמש בארגז הכלים
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                תחשוב על המערכת כמו מסלול קצר: קודם מבינים כמה כסף יש, אחר כך בודקים מימון,
                ואז בוחנים עסקה אמיתית ומשווים אותה לאחרות.
              </p>
            </div>
          </div>

          <Button asChild className="w-full gap-2 md:w-auto">
            <Link to="/">
              התחל מהתקציב
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {mainSteps.map((step, index) => (
          <Card key={step.title} className="overflow-hidden">
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">שלב {index + 1}</p>
                  <h2 className="text-lg font-bold">{step.title}</h2>
                </div>
              </div>
              <p className="flex-1 text-sm leading-7 text-muted-foreground">{step.text}</p>
              <Button asChild variant="outline" className="justify-between">
                <Link to={step.link}>
                  {step.action}
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-lg border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">כללים פשוטים שכדאי לזכור</h2>
        </div>
        <ul className="space-y-3">
          {simpleRules.map((rule) => (
            <li key={rule} className="flex gap-2 text-sm leading-7 text-muted-foreground">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {saveTips.map((tip) => (
          <Card key={tip.title}>
            <CardContent className="space-y-3 p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <tip.icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-bold">{tip.title}</h2>
              <p className="text-sm leading-7 text-muted-foreground">{tip.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-lg border bg-muted/40 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold">נתקעת?</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              פתח את הצ׳אט וכתוב את השאלה כמו שהיית שואל בן אדם. לא צריך ניסוח מקצועי.
            </p>
          </div>
          <Button asChild variant="secondary" className="gap-2">
            <Link to="/chat">
              שאל את היועץ
              <Bot className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
