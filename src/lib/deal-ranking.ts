// מנוע דירוג עסקאות — טהור וניתן לבדיקה.
//
// ציון אבסולוטי (מבוסס ספים, לא נרמול מול העסקאות האחרות): עסקה בודדת
// מקבלת ציון משמעותי, והוספה/הסרה של עסקה לא משנה ציון של אחרת.
// כל הספים מרוכזים בקבועים המיוצאים כאן — מקום אחד לכוונן.

import { formatCurrency } from '@/lib/validation/validators';
import { getMaxLtv } from '@/lib/constants/financial';
import type { BuyerType } from '@/lib/calculations/purchase-tax';

export type RankingPreference = 'cashflow' | 'longterm' | 'balanced';

export interface DealMetricsInput {
  snapshotId: string;
  name: string;
  /** התרחיש הקבוע שממנו נלקחו המדדים (ברירת מחדל: בינוני) */
  scenarioLabel: string;
  monthlyCashflow: number;
  /** שבר: 0.045 = 4.5% */
  cocYield: number;
  /** שבר, או null כשהחישוב לא התכנס */
  irr: number | null;
  totalProfit: number;
  /** שבר: רווח כולל חלקי ההון שהושקע */
  totalEquityReturn: number;
  initialInvestment: number;
  purchasePrice: number;
  equityInvested: number;
  mortgageAmount: number;
  mortgageMonthlyPayment: number;
  expectedMonthlyRent: number;
  holdingPeriodYears: number;
  buyerType?: BuyerType;
  /** רווח בתרחיש המחמיר — לחוק "שולי ביטחון" */
  pessimisticTotalProfit?: number;
}

export interface ComponentScores {
  cashflow: number;
  irr: number;
  profit: number;
  risk: number; // גבוה = בטוח יותר
}

export type DealGrade = 'מצוינת' | 'טובה' | 'סבירה' | 'חלשה';

export interface DealAssessment {
  snapshotId: string;
  name: string;
  score: number;
  rank: number;
  grade: DealGrade;
  components: ComponentScores;
  strengths: string[];
  risks: string[];
  irrUnavailable: boolean;
}

export interface RankingResult {
  ranked: DealAssessment[];
  winner: DealAssessment | null;
  headline: string;
  subline: string;
  isSingleDeal: boolean;
  preference: RankingPreference;
}

// משקולות לפי "מה חשוב לך"
export const RANKING_WEIGHTS: Record<RankingPreference, ComponentScores> = {
  balanced: { cashflow: 0.3, irr: 0.25, profit: 0.25, risk: 0.2 },
  cashflow: { cashflow: 0.45, irr: 0.15, profit: 0.15, risk: 0.25 },
  longterm: { cashflow: 0.15, irr: 0.3, profit: 0.4, risk: 0.15 },
};

export const PREFERENCE_LABELS: Record<RankingPreference, string> = {
  balanced: 'מאוזן',
  cashflow: 'תזרים חודשי',
  longterm: 'רווח לטווח ארוך',
};

// עוגני הציון (ראו טבלה ב-TESTING.md)
export const SCORE_ANCHORS = {
  CASHFLOW_FULL: 1_500, // ‎±1,500₪‎ ↔ 0/100
  IRR_FULL: 0.08,       // ‎8%‎ ↔ 100
  PROFIT_FULL: 1.0,     // ‎100%‎ על ההון ↔ 100
} as const;

const GRADE_THRESHOLDS: Array<[number, DealGrade]> = [
  [75, 'מצוינת'],
  [60, 'טובה'],
  [45, 'סבירה'],
];

function clamp01to100(x: number): number {
  return Math.max(0, Math.min(100, x));
}

function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

