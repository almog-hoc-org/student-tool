import { load } from './storage';
import { BudgetOutput } from './calculations/budget-calculator';
import { BusinessPlanOutput } from './calculations/business-plan';
import { BuyerType } from './calculations/purchase-tax';

export interface Insight {
  type: 'warning' | 'recommendation' | 'insight' | 'next_step';
  title: string;
  description: string;
  tool?: string;
  priority: number; // 1=high, 3=low
}

interface BudgetData {
  equity: number;
  monthlyIncome: number;
  monthlyObligations: number;
  buyerType: BuyerType;
  mortgageYears: number;
}

interface MortgageData {
  tracks: { type: string; principal: number; annualInterestRate: number; years: number }[];
  monthlyIncome: number;
  propertyPrice: number;
}

interface MortgageResults {
  totalMonthlyPayment: number;
  totalInterestPaid: number;
  totalPaid: number;
  weightedAverageInterest: number;
}

export function generateInsights(): Insight[] {
  const insights: Insight[] = [];

  const budget = load<BudgetData>('budget');
  const budgetResults = load<BudgetOutput>('budget_results');
  const businessPlan = load<any>('business_plan');
  const mortgage = load<MortgageData>('mortgage');
  const mortgageResults = load<MortgageResults>('mortgage_results');

  const hasTools = {
    budget: !!budget && !!budgetResults,
    businessPlan: !!businessPlan,
    mortgage: !!mortgage && !!mortgageResults,
  };

  // --- Next Steps ---
  if (!hasTools.budget) {
    insights.push({
      type: 'next_step',
      title: 'התחל עם מחשבון התקציב',
      description: 'מחשבון התקציב יעזור לך לדעת מה מחיר הנכס המקסימלי שאתה יכול לרכוש.',
      priority: 1,
    });
  }

  if (hasTools.budget && !hasTools.businessPlan) {
    insights.push({
      type: 'next_step',
      title: 'המשך לתוכנית עסקית',
      description: 'יש לך נתוני תקציב — עכשיו כדאי לבדוק כדאיות עסקה עם התוכנית העסקית.',
      priority: 2,
    });
  }

  if (hasTools.budget && !hasTools.mortgage) {
    insights.push({
      type: 'next_step',
      title: 'בדוק תמהיל משכנתא',
      description: 'לאחר שבדקת תקציב, כדאי לבנות תמהיל משכנתא ולבדוק עלויות ריבית.',
      priority: 2,
    });
  }

  // --- Budget Insights ---
  if (hasTools.budget && budgetResults) {
    const dti = budgetResults.dtiPercent;

    if (dti > 40) {
      insights.push({
        type: 'warning',
        title: 'יחס החזר/הכנסה חורג מ-40%',
        description: `יחס ההחזר שלך עומד על ${dti.toFixed(0)}%. הבנקים בדרך כלל לא מאשרים מעל 40%. שקול להגדיל הכנסה או להקטין התחייבויות.`,
        tool: 'תקציב',
        priority: 1,
      });
    } else if (dti > 33) {
      insights.push({
        type: 'recommendation',
        title: 'יחס החזר/הכנסה גבוה',
        description: `יחס ההחזר שלך ${dti.toFixed(0)}%. מומלץ לשאוף ל-33% או פחות כדי לשמור על גמישות פיננסית.`,
        tool: 'תקציב',
        priority: 2,
      });
    } else {
      insights.push({
        type: 'insight',
        title: 'יחס החזר/הכנסה תקין',
        description: `יחס ההחזר שלך ${dti.toFixed(0)}% — יחס בריא שמשאיר מרווח נשימה חודשי.`,
        tool: 'תקציב',
        priority: 3,
      });
    }

    const equityRatio = budget!.equity / budgetResults.maxPropertyValue;
    if (equityRatio < 0.3) {
      insights.push({
        type: 'warning',
        title: 'הון עצמי נמוך ביחס לנכס',
        description: `ההון העצמי מהווה ${(equityRatio * 100).toFixed(0)}% ממחיר הנכס. בהשקעה שנייה צריך 50% הון עצמי, ואפילו בדירה ראשונה מומלץ מעל 30%.`,
        tool: 'תקציב',
        priority: 2,
      });
    }

    const taxPercent = budgetResults.purchaseTax / budget!.equity * 100;
    if (taxPercent > 15) {
      insights.push({
        type: 'insight',
        title: 'מס רכישה משמעותי',
        description: `מס הרכישה מהווה ${taxPercent.toFixed(0)}% מההון העצמי שלך. זה מצמצם את ההון הזמין לרכישה.`,
        tool: 'תקציב',
        priority: 3,
      });
    }
  }

  // --- Business Plan Insights ---
  if (hasTools.businessPlan && businessPlan) {
    const monthlyRent = businessPlan.expectedMonthlyRent ?? 0;
    const monthlyMortgage = businessPlan.mortgageMonthlyPayment ?? 0;

    if (monthlyRent > 0 && monthlyMortgage > 0) {
      const cashflowGap = monthlyRent - monthlyMortgage;
      if (cashflowGap < 0) {
        insights.push({
          type: 'warning',
          title: 'תזרים מזומנים שלילי',
          description: `השכירות (${monthlyRent.toLocaleString('he-IL')}₪) לא מכסה את המשכנתא (${monthlyMortgage.toLocaleString('he-IL')}₪). תצטרך לממן ${Math.abs(cashflowGap).toLocaleString('he-IL')}₪ בחודש מכיסך.`,
          tool: 'תוכנית עסקית',
          priority: 1,
        });
      } else if (cashflowGap < 500) {
        insights.push({
          type: 'recommendation',
          title: 'תזרים מזומנים צפוף',
          description: `מרווח של ${cashflowGap.toLocaleString('he-IL')}₪ בלבד בין שכירות למשכנתא. חודש ריק או תיקון עלולים לגרום להפסד.`,
          tool: 'תוכנית עסקית',
          priority: 2,
        });
      } else {
        insights.push({
          type: 'insight',
          title: 'תזרים חיובי',
          description: `מרווח של ${cashflowGap.toLocaleString('he-IL')}₪ בחודש בין שכירות למשכנתא. זה כרית בטחון סבירה.`,
          tool: 'תוכנית עסקית',
          priority: 3,
        });
      }
    }

    if (businessPlan.holdingPeriodYears && businessPlan.holdingPeriodYears < 5) {
      insights.push({
        type: 'recommendation',
        title: 'תקופת החזקה קצרה',
        description: `תקופת החזקה של ${businessPlan.holdingPeriodYears} שנים עלולה להיות קצרה מדי — עלויות כניסה ויציאה עלולות לאכול את הרווח.`,
        tool: 'תוכנית עסקית',
        priority: 2,
      });
    }
  }

  // --- Mortgage Insights ---
  if (hasTools.mortgage && mortgageResults && mortgage) {
    const totalInterest = mortgageResults.totalInterestPaid;
    const totalPrincipal = mortgageResults.totalPaid - totalInterest;

    if (totalInterest > totalPrincipal * 0.6) {
      insights.push({
        type: 'warning',
        title: 'ריבית כוללת גבוהה',
        description: `סך הריבית (${totalInterest.toLocaleString('he-IL')}₪) מהווה יותר מ-60% מהקרן. שקול לקצר תקופה או לבחור ריבית נמוכה יותר.`,
        tool: 'משכנתא',
        priority: 1,
      });
    }

    const payment = mortgageResults.totalMonthlyPayment;
    const income = mortgage.monthlyIncome;
    if (income > 0) {
      const paymentRatio = payment / income;
      if (paymentRatio > 0.35) {
        insights.push({
          type: 'warning',
          title: 'החזר חודשי גבוה ביחס להכנסה',
          description: `ההחזר החודשי (${payment.toLocaleString('he-IL')}₪) הוא ${(paymentRatio * 100).toFixed(0)}% מההכנסה. מומלץ להישאר מתחת ל-35%.`,
          tool: 'משכנתא',
          priority: 1,
        });
      }
    }

    const avgInterest = mortgageResults.weightedAverageInterest;
    if (avgInterest > 6) {
      insights.push({
        type: 'recommendation',
        title: 'ריבית משוקללת גבוהה',
        description: `הריבית המשוקללת ${avgInterest.toFixed(1)}% — גבוהה מהממוצע בשוק. שווה לבדוק הצעות מבנקים נוספים.`,
        tool: 'משכנתא',
        priority: 2,
      });
    }

    const tracks = mortgage.tracks;
    if (tracks.length === 1) {
      insights.push({
        type: 'recommendation',
        title: 'מסלול אחד בלבד',
        description: 'פיזור בין מספר מסלולי משכנתא מפחית סיכון. שקול להוסיף מסלול נוסף.',
        tool: 'משכנתא',
        priority: 3,
      });
    }
  }

  // --- Cross-tool Insights ---
  if (hasTools.budget && hasTools.businessPlan && budgetResults && businessPlan) {
    const budgetMax = budgetResults.maxPropertyValue;
    const planPrice = businessPlan.purchasePrice;
    if (planPrice > budgetMax * 1.1) {
      insights.push({
        type: 'warning',
        title: 'חוסר התאמה בין תקציב לתוכנית',
        description: `התוכנית העסקית מחשבת נכס ב-${planPrice.toLocaleString('he-IL')}₪ אבל התקציב מראה יכולת עד ${budgetMax.toLocaleString('he-IL')}₪.`,
        priority: 1,
      });
    }
  }

  if (hasTools.budget && hasTools.mortgage && budgetResults && mortgageResults) {
    const budgetPayment = budgetResults.monthlyPayment;
    const mortgagePayment = mortgageResults.totalMonthlyPayment;
    const diff = Math.abs(budgetPayment - mortgagePayment);
    if (diff > budgetPayment * 0.15 && budgetPayment > 0) {
      insights.push({
        type: 'insight',
        title: 'פער בין תקציב למשכנתא',
        description: `מחשבון התקציב מחשב החזר של ${budgetPayment.toLocaleString('he-IL')}₪ ומחשבון המשכנתא ${mortgagePayment.toLocaleString('he-IL')}₪. ודא שהנתונים עקביים.`,
        priority: 2,
      });
    }
  }

  // Sort by priority
  return insights.sort((a, b) => a.priority - b.priority);
}

export function hasAnyData(): boolean {
  return !!(load('budget') || load('business_plan') || load('mortgage'));
}
