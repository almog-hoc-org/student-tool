export type MortgageTrackType = 'fixedUnlinked' | 'fixedLinked' | 'prime' | 'variableLinked';

export type MortgageAllocationMode = 'amount' | 'percent' | 'remainder';

export type MortgageTrack = {
  id: string;
  name: string;
  type: MortgageTrackType;
  principal: number;
  annualInterestRate: number;
  years: number;
  allocationMode?: MortgageAllocationMode;
  allocationValue?: number;
};

export type MortgageCalculatorInput = {
  tracks: MortgageTrack[];
};

export type MortgageTrackResult = {
  trackId: string;
  /** ההחזר החודשי הראשון (במסלול צמוד — ההחזר גדל עם המדד) */
  monthlyPayment: number;
  /** סך ריבית + הצמדה לאורך חיי המסלול */
  totalInterestPaid: number;
  /** עלות ההצמדה למדד בלבד (0 במסלולים לא צמודים) */
  linkageCost?: number;
};

export type MortgageCalculatorOutput = {
  tracks: MortgageTrackResult[];
  totalMonthlyPayment: number;
  totalInterestPaid: number;
  weightedAverageInterest: number;
  /** סך עלות ההצמדה למדד בכל המסלולים הצמודים */
  totalLinkageCost?: number;
};

export type AmortizationRow = {
  year: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
};

export type SensitivityResult = {
  deltaPercent: number;
  totalMonthlyPayment: number;
  totalInterestPaid: number;
};