export function assessDeal(deal: DealMetricsInput, preference: RankingPreference = 'balanced'): DealAssessment {
  const strengths: string[] = [];
  const risks: string[] = [];

  const irrUnavailable = deal.irr === null;
  const effectiveIrr = deal.irr ?? deal.cocYield;
  const ltv = deal.purchasePrice > 0 ? deal.mortgageAmount / deal.purchasePrice : 0;
  const maxLtv = getMaxLtv(deal.buyerType ?? 'additionalApartment');

  // --- רכיבי הציון ---
  const cashflowScore = clamp01to100(50 + (deal.monthlyCashflow / SCORE_ANCHORS.CASHFLOW_FULL) * 50);
  const irrScore = clamp01to100((effectiveIrr / SCORE_ANCHORS.IRR_FULL) * 100);
  const profitScore = clamp01to100((deal.totalEquityReturn / SCORE_ANCHORS.PROFIT_FULL) * 100);

  // --- קנסות סיכון (כל קנס מלווה בהסבר) ---
  let riskPenalty = 0;

  if (deal.monthlyCashflow < 0) {
    riskPenalty += deal.monthlyCashflow < -1_000 ? 40 : 25;
    risks.push(`תזרים חודשי שלילי — תצטרך להשלים ${formatCurrency(Math.abs(deal.monthlyCashflow))} מהכיס כל חודש`);
  }

  if (ltv > maxLtv + 0.001) {
    riskPenalty += 30;
    risks.push(`המשכנתא (${pct(ltv)} מהמחיר) חורגת מתקרת המימון של בנק ישראל (${pct(maxLtv)}) — ייתכן שהבנק לא יאשר`);
  } else if (ltv > 0.7) {
    riskPenalty += 15;
    risks.push(`מינוף גבוה (${pct(ltv)}) — כל עליית ריבית תכאב`);
  }

  if (deal.expectedMonthlyRent < deal.mortgageMonthlyPayment) {
    riskPenalty += 15;
    risks.push('שכר הדירה לבדו לא מכסה את החזר המשכנתא');
  }

  if (deal.pessimisticTotalProfit !== undefined && deal.pessimisticTotalProfit < 0) {
    riskPenalty += 20;
    risks.push(`בתרחיש המחמיר העסקה מפסידה ${formatCurrency(Math.abs(deal.pessimisticTotalProfit))} — אין שולי ביטחון`);
  }

  if (deal.holdingPeriodYears > 0 && deal.holdingPeriodYears < 5) {
    riskPenalty += 10;
    risks.push(`תקופת החזקה של ${deal.holdingPeriodYears} שנים קצרה — עלויות קנייה ומכירה עלולות לאכול את הרווח`);
  }

  if (irrUnavailable) {
    riskPenalty += 5;
    risks.push('לא ניתן היה לחשב IRR — הציון מתבסס על תשואת התזרים בלבד');
  }

  const riskScore = clamp01to100(100 - riskPenalty);

  // --- חוזקות ---
  if (deal.monthlyCashflow >= 500) {
    strengths.push(`תזרים חודשי חיובי של ${formatCurrency(deal.monthlyCashflow)} — הנכס מחזיק את עצמו ומשאיר עודף`);
  } else if (deal.monthlyCashflow >= 0) {
    strengths.push('תזרים חודשי מאוזן — השכירות מכסה את המשכנתא וההוצאות');
  }
  if (!irrUnavailable && effectiveIrr >= 0.06) {
    strengths.push(`תשואה פנימית (IRR) של ${pct(effectiveIrr)} — גבוהה ביחס לחלופות סולידיות`);
  }
  if (deal.cocYield >= 0.05) {
    strengths.push(`תשואה שנתית על ההון של ${pct(deal.cocYield)} — ההון העצמי עובד קשה`);
  }
  if (deal.totalEquityReturn >= 0.8) {
    strengths.push(`בתום ${deal.holdingPeriodYears} שנים ההשקעה צפויה כמעט להכפיל את עצמה (${pct(deal.totalEquityReturn)} על ההון)`);
  }
  if (ltv > 0 && ltv <= 0.5) {
    strengths.push(`מינוף נמוך (${pct(ltv)} משכנתא) — רגישות נמוכה לעליית ריבית`);
  }
  if (deal.pessimisticTotalProfit !== undefined && deal.pessimisticTotalProfit >= 0) {
    strengths.push('גם בתרחיש המחמיר העסקה לא מפסידה — כרית ביטחון אמיתית');
  }

  const components: ComponentScores = {
    cashflow: Math.round(cashflowScore),
    irr: Math.round(irrScore),
    profit: Math.round(profitScore),
    risk: Math.round(riskScore),
  };

  const weights = RANKING_WEIGHTS[preference];
  const score = Math.round(
    weights.cashflow * cashflowScore
    + weights.irr * irrScore
    + weights.profit * profitScore
    + weights.risk * riskScore,
  );

  const grade: DealGrade = GRADE_THRESHOLDS.find(([min]) => score >= min)?.[1] ?? 'חלשה';

  return {
    snapshotId: deal.snapshotId,
    name: deal.name,
    score,
    rank: 0,
    grade,
    components,
    strengths,
    risks,
    irrUnavailable,
  };
}

export function rankDeals(
  deals: DealMetricsInput[],
  preference: RankingPreference = 'balanced',
): RankingResult {
  const assessments = deals.map((d) => assessDeal(d, preference));

  assessments.sort((a, b) =>
    b.score - a.score
    || b.components.risk - a.components.risk
    || b.components.cashflow - a.components.cashflow
    || a.name.localeCompare(b.name, 'he'),
  );
  assessments.forEach((a, i) => { a.rank = i + 1; });

  const winner = assessments[0] ?? null;
  const isSingleDeal = assessments.length === 1;

  let headline = '';
  let subline = '';
  if (winner && isSingleDeal) {
    headline = `"${winner.name}" מקבלת ציון ${winner.score}/100 — עסקה ${winner.grade}`;
  } else if (winner) {
    const runnerUp = assessments[1];
    headline = `"${winner.name}" מובילה עם ציון ${winner.score}/100, לעומת ${runnerUp.score} של "${runnerUp.name}"`;
    const gap = winner.score - runnerUp.score;
    if (gap <= 5) {
      subline = 'ההפרש קטן — העסקאות צמודות; ההכרעה תלויה במה שחשוב לך יותר';
    } else if (gap >= 15) {
      subline = `הפער משמעותי — "${winner.name}" עדיפה כמעט בכל מדד`;
    }
  }

  return { ranked: assessments, winner, headline, subline, isSingleDeal, preference };
}
