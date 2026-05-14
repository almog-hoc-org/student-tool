import { load } from './storage';
import { BudgetOutput } from './calculations/budget-calculator';
import { generateInsights } from './insights-engine';
import type {
  BudgetSaved,
  BusinessPlanSaved,
  MortgageSaved,
  MortgageResultsSaved,
} from '@/types/saved-state';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- Data loaders ---

interface UserData {
  budget: BudgetSaved | null;
  budgetResults: BudgetOutput | null;
  businessPlan: BusinessPlanSaved | null;
  mortgage: MortgageSaved | null;
  mortgageResults: MortgageResultsSaved | null;
}

function loadUserData(): UserData {
  return {
    budget: load('budget'),
    budgetResults: load('budget_results'),
    businessPlan: load('business_plan'),
    mortgage: load('mortgage'),
    mortgageResults: load('mortgage_results'),
  };
}

function fmt(n: number): string {
  return '₪' + Math.round(n).toLocaleString('he-IL');
}

// --- Intent patterns ---

type Intent = {
  keywords: RegExp;
  handler: (data: UserData, q: string) => string | null;
};

const INTENTS: Intent[] = [
  // What price / how much can I buy
  {
    keywords: /(כמה.*(לקנות|דיר)|איזה.*(דירה|מחיר)|מה.*(תקציב|מקסימלי|תקרה)|יכול.*לקנות|מחיר.*דירה)/,
    handler: (d) => {
      if (!d.budgetResults) return 'עדיין לא מילאת את מחשבון התקציב. התחל משם כדי שאוכל להגיד לך.';
      const b = d.budgetResults;
      return `על בסיס הנתונים שלך:\n\n- שווי דירה מקסימלי: **${fmt(b.maxPropertyValue)}**\n- סכום משכנתא: ${fmt(b.maxMortgage)}\n- החזר חודשי: ${fmt(b.monthlyPayment)}\n- יחס החזר/הכנסה: ${b.dtiPercent.toFixed(1)}%\n\nזכור — זה המקסימום על הנייר. בפועל כדאי להשאיר מרווח.`;
    },
  },
  // DTI / ratio
  {
    keywords: /(dti|יחס.*(הכנס|החזר)|החזר.*הכנס|כמה.*מההכנסה)/i,
    handler: (d) => {
      if (!d.budgetResults) return 'יחס DTI (החזר/הכנסה) הוא החלק מההכנסה שהולך להחזרי הלוואות. בנקים בישראל לא מאשרים מעל 40%, ומומלץ לשאוף ל-33% או פחות. מלא את מחשבון התקציב כדי לראות את היחס שלך.';
      const dti = d.budgetResults.dtiPercent;
      const status = dti > 40 ? '🔴 חורג מהמקסימום' : dti > 33 ? '🟡 גבוה, מומלץ להפחית' : '🟢 בריא';
      return `יחס ה-DTI שלך: **${dti.toFixed(1)}%** ${status}\n\n• עד 33% — נוח, מרווח גדול\n• 33-40% — גבולי, צריך זהירות\n• מעל 40% — הבנק לא יאשר\n\nכדי להפחית: הגדל הכנסה, צמצם התחייבויות, או קח משכנתא ארוכה יותר.`;
    },
  },
  // Equity / how much money do I need
  {
    keywords: /(הון.*עצמי|כמה.*כסף|כסף.*מזומן|לחסוך|חסכון)/,
    handler: (d) => {
      if (!d.budget) return 'בישראל צריך בדרך כלל 25% הון עצמי לדירה ראשונה ו-50% לדירה להשקעה. הפעל את מחשבון התקציב כדי לראות מה אתה יכול עם ההון שלך.';
      const eq = d.budget.equity;
      const buyerType = d.budget.buyerType;
      const minPercent = buyerType === 'singleApartment' ? 25 : 50;
      return `יש לך **${fmt(eq)}** הון עצמי.\n\nעבור ${buyerType === 'singleApartment' ? 'דירה ראשונה' : 'דירה להשקעה'} צריך לפחות ${minPercent}% הון עצמי.\n\nזה אומר שההון שלך מתאים לדירה עד ${fmt(eq / (minPercent / 100))}. מעבר לזה — תצטרך יותר הון.`;
    },
  },
  // Mortgage / payments
  {
    keywords: /(משכנתא|החזר.*חודש|ריבית|מסלול|תקופה)/,
    handler: (d) => {
      if (d.mortgageResults) {
        const m = d.mortgageResults;
        return `המשכנתא שבנית:\n\n- **החזר חודשי: ${fmt(m.totalMonthlyPayment)}**\n- ריבית משוקללת: ${m.weightedAverageInterest.toFixed(2)}%\n- סך ריבית לכל התקופה: ${fmt(m.totalInterestPaid)}\n- סך תשלום: ${fmt(m.totalPaid)}\n\nכדי להוזיל: קצר תקופה, הגדל הון עצמי, או השווה הצעות מבנקים.`;
      }
      if (d.budgetResults) {
        return `על בסיס התקציב שלך, החזר חודשי מוערך: **${fmt(d.budgetResults.monthlyPayment)}** לסכום משכנתא של ${fmt(d.budgetResults.maxMortgage)}.\n\nלחישוב מדויק של תמהיל משכנתא — עבור למחשבון המשכנתא.`;
      }
      return 'מחשבון המשכנתא מאפשר לבנות תמהיל עם מספר מסלולים (קבועה, פריים, משתנה) ולראות השפעה על החזר חודשי וריבית כוללת. הפעל אותו כדי לקבל תשובות ספציפיות.';
    },
  },
  // Purchase tax
  {
    keywords: /(מס.*רכישה|מס.*מדינ|כמה.*מס)/,
    handler: (d) => {
      if (d.budgetResults) {
        return `מס הרכישה שלך: **${fmt(d.budgetResults.purchaseTax)}**\n\nהמדרגות (2026):\n• דירה ראשונה עד ~1.98M — פטור\n• דירה נוספת — מ-8% מהשקל הראשון\n• תושב חוץ — 8% עד ~5.9M, אח"כ 10%\n\nצור קשר עם יועץ מס לחישוב מדויק לפי סיטואציה שלך.`;
      }
      return 'מס רכישה בישראל:\n• דירה ראשונה — פטור עד כ-1.98M ₪\n• דירה נוספת — מ-8% מהשקל הראשון\n• תושב חוץ — מ-8%\n\nבנה תקציב כדי לראות כמה זה אצלך.';
    },
  },
  // Rent / cash flow
  {
    keywords: /(שכירות|שכר.*דיר|תזרים|הכנסה.*דיר|כדאי.*להשקיע)/,
    handler: (d) => {
      if (!d.businessPlan) return 'תוכנית עסקית עוזרת לבדוק כדאיות עסקה — שכירות, תזרים, תשואה. הפעל אותה כדי שאוכל לתת לך ניתוח ספציפי.';
      const bp = d.businessPlan;
      const rent = bp.expectedMonthlyRent ?? 0;
      const payment = bp.mortgageMonthlyPayment ?? 0;
      const gap = rent - payment;
      const gapStr = gap >= 0
        ? `🟢 תזרים חיובי: ${fmt(gap)} לחודש`
        : `🔴 תזרים שלילי: חסר ${fmt(-gap)} לחודש`;
      return `על בסיס התוכנית העסקית שלך:\n\n- שכירות חודשית: ${fmt(rent)}\n- משכנתא: ${fmt(payment)}\n- **${gapStr}**\n\nכדאי להשאיר מרווח לעלויות תחזוקה (תיקונים, ועד בית, חודש ריק). מומלץ 15-20% מהשכירות.`;
    },
  },
  // Deal feasibility
  {
    keywords: /(כדאי|האם.*לקנות|עסקה.*טובה|השקעה.*טובה|לרכוש|לקנות.*עכשיו)/,
    handler: (d) => {
      const insights = generateInsights();
      const warnings = insights.filter(i => i.type === 'warning');
      const good = insights.filter(i => i.type === 'insight');
      if (warnings.length > 0) {
        return `יש כמה דברים שצריך לבדוק לפני שתמשיך:\n\n${warnings.slice(0, 3).map(w => `🔴 **${w.title}**: ${w.description}`).join('\n\n')}`;
      }
      if (good.length > 0) {
        return `הנתונים שלך נראים סבירים:\n\n${good.slice(0, 3).map(g => `🟢 **${g.title}**: ${g.description}`).join('\n\n')}`;
      }
      return 'מלא את מחשבוני התקציב, המשכנתא והתוכנית העסקית — ואז אוכל להגיד לך אם העסקה כדאית עבורך.';
    },
  },
  // General status
  {
    keywords: /(המצב.*שלי|סיכום|איפה.*אני|מה.*עשיתי|תגיד.*לי)/,
    handler: (d) => {
      const parts: string[] = [];
      if (d.budgetResults) parts.push(`✅ **תקציב:** יכול לקנות עד ${fmt(d.budgetResults.maxPropertyValue)}, DTI ${d.budgetResults.dtiPercent.toFixed(0)}%`);
      else parts.push('⭕ **תקציב:** עוד לא מילאת');
      if (d.mortgageResults) parts.push(`✅ **משכנתא:** ${fmt(d.mortgageResults.totalMonthlyPayment)}/חודש, ריבית ${d.mortgageResults.weightedAverageInterest.toFixed(1)}%`);
      else parts.push('⭕ **משכנתא:** עוד לא בנית תמהיל');
      if (d.businessPlan) parts.push(`✅ **תוכנית עסקית:** נכס ${fmt(d.businessPlan.purchasePrice)}, שכירות ${fmt(d.businessPlan.expectedMonthlyRent ?? 0)}`);
      else parts.push('⭕ **תוכנית עסקית:** עוד לא הוזנה');
      return `המצב שלך עכשיו:\n\n${parts.join('\n')}`;
    },
  },
  // Next step
  {
    keywords: /(מה.*הלאה|הצעד.*הבא|מה.*עכשיו|מה.*כדאי.*לעש|איפה.*להתחיל)/,
    handler: (d) => {
      if (!d.budgetResults) return 'הצעד הראשון: **מחשבון התקציב**. זה יתן לך מסגרת לכל השאר — כמה דירה אתה יכול, כמה משכנתא, וכמה החזר.';
      if (!d.mortgageResults) return 'יש לך תקציב. הצעד הבא: **מחשבון המשכנתא** — בנה תמהיל עם מספר מסלולים כדי לראות איזה שילוב מוזיל לך ריבית.';
      if (!d.businessPlan) return 'יש לך תקציב ומשכנתא. עכשיו: **תוכנית עסקית** — אם אתה חושב על השקעה, זה יראה לך אם העסקה תזרים חיובי ותשואה טובה.';
      return 'מילאת את כל הכלים. עכשיו:\n\n1. בדוק את **התובנות החכמות** (כפתור "תובנות חכמות" באזור האישי) לראות אם יש אזהרות או המלצות\n2. התחל לחפש דירות בטווח המחיר שלך\n3. השווה הצעות משכנתא מכמה בנקים';
    },
  },
  // Side costs
  {
    keywords: /(עלויות.*נלוות|תיווך|עורך.*דין|שמאי|עלויות.*נוספות)/,
    handler: (d) => {
      if (d.budgetResults) {
        return `עלויות נלוות שלך: **${fmt(d.budgetResults.sideCosts)}**\n\nכולל:\n- תיווך: 2% + מע"מ\n- עו"ד: 0.5-1%\n- שמאי: ~2,500₪\n- פתיחת תיק משכנתא: ~0.25%\n- ביטוחים\n- רישום בטאבו\n\nהכל מחושב בתוך התקציב שלך.`;
      }
      return 'עלויות נלוות ברכישת דירה בישראל: בדרך כלל 3-5% ממחיר הדירה — תיווך, עו"ד, שמאי, פתיחת תיק משכנתא, ביטוחים, טאבו.';
    },
  },
];

