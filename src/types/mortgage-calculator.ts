export type MortgageTrackType = 'fixedUnlinked' | 'fixedLinked' | 'prime' | 'variableLinked';

export type MortgageTrack = {
  id: string;
  name: string;
  type: MortgageTrackType;
  principal: number;
  annualInterestRate: number;
  years: number;
};

export type MortgageCalculatorInput = {
  tracks: MortgageTrack[];
};

export type MortgageTrackResult = {
  trackId: string;
  monthlyPayment: number;
  totalInterestPaid: number;
};

export type MortgageCalculatorOutput = {
  tracks: MortgageTrackResult[];
  totalMonthlyPayment: number;
  totalInterestPaid: number;
  weightedAverageInterest: number;
};
