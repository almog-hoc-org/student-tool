// מודול עלויות נלוות מפורט - נדל"ן ישראלי
// מקור האמת היחיד לעלויות נלוות בכל המחשבונים. מס רכישה מחושב תמיד בנפרד (purchase-tax.ts).

import { FINANCE } from '@/lib/constants/financial';

const VAT_RATE = FINANCE.VAT_RATE;

// אגרת רישום בטאבו — סכום קבוע (אגרות בפועל הן מאות שקלים, לא אחוז מהמחיר)
export const TABU_REGISTRATION_FEE = 800;

// תעריפי ברירת מחדל אחידים — כל המחשבונים חייבים להשתמש באותם ערכים
export const DEFAULT_BROKER_PERCENT = 2;
export const DEFAULT_LAWYER_PERCENT = 0.5;
export const MORTGAGE_ADVISORY_FEE = 7000; // ליווי משכנתא (טווח שוק 2,000–6,000+ ₪, כולל מע"מ)

export function appraiserFee(purchasePrice: number): number {
  return purchasePrice > 3_000_000 ? 4000 : 2500;
}

export function inspectionFee(purchasePrice: number): number {
  return purchasePrice > 3_000_000 ? 3000 : 1800;
}

const withVat = (amount: number): number => Math.round(amount * (1 + VAT_RATE));

export interface SideCostsInput {
  purchasePrice: number;
  includeBroker: boolean;
  brokerPercent: number; // e.g. 2
  includeAppraisal: boolean;
  includeInspection: boolean;  // בדק בית
  includeInitialFurnishing: boolean;
  furnishingBudget: number;
  lawyerPercent: number; // e.g. 0.5
  includeRenovationBuffer: boolean;
  renovationBufferPercent: number; // e.g. 5
}

export interface SideCostItem {
  name: string;
  amount: number;
  description: string;
}

export interface SideCostsOutput {
  items: SideCostItem[];
  totalSideCosts: number;
}

export function calculateSideCosts(input: SideCostsInput): SideCostsOutput {
  const items: SideCostItem[] = [];

  // עורך דין
  items.push({
    name: 'עורך דין',
    amount: withVat(input.purchasePrice * (input.lawyerPercent / 100)),
    description: `${input.lawyerPercent}% + מע"מ`,
  });

  // תיווך
  if (input.includeBroker) {
    items.push({
      name: 'תיווך',
      amount: withVat(input.purchasePrice * (input.brokerPercent / 100)),
      description: `${input.brokerPercent}% + מע"מ`,
    });
  }

  // שמאי — שירות חייב במע"מ
  if (input.includeAppraisal) {
    items.push({
      name: 'שמאי מקרקעין',
      amount: withVat(appraiserFee(input.purchasePrice)),
      description: 'הערכת שווי הנכס + מע"מ',
    });
  }

  // בדק בית — שירות חייב במע"מ
  if (input.includeInspection) {
    items.push({
      name: 'בדק בית (מהנדס)',
      amount: withVat(inspectionFee(input.purchasePrice)),
      description: 'בדיקת מצב פיזי הנכס + מע"מ',
    });
  }

  // ביטוח מבנה + חיים (שנה ראשונה) — 0.1% מהנכס או מינימום ₪2,500.
  // דמי ביטוח פטורים ממע"מ בישראל — אין תוספת מע"מ.
  items.push({
    name: 'ביטוח מבנה + חיים (שנה ראשונה)',
    amount: Math.max(2500, Math.round(input.purchasePrice * 0.001)),
    description: 'נדרש לצורך משכנתא (פטור ממע"מ)',
  });

  // אגרות רישום טאבו — אגרה קבועה
  items.push({
    name: 'אגרות רישום (טאבו)',
    amount: TABU_REGISTRATION_FEE,
    description: 'אגרת רישום — סכום קבוע',
  });

  // ריהוט ראשוני
  if (input.includeInitialFurnishing) {
    items.push({
      name: 'ריהוט ראשוני',
      amount: input.furnishingBudget,
      description: 'הערכה לפי תקציב המשתמש',
    });
  }

  // חיץ שיפוצים
  if (input.includeRenovationBuffer) {
    const renovationBuffer = Math.round(input.purchasePrice * (input.renovationBufferPercent / 100));
    items.push({
      name: 'חיץ שיפוצים',
      amount: renovationBuffer,
      description: `${input.renovationBufferPercent}% ממחיר הרכישה`,
    });
  }

  const totalSideCosts = items.reduce((sum, item) => sum + item.amount, 0);

  return { items, totalSideCosts };
}

/** פריטי הפריסט של התוכנית העסקית — מקור אחד גם לטופס וגם להוספה המהירה */
export interface BpPresetSelection {
  broker: boolean;
  mortgageAdvice: boolean;
  lawyer: boolean;
  appraiser: boolean;
  extras: boolean;
}

/**
 * פריסט העלויות של התוכנית העסקית — אותם תעריפים בדיוק כמו calculateSideCosts
 * (מתווך 2% + מע"מ, עו"ד 0.5% + מע"מ, שמאי לפי מדרגה + מע"מ), בתוספת
 * ליווי משכנתא והוצאות נוספות. חייב להישאר זהה לחישוב שבטופס — ההוספה
 * המהירה משתמשת בו כדי שעריכה מאוחרת לא תשנה מספרים.
 */
export function businessPlanSideCostsPreset(purchasePrice: number, selected: BpPresetSelection): number {
  const broker = selected.broker ? withVat(purchasePrice * (DEFAULT_BROKER_PERCENT / 100)) : 0;
  const mortgageAdvice = selected.mortgageAdvice ? MORTGAGE_ADVISORY_FEE : 0;
  const lawyer = selected.lawyer ? withVat(purchasePrice * (DEFAULT_LAWYER_PERCENT / 100)) : 0;
  const appraiser = selected.appraiser ? withVat(appraiserFee(purchasePrice)) : 0;
  const extras = selected.extras ? 5000 : 0;
  return broker + mortgageAdvice + lawyer + appraiser + extras;
}

/**
 * אומדן מהיר של עלויות נלוות לפי ברירות המחדל — משמש את כל המחשבונים
 * (תקציב, תוכנית עסקית, בדיקת נכס) כדי שאותו נכס יקבל אותו מספר בכל כלי.
 */
export function quickSideCostsEstimate(purchasePrice: number): SideCostsOutput {
  return calculateSideCosts(getDefaultSideCostsInput(purchasePrice));
}

export function getDefaultSideCostsInput(purchasePrice: number): SideCostsInput {
  return {
    purchasePrice,
    includeBroker: true,
    brokerPercent: 2,
    includeAppraisal: true,
    includeInspection: true,
    includeInitialFurnishing: false,
    furnishingBudget: 30000,
    lawyerPercent: 0.5,
    includeRenovationBuffer: false,
    renovationBufferPercent: 5,
  };
}
