// מודול עלויות נלוות מפורט - נדל"ן ישראלי
// מע"מ מעודכן: 18% מ-1 בינואר 2025

const VAT_RATE = 0.18;

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
  const lawyerBase = input.purchasePrice * (input.lawyerPercent / 100);
  const lawyerWithVat = lawyerBase * (1 + VAT_RATE);
  items.push({
    name: 'עורך דין',
    amount: Math.round(lawyerWithVat),
    description: `${input.lawyerPercent}% + מע"מ`,
  });

  // תיווך
  if (input.includeBroker) {
    const brokerBase = input.purchasePrice * (input.brokerPercent / 100);
    const brokerWithVat = brokerBase * (1 + VAT_RATE);
    items.push({
      name: 'תיווך',
      amount: Math.round(brokerWithVat),
      description: `${input.brokerPercent}% + מע"מ`,
    });
  }

  // שמאי
  if (input.includeAppraisal) {
    const appraisalCost = input.purchasePrice > 3000000 ? 4000 : 2500;
    items.push({
      name: 'שמאי מקרקעין',
      amount: appraisalCost,
      description: 'הערכת שווי הנכס',
    });
  }

  // בדק בית
  if (input.includeInspection) {
    const inspectionCost = input.purchasePrice > 3000000 ? 3000 : 1800;
    items.push({
      name: 'בדק בית (מהנדס)',
      amount: inspectionCost,
      description: 'בדיקת מצב פיזי הנכס',
    });
  }

  // ביטוח מבנה + חיים (שנה ראשונה)
  items.push({
    name: 'ביטוח מבנה + חיים (שנה ראשונה)',
    amount: 2500,
    description: 'נדרש לצורך משכנתא',
  });

  // אגרות רישום
  items.push({
    name: 'אגרות רישום (טאבו)',
    amount: Math.round(input.purchasePrice * 0.002),
    description: '~0.2% ממחיר הנכס',
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
