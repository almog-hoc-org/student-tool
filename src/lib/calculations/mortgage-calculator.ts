import {
  MortgageTrack,
  MortgageTrackResult,
  MortgageCalculatorInput,
  MortgageCalculatorOutput,
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
    weightedAverageInterest,
  };
}
