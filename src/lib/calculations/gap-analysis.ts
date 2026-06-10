/**
 * Compute the saver's gap from a target apartment price.
 * Pure function — no side effects, easy to unit-test.
 */

export type GapStatus = 'on_track' | 'behind' | 'no_goal' | 'no_budget';

export interface GapInput {
  targetPrice: number | null | undefined;
  equity: number | null | undefined;
  monthlySaving: number | null | undefined;
  targetDate: string | null | undefined;
  /** Equity share of the target price the student is expected to bring. Default 25%. */
  downPaymentPct?: number;
}

export interface GapResult {
  status: GapStatus;
  requiredDownPayment: number;
  currentEquity: number;
  gap: number;
  monthsToTarget: number | null;
  requiredMonthlySaving: number | null;
  shortfall: number | null;
}

const EMPTY: GapResult = {
  status: 'no_goal',
  requiredDownPayment: 0,
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
  const pct = input.downPaymentPct ?? 0.25;

  if (targetPrice <= 0) return EMPTY;

  const requiredDownPayment = Math.round(targetPrice * pct);
  const gap = Math.max(0, requiredDownPayment - equity);

  if (!input.targetDate) {
    return {
      ...EMPTY,
      status: gap === 0 ? 'on_track' : 'behind',
      requiredDownPayment,
      currentEquity: equity,
      gap,
    };
  }

  const target = new Date(input.targetDate);
  if (Number.isNaN(target.getTime())) {
    return {
      ...EMPTY,
      status: gap === 0 ? 'on_track' : 'behind',
      requiredDownPayment,
      currentEquity: equity,
      gap,
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
    status,
    requiredDownPayment,
    currentEquity: equity,
    gap,
    monthsToTarget: months,
    requiredMonthlySaving: requiredMonthly,
    shortfall,
  };
}
