import {
  MortgageTrack,
  MortgageTrackResult,
  MortgageCalculatorInput,
  MortgageCalculatorOutput,
  AmortizationRow,
  SensitivityResult,
} from '@/types/mortgage-calculator';
import { FINANCE, LTV_LIMITS } from '@/lib/constants/financial';
import { monthlyPayment } from './annuity';

// קבועי שוק — מקור האמת הוא constants/financial.ts
export const MARKET_CONSTANTS = {
  BOI_RATE: FINANCE.BOI_RATE,
  PRIME_RATE: FINANCE.PRIME_RATE,
  MAX_PRIME_SHARE: FINANCE.MAX_PRIME_SHARE,
  MAX_DTI: FINANCE.MAX_DTI,
  LTV_FIRST_HOME: LTV_LIMITS.firstHome,
  LTV_UPGRADE: LTV_LIMITS.upgrade,
  LTV_INVESTOR: LTV_LIMITS.investor,
  DEFAULT_MADAD_RATE: FINANCE.DEFAULT_MADAD_RATE,
  MADAD_EXEMPT_PORTION: FINANCE.MADAD_EXEMPT_PORTION,
  MADAD_LINKED_PORTION: FINANCE.MADAD_LINKED_PORTION,
  MADAD_EFFECTIVE_EXPOSURE: FINANCE.MADAD_EFFECTIVE_EXPOSURE,
};

export interface MadadSimulationResult {
  originalTotal: number;
  adjustedTotal: number;
  additionalCost: number;
  effectiveAnnualRate: number;
}

/**
 * סימולטור מדד תשומות הבנייה - לרכישה מקבלן (off-plan)
 * לפי חוק יוני 2025: 20% הראשונים ממחיר הדירה פטורים מהצמדה, והיתרה צמודה ב-50%.
 * לכן linkedAmount הוא מחיר הנכס (לא סכום ההלוואה), והחשיפה האפקטיבית
 * היא ‎(1 − 0.20) × 0.50 ≈ 40%‎ מהמחיר.
 */
export function simulateMadadImpact(params: {
  linkedAmount: number;
  annualMadadRate: number;
  years: number;
  exposurePercent?: number;
}): MadadSimulationResult {
  const { linkedAmount, annualMadadRate, years, exposurePercent = MARKET_CONSTANTS.MADAD_EFFECTIVE_EXPOSURE } = params;
  const exposedAmount = linkedAmount * exposurePercent;
  const rate = annualMadadRate / 100;
  const cumulativeFactor = Math.pow(1 + rate, years) - 1;
  const additionalCost = Math.round(exposedAmount * cumulativeFactor);

  return {
    originalTotal: linkedAmount,
    adjustedTotal: linkedAmount + additionalCost,
    additionalCost,
    effectiveAnnualRate: exposurePercent * annualMadadRate,
  };
}

export function calculateMortgageMonthlyPayment(principal: number, annualInterestRate: number, years: number): number {
  return monthlyPayment(principal, annualInterestRate, years);
}

export function calculateMortgageTrack(
  track: MortgageTrack
): MortgageTrackResult {
  const payment = monthlyPayment(track.principal, track.annualInterestRate, track.years);
  const totalPaid = payment * track.years * 12;
  const totalInterestPaid = payment > 0 ? totalPaid - track.principal : 0;

  return {
    trackId: track.id,
    monthlyPayment: payment,
    totalInterestPaid,
  };
}

export function calculateMortgage(
  input: MortgageCalculatorInput
): MortgageCalculatorOutput {
  const results: MortgageTrackResult[] = input.tracks.map(calculateMortgageTrack);

  const totalMonthlyPayment = results.reduce(
    (sum, t) => sum + t.monthlyPayment,
    0
  );

  const totalInterestPaid = results.reduce(
    (sum, t) => sum + t.totalInterestPaid,
    0
  );

  const totalPrincipal = input.tracks.reduce((sum, t) => sum + t.principal, 0);

  let weightedAverageInterest = 0;
  if (totalPrincipal > 0) {
    weightedAverageInterest = input.tracks.reduce(
      (sum, t) => sum + (t.principal / totalPrincipal) * t.annualInterestRate,
      0
    );
  }

  return {
    tracks: results,
    totalMonthlyPayment,
    totalInterestPaid,
    weightedAverageInterest,
  };
}

/**
 * Generate amortization schedule for all tracks combined
 */
export function generateAmortizationSchedule(
  tracks: MortgageTrack[]
): AmortizationRow[] {
  if (tracks.length === 0) return [];
  const maxMonths = Math.max(...tracks.map(t => t.years * 12));
  if (maxMonths <= 0) return [];
  const rows: AmortizationRow[] = [];

  // Initialize balances
  const balances = tracks.map(t => t.principal);

  // Accumulators for yearly sums (reset every 12 months)
  let yearlyPrincipalSum = 0;
  let yearlyInterestSum = 0;

  for (let month = 1; month <= maxMonths; month++) {
    let totalRemainingBalance = 0;

    tracks.forEach((track, i) => {
      const n = track.years * 12;
      if (month > n) {
        balances[i] = 0;
        return; // track finished — balance is 0
      }

      const r = track.annualInterestRate / 100 / 12;
      let mp: number;
      if (r === 0) {
        mp = track.principal / n;
      } else {
        mp = (track.principal * r) / (1 - Math.pow(1 + r, -n));
      }

      const interestPayment = balances[i] * r;
      const principalPayment = mp - interestPayment;
      balances[i] = Math.max(0, balances[i] - principalPayment);

      yearlyPrincipalSum += principalPayment;
      yearlyInterestSum += interestPayment;
      totalRemainingBalance += balances[i];
    });

    // Only add yearly rows to keep it manageable
    if (month % 12 === 0) {
      rows.push({
        year: month / 12,
        principalPayment: Math.round(yearlyPrincipalSum),
        interestPayment: Math.round(yearlyInterestSum),
        remainingBalance: Math.round(totalRemainingBalance),
      });
      // Reset accumulators for next year
      yearlyPrincipalSum = 0;
      yearlyInterestSum = 0;
    }
  }

  return rows;
}

/**
 * Sensitivity analysis - what happens if interest changes
 */
export function sensitivityAnalysis(
  tracks: MortgageTrack[],
  deltas: number[] = [-1, -0.5, 0, 0.5, 1, 1.5, 2]
): SensitivityResult[] {
  return deltas.map(delta => {
    const adjustedTracks = tracks.map(t => ({
      ...t,
      annualInterestRate: Math.max(0, t.annualInterestRate + delta),
    }));
    const result = calculateMortgage({ tracks: adjustedTracks });
    return {
      deltaPercent: delta,
      totalMonthlyPayment: result.totalMonthlyPayment,
      totalInterestPaid: result.totalInterestPaid,
    };
  });
}
