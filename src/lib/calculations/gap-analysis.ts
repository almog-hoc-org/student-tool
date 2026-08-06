/**
 * Compute the saver's gap from a target apartment price.
 * Pure function — no side effects, easy to unit-test.
 */

import { calculatePurchaseTax, BuyerType } from './purchase-tax';
import { quickSideCostsEstimate } from './side-costs';
import { getMinEquityShare } from '@/lib/constants/financial';

export type GapStatus = 'on_track' | 'behind' | 'no_goal' | 'no_budget';

export interface GapInput {
  targetPrice: number | null | undefined;
  equity: number | null | undefined;
  monthlySaving: number | null | undefined;
  targetDate: string | null | undefined;
  /**
   * סוג הרוכש — קובע את ההון העצמי המינימלי לפי חוק (25%/30%/50%)
   * ואת מס הרכישה. ברירת מחדל: דירה יחידה.
   */
  buyerType?: BuyerType;
  /** דריסה ידנית של שיעור ההון העצמי (למשל לתרחיש שמרני יותר) */
  downPaymentPct?: number;
}

export interface GapResult {
  status: GapStatus;
  requiredDownPayment: number;
  /** מס רכישה על מחיר היעד — חלק מההון שצריך להביא */
  purchaseTax: number;
  /** עלויות נלוות (עו"ד, תיווך, שמאי...) — גם הן מההון העצמי */
  sideCosts: number;
  /** סך ההון הנדרש: מקדמה + מס רכישה + עלויות נלוות */
  requiredTotalEquity: number;
  /** שיעור ההון העצמי שהונח */
  downPaymentPct: number;
  currentEquity: number;
  gap: number;
  monthsToTarget: number | null;
  requiredMonthlySaving: number | null;
  shortfall: number | null;
}

const EMPTY: GapResult = {
  status: 'no_goal',
  requiredDownPayment: 0,
  purchaseTax: 0,
  sideCosts: 0,
  requiredTotalEquity: 0,
  downPaymentPct: 0.25,
  currentEquity: 0,
  gap: 0,
  monthsToTarget: null,
  requiredMonthlySaving: null,
  shortfall: null,
};

function monthsBetween(now: Date, target: Date): number {
  const years = target.getFullYear() - now.getFullYear();
  const months = target.getMonth() - now.getMonth();
  return years * 12 + months;
}

export function computeGap(input: GapInput): GapResult {
  const targetPrice = Number(input.targetPrice) || 0;
  const equity = Math.max(0, Number(input.equity) || 0);
  const monthlySaving = Math.max(0, Number(input.monthlySaving) || 0);
  const buyerType = input.buyerType ?? 'singleApartment';
  // ההון המינימלי לפי חוק לסוג הרוכש (25% דירה יחידה, 30% משפר, 50% משקיע),
  // אלא אם המשתמש ביקש שיעור אחר במפורש
  const pct = input.downPaymentPct ?? getMinEquityShare(buyerType);

  if (targetPrice <= 0) return EMPTY;

  const requiredDownPayment = Math.round(targetPrice * pct);
  // הפער האמיתי כולל גם מס רכישה ועלויות נלוות — שניהם יוצאים מההון העצמי.
  // בלעדיהם משקיע על נכס ₪1.8M ראה פער מוקטן במאות אלפי שקלים.
  const purchaseTax = Math.round(calculatePurchaseTax({ purchasePrice: targetPrice, buyerType }).totalTax);
  const sideCosts = quickSideCostsEstimate(targetPrice).totalSideCosts;
  const requiredTotalEquity = requiredDownPayment + purchaseTax + sideCosts;
  const gap = Math.max(0, requiredTotalEquity - equity);

  const baseResult = {
    requiredDownPayment,
    purchaseTax,
    sideCosts,
    requiredTotalEquity,
    downPaymentPct: pct,
    currentEquity: equity,
    gap,
  };

  if (!input.targetDate) {
    return {
      ...EMPTY,
      ...baseResult,
      status: gap === 0 ? 'on_track' : 'behind',
    };
  }

  const target = new Date(input.targetDate);
  if (Number.isNaN(target.getTime())) {
    return {
      ...EMPTY,
      ...baseResult,
      status: gap === 0 ? 'on_track' : 'behind',
    };
  }

  const months = Math.max(1, monthsBetween(new Date(), target));
  const requiredMonthly = gap === 0 ? 0 : Math.ceil(gap / months);
  const shortfall = monthlySaving > 0
    ? Math.max(0, requiredMonthly - monthlySaving)
    : requiredMonthly;

  const status: GapStatus =
    gap === 0
      ? 'on_track'
      : monthlySaving <= 0
        ? 'no_budget'
        : monthlySaving >= requiredMonthly
          ? 'on_track'
          : 'behind';

  return {
    ...baseResult,
    status,
    monthsToTarget: months,
    requiredMonthlySaving: requiredMonthly,
    shortfall,
  };
}
