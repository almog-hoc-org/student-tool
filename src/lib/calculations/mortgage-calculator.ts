import {
  MortgageTrack,
  MortgageTrackResult,
  MortgageCalculatorInput,
  MortgageCalculatorOutput,
  AmortizationRow,
  SensitivityResult,
} from '@/types/mortgage-calculator';

export function calculateMortgageTrack(
  track: MortgageTrack
): MortgageTrackResult {
  const P = track.principal;
  const r = track.annualInterestRate / 100 / 12;
  const n = track.years * 12;

  let monthlyPayment: number;
  if (r === 0) {
    monthlyPayment = P / n;
  } else {
    monthlyPayment = (P * r) / (1 - Math.pow(1 + r, -n));
  }

  const totalPaid = monthlyPayment * n;
  const totalInterestPaid = totalPaid - P;

  return {
    trackId: track.id,
    monthlyPayment,
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
  const maxMonths = Math.max(...tracks.map(t => t.years * 12));
  const rows: AmortizationRow[] = [];

  // Initialize balances
  const balances = tracks.map(t => t.principal);

  for (let month = 1; month <= maxMonths; month++) {
    let totalPrincipalPayment = 0;
    let totalInterestPayment = 0;
    let totalRemainingBalance = 0;

    tracks.forEach((track, i) => {
      const n = track.years * 12;
      if (month > n) {
        return; // track finished
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

      totalPrincipalPayment += principalPayment;
      totalInterestPayment += interestPayment;
      totalRemainingBalance += balances[i];
    });

    // Only add yearly rows to keep it manageable
    if (month % 12 === 0) {
      rows.push({
        year: month / 12,
        principalPayment: Math.round(totalPrincipalPayment * 12),
        interestPayment: Math.round(totalInterestPayment * 12),
        remainingBalance: Math.round(totalRemainingBalance),
      });
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