// --- Fallback: general knowledge Q&A ---
const GENERAL_ANSWERS: { pattern: RegExp; answer: string }[] = [
  {
    pattern: /(קבוע.*לא.*צמוד|kl|ק.לא.צ)/i,
    answer: 'מסלול קבועה לא צמודה (ק"ל) — ריבית קבועה לכל התקופה, לא צמודה למדד. יציב אבל יקר יותר. טוב לחלק בטוח מהתמהיל.',
  },
  {
    pattern: /(פריים|prime)/i,
    answer: 'פריים = ריבית בנק ישראל + 1.5%. זולה היום אבל משתנה. לא יכולה להיות יותר מ-66% מהמשכנתא.',
  },
  {
    pattern: /(צמודה|מדד)/,
    answer: 'משכנתא צמודה למדד — הקרן עולה עם האינפלציה. ריבית נמוכה יותר בהתחלה אבל סך החזר עלול להיות גבוה יותר. מסוכן בתקופות אינפלציה.',
  },
  {
    pattern: /(חוק.*חכם|מענק|זכאות)/,
    answer: 'זכויות משרד השיכון: מחיר למשתכן, מענק מקום, הלוואת זכאות. בדוק זכאות באתר משרד השיכון.',
  },
  {
    pattern: /(טאבו|רשם|רישום)/,
    answer: 'טאבו = רישום בעלות במקרקעין. עלות כ-175₪ לדירה, לוקח 1-3 חודשים. חובה אחרי סגירת עסקה.',
  },
];

const HELLO_RESPONSE = 'היי! 👋 אני יועץ שמכיר את הנתונים שלך באפליקציה. אני יכול לענות על שאלות כמו:\n\n• כמה דירה אני יכול לקנות?\n• מה יחס ה-DTI שלי?\n• האם העסקה שלי כדאית?\n• מה הצעד הבא שלי?\n\nמה תרצה לדעת?';

const UNKNOWN_RESPONSE = 'לא הבנתי בדיוק מה שאלת. נסה לשאול על:\n\n• **תקציב:** "כמה דירה אני יכול לקנות?"\n• **משכנתא:** "מה החזר החודשי שלי?"\n• **DTI:** "מה יחס ההחזר שלי?"\n• **כדאיות:** "האם העסקה כדאית?"\n• **מצב:** "מה המצב שלי?"\n• **המשך:** "מה הצעד הבא?"';

// --- Main ---

export function processMessage(userMessage: string): string {
  const q = userMessage.trim().toLowerCase();
  const data = loadUserData();

  // Greeting
  if (/^(היי|שלום|הי|hello|hi)\b/i.test(q) || q.length < 4) {
    return HELLO_RESPONSE;
  }

  // Intent matching
  for (const intent of INTENTS) {
    if (intent.keywords.test(q)) {
      const response = intent.handler(data, q);
      if (response) return response;
    }
  }

  // General knowledge
  for (const g of GENERAL_ANSWERS) {
    if (g.pattern.test(q)) return g.answer;
  }

  return UNKNOWN_RESPONSE;
}

export function sendChatMessage(_history: ChatMessage[], userMessage: string): Promise<string> {
  return new Promise(resolve => {
    setTimeout(() => resolve(processMessage(userMessage)), 400);
  });
}

export function isChatAvailable(): boolean {
  return true;
}
